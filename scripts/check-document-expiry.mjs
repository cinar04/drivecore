// scripts/check-document-expiry.mjs
//
// Her gün çalışır (bkz. .github/workflows/document-expiry-check.yml).
// Her kurumdaki sürücülerin (Ehliyet — ön) VE araçların (trafik sigortası,
// koltuk sigortası, egzoz muayenesi, güzergah belgesi, fenni muayene)
// zamanlı belgelerini tarar. Son geçerlilik tarihine 7, 3, 2 veya 1 tam gün
// kaldıysa:
//   1. Kurumun "Uyarı Alacak Kişiler" listesindeki (settings.documentExpiryWatchers)
//      üyelere (boşsa kurum sahibi + yöneticilere) 'document_expiring'
//      şablonuyla mailOutbox kuyruğuna bir e-posta yazar.
//   2. Aynı kişilere sadece kendilerinin göreceği (targetUserIds) tek bir
//      Firestore bildirimi ('notifications') oluşturur — bu, hem uygulama
//      içi bildirim listesinde hem de (Electron açıksa) native bildirim
//      olarak görünür.
// Mükerrer gönderimi önlemek için her (varlık, belge, son tarih, eşik günü)
// kombinasyonu 'documentExpiryAlerts' koleksiyonunda işaretlenir — script
// günde birden fazla kez çalışsa bile aynı uyarı iki kez gönderilmez. Belge
// yenilenip son tarih değişirse anahtar da değişeceği için uyarılar otomatik
// olarak sıfırdan başlar.
//
// Gerekli ortam değişkenleri (GitHub Secrets'tan gelir):
//   FIREBASE_SERVICE_ACCOUNT_JSON  -> Firebase servis hesabı JSON'ının tamamı
//   APP_DRIVER_BASE_URL            -> Sürücü detay linki tabanı
//                                     (ör. https://senin-domainin.com/#/drivers)
//   APP_VEHICLE_BASE_URL           -> Araç detay linki tabanı
//                                     (ör. https://senin-domainin.com/#/vehicles)

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const {
  FIREBASE_SERVICE_ACCOUNT_JSON,
  APP_DRIVER_BASE_URL = 'https://senin-domainin.com/#/drivers',
  APP_VEHICLE_BASE_URL = 'https://senin-domainin.com/#/vehicles',
} = process.env;

if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON eksik. İşlem durduruldu.');
  process.exit(1);
}

const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// Süre dolmadan bu kadar gün kala uyarı gönderilir.
const ALERT_THRESHOLDS = [7, 3, 2, 1];

// Zamanlı belge olarak takip edilen sürücü belgeleri.
// (src/lib/driverDocuments.ts içindeki `timed: true` alanla eşleşmeli.)
const TIMED_DOC_FIELDS = [{ id: 'ehliyetOn', label: 'Ehliyet' }];

// Zamanlı belge olarak takip edilen araç belgeleri.
// (src/lib/vehicleDocuments.ts içindeki `timed: true` alanla eşleşmeli.)
const TIMED_VEHICLE_DOC_FIELDS = [
  { id: 'trafikSigortasi', label: 'Trafik Sigortası' },
  { id: 'koltukSigortasi', label: 'Koltuk Sigortası' },
  { id: 'egzozMuayenesi', label: 'Egzoz Muayenesi' },
  { id: 'guzergahBelgesi', label: 'Güzergah Belgesi' },
  { id: 'fenniMuayene', label: 'Fenni Muayene' },
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(target);
  startOfTarget.setHours(0, 0, 0, 0);
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateTr(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

async function main() {
  const orgsSnap = await db.collection('orgs').get();
  if (orgsSnap.empty) {
    console.log('Kurum bulunamadı.');
    return;
  }

  let queuedMails = 0;
  let queuedNotifications = 0;
  let skippedAlreadySent = 0;

  for (const orgDoc of orgsSnap.docs) {
    const org = orgDoc.data();
    const orgId = orgDoc.id;

    const driversSnap = await db.collection('drivers').where('orgId', '==', orgId).get();
    const vehiclesSnap = await db.collection('vehicles').where('orgId', '==', orgId).get();
    if (driversSnap.empty && vehiclesSnap.empty) continue;

    // Her belge/eşik kombinasyonu için tetiklenen sürücü/araçları topluyoruz —
    // aynı gün içinde birden fazla belge/varlık tetiklenirse hepsi için
    // TEK bir bildirim + kişi başına bir e-posta gönderilir.
    const triggered = []; // { entityType, entityId, entityName, docLabel, expiryDate, daysLeft }

    for (const driverDoc of driversSnap.docs) {
      const driver = driverDoc.data();
      const driverId = driverDoc.id;
      const documents = driver.driverDocuments || {};

      for (const { id: docId, label: docLabel } of TIMED_DOC_FIELDS) {
        const file = documents[docId];
        const expiryDate = file?.expiryDate;
        if (!expiryDate) continue;

        const daysLeft = daysUntil(expiryDate);
        if (daysLeft === null || !ALERT_THRESHOLDS.includes(daysLeft)) continue;

        // Mükerrer gönderim koruması — anahtar son tarihi de içerdiği için
        // belge yenilenince (yeni expiryDate) otomatik olarak sıfırlanır.
        const alertKey = `driver_${driverId}_${docId}_${expiryDate}_${daysLeft}`;
        const alertRef = db.collection('documentExpiryAlerts').doc(alertKey);
        const alertSnap = await alertRef.get();
        if (alertSnap.exists) {
          skippedAlreadySent++;
          continue;
        }
        await alertRef.set({
          orgId,
          driverId,
          docId,
          expiryDate,
          daysLeft,
          sentAt: FieldValue.serverTimestamp(),
        });

        triggered.push({
          entityType: 'driver',
          entityId: driverId,
          entityName: driver.fullName || 'Sürücü',
          docLabel,
          expiryDate,
          daysLeft,
        });
      }
    }

    for (const vehicleDoc of vehiclesSnap.docs) {
      const vehicle = vehicleDoc.data();
      const vehicleId = vehicleDoc.id;
      const documents = vehicle.vehicleDocuments || {};

      for (const { id: docId, label: docLabel } of TIMED_VEHICLE_DOC_FIELDS) {
        const file = documents[docId];
        const expiryDate = file?.expiryDate;
        if (!expiryDate) continue;

        const daysLeft = daysUntil(expiryDate);
        if (daysLeft === null || !ALERT_THRESHOLDS.includes(daysLeft)) continue;

        const alertKey = `vehicle_${vehicleId}_${docId}_${expiryDate}_${daysLeft}`;
        const alertRef = db.collection('documentExpiryAlerts').doc(alertKey);
        const alertSnap = await alertRef.get();
        if (alertSnap.exists) {
          skippedAlreadySent++;
          continue;
        }
        await alertRef.set({
          orgId,
          vehicleId,
          docId,
          expiryDate,
          daysLeft,
          sentAt: FieldValue.serverTimestamp(),
        });

        const vehicleName = vehicle.vehicleName
          ? `${vehicle.vehicleName}${vehicle.plate ? ` (${vehicle.plate})` : ''}`
          : (vehicle.plate || 'Araç');

        triggered.push({
          entityType: 'vehicle',
          entityId: vehicleId,
          entityName: vehicleName,
          docLabel,
          expiryDate,
          daysLeft,
        });
      }
    }

    if (triggered.length === 0) continue;

    // Uyarı alacak kişiler: kurum ayarlarında seçilmişse onlar, yoksa
    // varsayılan olarak kurum sahibi + yöneticiler.
    let watcherUids = org.settings?.documentExpiryWatchers;
    let watcherMembers = [];
    if (Array.isArray(watcherUids) && watcherUids.length > 0) {
      const membersSnap = await db.collection('orgMembers')
        .where('orgId', '==', orgId).where('uid', 'in', watcherUids.slice(0, 10)).get();
      watcherMembers = membersSnap.docs.map((d) => d.data());
    } else {
      const membersSnap = await db.collection('orgMembers')
        .where('orgId', '==', orgId).where('role', 'in', ['owner', 'admin']).get();
      watcherMembers = membersSnap.docs.map((d) => d.data());
    }

    if (watcherMembers.length === 0) continue;

    // Her sürücü/araç + belge tetiklemesi için: her izleyiciye bir e-posta +
    // tek bir paylaşımlı bildirim dokümanı (targetUserIds ile sadece onlara görünür).
    for (const item of triggered) {
      const entityLink = item.entityType === 'vehicle'
        ? `${APP_VEHICLE_BASE_URL}/${item.entityId}`
        : `${APP_DRIVER_BASE_URL}/${item.entityId}`;

      for (const member of watcherMembers) {
        if (!member.email) continue;
        await db.collection('mailOutbox').add({
          to: member.email,
          template: 'document_expiring',
          data: {
            driverName: item.entityName,
            docLabel: item.docLabel,
            daysLeft: String(item.daysLeft),
            expiryDateFormatted: formatDateTr(item.expiryDate),
            driverLink: entityLink,
            entityType: item.entityType,
          },
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
        });
        queuedMails++;
      }

      await db.collection('notifications').add({
        orgId,
        type: 'license_expiring',
        title: `${item.docLabel} süresi yaklaşıyor`,
        message: `${item.entityName}: ${item.docLabel} belgesinin süresi ${item.daysLeft} gün sonra (${formatDateTr(item.expiryDate)}) doluyor.`,
        entityId: item.entityId,
        targetUserIds: watcherMembers.map((m) => m.uid),
        read: false,
        readBy: [],
        createdAt: FieldValue.serverTimestamp(),
      });
      queuedNotifications++;
    }
  }

  console.log(`${queuedMails} e-posta kuyruğa alındı, ${queuedNotifications} bildirim oluşturuldu, ${skippedAlreadySent} zaten gönderilmiş uyarı atlandı.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Script genel hata:', err);
    process.exit(1);
  });
