// scripts/delete-storage-queue.mjs
//
// GitHub Actions tarafından, Depolama sayfasından bir dosya silindiği anda
// tetiklenir (bkz. src/hooks/useStorageFiles.ts -> triggerDeletionWorker,
// aynı mailOutbox.ts deseni). Firestore'daki `storageDeletionQueue`
// koleksiyonunu tarar, bekleyen (status: 'pending') kayıtlardaki
// Cloudinary public_id'lerini imzalı (signed) bir istekle Cloudinary'den
// gerçekten siler.
//
// Neden burada (GitHub Actions) ve client'ta değil:
// Cloudinary'de asset silmek imzalı bir istek (API_SECRET ile HMAC-SHA1 imza)
// gerektirir. API_SECRET'ı tarayıcıya asla koyamayız — bu yüzden e-posta
// gönderiminde olduğu gibi bu işi de GitHub Actions üzerinden yapıyoruz.
// Firestore tarafındaki `storageFiles` kaydı zaten silme isteği anında
// (client tarafında) kaldırılıyor — bu script sadece Cloudinary'deki asıl
// dosyayı temizler; script çalışmasa/gecikse bile kullanıcı arayüzü ve
// depolama kullanım hesaplaması hemen doğru görünür.
//
// Gerekli ortam değişkenleri (GitHub Secrets'tan gelir):
//   FIREBASE_SERVICE_ACCOUNT_JSON  -> Firebase servis hesabı JSON'ının tamamı (tek satır)
//   CLOUDINARY_CLOUD_NAME          -> Cloudinary cloud adı
//   CLOUDINARY_API_KEY             -> Cloudinary API key
//   CLOUDINARY_API_SECRET          -> Cloudinary API secret (ASLA client'a koyma)

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'node:crypto';

const {
  FIREBASE_SERVICE_ACCOUNT_JSON,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON eksik. İşlem durduruldu.');
  process.exit(1);
}
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Cloudinary ortam değişkenleri eksik. İşlem durduruldu.');
  process.exit(1);
}

const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

/** Cloudinary Admin API için imzalı silme isteği atar (tek bir public_id). */
async function deleteFromCloudinary(publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary imza kuralı: parametreler alfabetik sıralanır ve
  // "key=value&key2=value2...API_SECRET" SHA-1 ile hashlenir.
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: CLOUDINARY_API_KEY,
    signature,
  });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  // Cloudinary asset zaten yoksa 'not found' döner — bunu da başarı sayıyoruz.
  if (data.result !== 'ok' && data.result !== 'not found') {
    throw new Error(`Cloudinary silme hatası (${publicId}): ${JSON.stringify(data)}`);
  }
}

async function main() {
  const snap = await db.collection('storageDeletionQueue').where('status', '==', 'pending').limit(50).get();

  if (snap.empty) {
    console.log('Bekleyen depolama silme isteği yok.');
    return;
  }

  for (const docSnap of snap.docs) {
    const { publicIds = [] } = docSnap.data();
    try {
      for (const publicId of publicIds) {
        await deleteFromCloudinary(publicId);
        console.log(`Silindi: ${publicId}`);
      }
      await docSnap.ref.update({ status: 'done', processedAt: FieldValue.serverTimestamp() });
    } catch (err) {
      console.error(`Kuyruk kaydı ${docSnap.id} işlenemedi:`, err.message);
      await docSnap.ref.update({ status: 'failed', error: String(err.message).slice(0, 500) });
    }
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
