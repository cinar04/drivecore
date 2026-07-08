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

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const {
  FIREBASE_SERVICE_ACCOUNT_JSON,
  RESEND_API_KEY,
  MAIL_FROM = 'DriveCore <onboarding@resend.dev>',
  // Şifre sıfırlama linkinin yönlendireceği kendi sayfamız (Firebase'in
  // varsayılan boş/beyaz action-handler sayfası DEĞİL). HashRouter kullandığımız
  // için '#/reset-password' formatında olmalı. Kendi domainine göre GitHub
  // Secrets'a APP_RESET_PASSWORD_URL olarak ekle.
  APP_RESET_PASSWORD_URL = 'https://senin-domainin.com/#/reset-password',
  // E-postalardaki logo — public/icon-512.png dosyanın canlıdaki tam adresi.
  // E-posta istemcileri yerel dosya gösteremez, mutlaka herkese açık bir URL olmalı.
  APP_LOGO_URL = 'https://senin-domainin.com/icon-512.png',
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

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);
const adminAuth = getAuth(app);

// ─── Türkçe e-posta şablonları ──────────────────────────────────────────────

// Preheader: Gmail/Outlook'ta konu satırının altında görünen gizli önizleme metni.
const preheaderBlock = (text) => `
  <div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#0F172A;">
    ${escapeHtml(text)}
  </div>`;

const ctaButton = (href, label, color = '#2563EB') => `
  <p style="margin:24px 0;">
    <a href="${href}" style="background-color:${color};color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
      ${label}
    </a>
  </p>`;

// İsimden inisiyal rozeti üretir (ör. "Ahmet Yılmaz" -> "AY")
const initials = (name = '') =>
  String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';

const avatarBadge = (name) => `
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
    <div style="width:40px;height:40px;border-radius:50%;background-color:#2563EB;color:#fff;font-size:14px;
                font-weight:700;text-align:center;line-height:40px;font-family:Inter,system-ui,sans-serif;">
      ${escapeHtml(initials(name))}
    </div>
    <div>
      <p style="color:#F1F5F9;font-size:14px;margin:0;font-weight:700;">${escapeHtml(name)}</p>
    </div>
  </div>`;

const wrap = (title, bodyHtml, { preheader, accent = '#2563EB' } = {}) => `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Dark-mode uyumluluğu: bazı istemciler (Outlook.com, Gmail, Apple Mail)
       kendi karanlık mod ters-çevirmesini uygulayıp koyu temayı bozabiliyor.
       Bu etiketler istemciye "bu tasarım zaten karanlık moda göre yapıldı,
       renkleri değiştirme" der. -->
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <!--[if mso]><meta http-equiv="X-UA-Compatible" content="IE=edge"><![endif]-->
  <style>
    :root { color-scheme: dark light; supported-color-schemes: dark light; }
    @media (prefers-color-scheme: light) {
      .dc-bg { background-color:#0F172A !important; }
      .dc-card { background-color:#1a2537 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0F172A;font-family:Inter,system-ui,sans-serif;">
  ${preheader ? preheaderBlock(preheader) : ''}
  <table width="100%" cellpadding="0" cellspacing="0" class="dc-bg" style="background-color:#0F172A;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" class="dc-card" style="background-color:#1a2537;border-radius:16px;overflow:hidden;border:1px solid ${accent}4d;">
        <tr><td style="padding:28px 32px 16px;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <img src="${APP_LOGO_URL}" width="28" height="28" alt="DriveCore" style="display:block;border-radius:8px;border:0;">
            <span style="color:#60A5FA;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;">DriveCore</span>
          </div>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <h1 style="color:#F1F5F9;font-size:20px;margin:0 0 16px;">${title}</h1>
          <div style="color:#94A3B8;font-size:14px;line-height:1.6;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(148,163,184,0.5);font-size:11px;margin:0 0 6px;">Bu e-posta DriveCore tarafından otomatik gönderilmiştir.</p>
          <p style="color:rgba(148,163,184,0.4);font-size:11px;margin:0;">
            <a href="#" style="color:#60A5FA;text-decoration:none;">Bildirim tercihlerini yönet</a>
          </p>
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
       ${ctaButton(data.dashboardLink || 'https://senin-domainin.com/#/dashboard', 'Panele Git →')}
       <p style="margin-top:8px;">İyi çalışmalar!</p>`,
      { preheader: `DriveCore hesabın hazır, ${data.fullName} — panele göz atmaya ne dersin?` }
    ),
  }),

  org_invite: (data) => ({
    subject: `${data.orgName} kurumuna davet edildin`,
    html: wrap(
      `${escapeHtml(data.orgName)} kurumuna davet edildin`,
      `${avatarBadge(data.invitedBy)}
       <p><strong>${escapeHtml(data.invitedBy)}</strong> seni <strong>${escapeHtml(data.orgName)}</strong> kurumuna
       <strong>${escapeHtml(data.role)}</strong> rolüyle davet etti.</p>
       ${ctaButton(data.inviteLink, 'Daveti Kabul Et →')}
       <p style="font-size:12px;color:rgba(148,163,184,0.6);">Bu davet 7 gün içinde geçerliliğini yitirir.</p>`,
      { preheader: `${data.invitedBy} seni ${data.orgName} kurumuna davet etti — daveti kabul etmek için tıkla.` }
    ),
  }),

  org_removed: (data) => ({
    subject: `${data.orgName} kurumundan çıkarıldın`,
    html: wrap(
      `${escapeHtml(data.orgName)} kurumundan çıkarıldın`,
      `<p><strong>${escapeHtml(data.orgName)}</strong> kurumundaki üyeliğin sonlandırıldı.
       Bu kuruma ait sürücü/araç verilerine artık erişimin olmayacak.</p>
       <p style="margin-top:8px;">Bir yanlışlık olduğunu düşünüyorsan kurum yöneticinle iletişime geç.</p>
       ${ctaButton('mailto:destek@senin-domainin.com', 'Destek İle İletişime Geç →', '#475569')}`,
      { preheader: `${data.orgName} kurumundaki üyeliğin sonlandırıldı.` }
    ),
  }),

  password_reset: (data) => ({
    subject: `DriveCore şifre sıfırlama isteği`,
    html: wrap(
      `Şifreni mi unuttun?`,
      `<p>Hesabın için bir şifre sıfırlama isteği aldık. Aşağıdaki butona tıklayarak yeni bir şifre belirleyebilirsin.</p>
       ${ctaButton(data.resetLink, 'Şifreni Sıfırla →')}
       <p style="font-size:12px;color:rgba(148,163,184,0.6);">Bu bağlantı 1 saat içinde geçerliliğini yitirir. Bu isteği sen yapmadıysan
       bu e-postayı görmezden gelebilirsin — şifren değişmeyecek.</p>`,
      { preheader: 'Şifreni sıfırlamak için bağlantıya tıkla. İstemediysen görmezden gel.', accent: '#F59E0B' }
    ),
  }),

  weekly_summary: (data) => ({
    subject: `${data.orgName} — haftalık özetin hazır`,
    html: wrap(
      `Haftalık özetin hazır`,
      `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
         <tr>
           <td width="33%" style="background-color:rgba(255,255,255,0.03);border-radius:10px;padding:14px;text-align:center;">
             <p style="color:#60A5FA;font-size:22px;font-weight:700;margin:0;">${data.activeDrivers}</p>
             <p style="color:#94A3B8;font-size:11px;margin:4px 0 0;">Aktif Sürücü</p>
           </td>
           <td width="4%"></td>
           <td width="33%" style="background-color:rgba(255,255,255,0.03);border-radius:10px;padding:14px;text-align:center;">
             <p style="color:#60A5FA;font-size:22px;font-weight:700;margin:0;">${data.totalVehicles}</p>
             <p style="color:#94A3B8;font-size:11px;margin:4px 0 0;">Araç</p>
           </td>
           <td width="4%"></td>
           <td width="33%" style="background-color:${data.pendingAlerts > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)'};border-radius:10px;padding:14px;text-align:center;">
             <p style="color:${data.pendingAlerts > 0 ? '#FBBF24' : '#60A5FA'};font-size:22px;font-weight:700;margin:0;">${data.pendingAlerts}</p>
             <p style="color:#94A3B8;font-size:11px;margin:4px 0 0;">Bekleyen Uyarı</p>
           </td>
         </tr>
       </table>
       <p>${escapeHtml(data.orgName)} kurumunda toplam filo kilometresi <strong>${data.totalKm}</strong>.
       ${data.pendingAlerts > 0 ? `<strong style="color:#FBBF24;">${data.pendingAlerts} adet ehliyet/bakım uyarını</strong> incelemeni öneririz.` : 'Bekleyen bir uyarın yok, her şey yolunda görünüyor.'}</p>
       ${ctaButton(data.dashboardLink || 'https://senin-domainin.com/#/dashboard', 'Tam Raporu Gör →')}`,
      { preheader: `${data.orgName}: ${data.activeDrivers} sürücü, ${data.totalVehicles} araç, ${data.pendingAlerts} bekleyen uyarı.` }
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
      let templateData = mail.data || {};

      // Şifre sıfırlama: linki (oobCode) burada, Admin SDK ile üretiyoruz.
      // actionCodeSettings.url sayesinde link Firebase'in varsayılan boş
      // action-handler sayfasına değil, doğrudan kendi ResetPasswordPage'imize gider.
      if (mail.template === 'password_reset') {
        const resetLink = await adminAuth.generatePasswordResetLink(mail.to, {
          url: APP_RESET_PASSWORD_URL,
        });
        templateData = { ...templateData, resetLink };
      }

      const { subject, html } = buildTemplate(templateData);
      await sendViaResend(mail.to, subject, html);
      await docSnap.ref.update({ status: 'sent', sentAt: FieldValue.serverTimestamp() });
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
