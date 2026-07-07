// scripts/send-mail-outbox.mjs
//
// GitHub Actions tarafından her birkaç dakikada bir çalıştırılır.
// Firestore'daki `mailOutbox` koleksiyonunu tarar, bekleyen (status: 'pending')
// e-postaları Resend API üzerinden gönderir ve sonucu dokümana yazar.
//
// Neden burada (GitHub Actions) ve Firebase Cloud Functions'ta değil:
// Firebase'in ücretsiz (Spark) planı Cloud Functions'tan dışarıya (Resend gibi)
// ağ isteği atılmasına izin vermiyor — bu da ödemeli Blaze planını gerektiriyor.
// GitHub Actions tamamen ücretsiz olduğu için aynı işi buradan yapıyoruz.
//
// Gerekli ortam değişkenleri (GitHub Secrets'tan gelir):
//   FIREBASE_SERVICE_ACCOUNT_JSON  -> Firebase servis hesabı JSON'ının tamamı (tek satır)
//   RESEND_API_KEY                -> Resend.com API anahtarı
//   MAIL_FROM                     -> Gönderen adresi (ör. "DriveCore <bildirim@senin-domainin.com>")
//                                     Domain doğrulamadıysan Resend'in test adresini kullan:
//                                     "DriveCore <onboarding@resend.dev>"

import admin from 'firebase-admin';

const {
  FIREBASE_SERVICE_ACCOUNT_JSON,
  RESEND_API_KEY,
  MAIL_FROM = 'DriveCore <onboarding@resend.dev>',
} = process.env;

if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON eksik. İşlem durduruldu.');
  process.exit(1);
}
if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY eksik. İşlem durduruldu.');
  process.exit(1);
}

const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─── Türkçe e-posta şablonları ──────────────────────────────────────────────

const wrap = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="tr">
<body style="margin:0;padding:0;background-color:#0F172A;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F172A;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a2537;border-radius:16px;overflow:hidden;border:1px solid rgba(37,99,235,0.3);">
        <tr><td style="padding:28px 32px 16px;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <div style="width:32px;height:32px;border-radius:8px;background-color:#2563EB;display:inline-block;"></div>
            <span style="color:#60A5FA;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;">DriveCore</span>
          </div>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <h1 style="color:#F1F5F9;font-size:20px;margin:0 0 16px;">${title}</h1>
          <div style="color:#94A3B8;font-size:14px;line-height:1.6;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(148,163,184,0.5);font-size:11px;margin:0;">Bu e-posta DriveCore tarafından otomatik gönderilmiştir.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const templates = {
  welcome: (data) => ({
    subject: `DriveCore'a hoş geldin, ${data.fullName}!`,
    html: wrap(
      `Hoş geldin, ${escapeHtml(data.fullName)} 👋`,
      `<p>DriveCore hesabın başarıyla oluşturuldu. Artık filo yönetimine başlayabilirsin — sürücülerini ve araçlarını ekleyerek keşfetmeye başla.</p>
       <p style="margin-top:20px;">İyi çalışmalar!</p>`
    ),
  }),

  org_invite: (data) => ({
    subject: `${data.orgName} kurumuna davet edildin`,
    html: wrap(
      `${escapeHtml(data.orgName)} kurumuna davet edildin`,
      `<p><strong>${escapeHtml(data.invitedBy)}</strong> seni <strong>${escapeHtml(data.orgName)}</strong> kurumuna
       <strong>${escapeHtml(data.role)}</strong> rolüyle davet etti.</p>
       <p style="margin:24px 0;">
         <a href="${data.inviteLink}" style="background-color:#2563EB;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
           Daveti Kabul Et
         </a>
       </p>
       <p style="font-size:12px;color:rgba(148,163,184,0.6);">Bu davet 7 gün içinde geçerliliğini yitirir.</p>`
    ),
  }),

  org_removed: (data) => ({
    subject: `${data.orgName} kurumundan çıkarıldın`,
    html: wrap(
      `${escapeHtml(data.orgName)} kurumundan çıkarıldın`,
      `<p><strong>${escapeHtml(data.orgName)}</strong> kurumundaki üyeliğin sonlandırıldı.
       Bu kuruma ait sürücü/araç verilerine artık erişimin olmayacak.</p>
       <p style="margin-top:20px;">Bir yanlışlık olduğunu düşünüyorsan kurum yöneticinle iletişime geç.</p>`
    ),
  }),
};

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendViaResend(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: MAIL_FROM, to, subject, html }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API hatası (${res.status}): ${errText}`);
  }
}

async function main() {
  const snap = await db.collection('mailOutbox').where('status', '==', 'pending').limit(50).get();

  if (snap.empty) {
    console.log('Bekleyen e-posta yok.');
    return;
  }

  console.log(`${snap.size} bekleyen e-posta bulundu.`);

  for (const docSnap of snap.docs) {
    const mail = docSnap.data();
    const buildTemplate = templates[mail.template];

    if (!buildTemplate) {
      console.warn(`Bilinmeyen şablon: ${mail.template} (${docSnap.id}) — atlanıyor.`);
      await docSnap.ref.update({ status: 'failed', error: 'unknown_template' });
      continue;
    }

    try {
      const { subject, html } = buildTemplate(mail.data || {});
      await sendViaResend(mail.to, subject, html);
      await docSnap.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
      console.log(`Gönderildi: ${mail.to} (${mail.template})`);
    } catch (err) {
      console.error(`Gönderilemedi (${docSnap.id}):`, err.message);
      await docSnap.ref.update({ status: 'failed', error: String(err.message).slice(0, 500) });
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Script genel hata:', err);
    process.exit(1);
  });
