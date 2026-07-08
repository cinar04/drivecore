// scripts/send-weekly-summary.mjs
//
// Haftada bir çalışır (bkz. .github/workflows/weekly-summary.yml).
// Her kurum (org) için sürücü/araç/uyarı istatistiklerini hesaplar ve
// kurum sahibi + yöneticilerine 'weekly_summary' şablonuyla mailOutbox
// kuyruğuna bir e-posta yazar. Gerçek gönderim, mevcut
// scripts/send-mail-outbox.mjs (her 10 dakikada bir çalışan cron) tarafından
// yapılır — bu script sadece "gönderilecek" dokümanı oluşturur.
//
// Gerekli ortam değişkenleri (GitHub Secrets'tan gelir):
//   FIREBASE_SERVICE_ACCOUNT_JSON  -> Firebase servis hesabı JSON'ının tamamı
//   APP_DASHBOARD_URL              -> Panel linki (ör. https://senin-domainin.com/#/dashboard)

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const {
  FIREBASE_SERVICE_ACCOUNT_JSON,
  APP_DASHBOARD_URL = 'https://senin-domainin.com/#/dashboard',
} = process.env;

if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON eksik. İşlem durduruldu.');
  process.exit(1);
}

const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// Ehliyet süresi bu kadar gün içinde bitiyorsa "bekleyen uyarı" sayılır.
const LICENSE_WARNING_DAYS = 30;

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return diffMs / (1000 * 60 * 60 * 24);
}

async function main() {
  const orgsSnap = await db.collection('orgs').get();

  if (orgsSnap.empty) {
    console.log('Kurum bulunamadı.');
    return;
  }

  let queued = 0;

  for (const orgDoc of orgsSnap.docs) {
    const org = orgDoc.data();
    const orgId = orgDoc.id;

    const [driversSnap, vehiclesSnap, membersSnap] = await Promise.all([
      db.collection('drivers').where('orgId', '==', orgId).get(),
      db.collection('vehicles').where('orgId', '==', orgId).get(),
      db.collection('orgMembers').where('orgId', '==', orgId)
        .where('role', 'in', ['owner', 'admin']).get(),
    ]);

    if (membersSnap.empty) continue; // gidecek yönetici yok

    const activeDrivers = driversSnap.docs.filter((d) => d.data().status === 'active').length;
    const totalVehicles = vehiclesSnap.size;

    const expiredOrSuspended = driversSnap.docs.filter((d) => d.data().status !== 'active').length;
    const expiringLicenses = driversSnap.docs.filter((d) => {
      const days = daysUntil(d.data().expiryDate);
      return days >= 0 && days <= LICENSE_WARNING_DAYS;
    }).length;
    const pendingAlerts = expiredOrSuspended + expiringLicenses;

    const totalKmNum = vehiclesSnap.docs.reduce((sum, v) => sum + (Number(v.data().mileage) || 0), 0);
    const totalKm = `${totalKmNum.toLocaleString('tr-TR')} km`;

    for (const memberDoc of membersSnap.docs) {
      const member = memberDoc.data();
      if (!member.email) continue;

      await db.collection('mailOutbox').add({
        to: member.email,
        template: 'weekly_summary',
        data: {
          orgName: org.name || 'Kurumun',
          activeDrivers,
          totalVehicles,
          pendingAlerts,
          totalKm,
          dashboardLink: APP_DASHBOARD_URL,
        },
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      });
      queued++;
    }
  }

  console.log(`${queued} haftalık özet e-postası kuyruğa alındı.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Script genel hata:', err);
    process.exit(1);
  });
