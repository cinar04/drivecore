# DriveCore — Electron Kurulum & Güncelleme Rehberi

## Gereksinimler
- Node.js 18+ → https://nodejs.org
- GitHub hesabı (otomatik güncelleme için)

---

## Kurulum Adımları

### 1. Bağımlılıkları yükle
```bash
npm install
```

### 2. Windows .exe üretmek için
```bash
npm run electron:build:win
```
> `release/` klasöründe `DriveCore Setup 1.0.0.exe` oluşur.

---

## Otomatik Güncelleme Kurulumu

### Adım 1 — GitHub repo oluştur
GitHub'da yeni bir **public** repo aç (örn. `drivecore-app`).

### Adım 2 — package.json'ı güncelle
`package.json` içindeki şu satırı düzenle:
```json
"publish": {
  "provider": "github",
  "owner": "SENIN_GITHUB_KULLANICI_ADIN",  ← bunu değiştir
  "repo": "drivecore-app"
}
```

### Adım 3 — GitHub Token oluştur
1. GitHub → Settings → Developer Settings → Personal Access Tokens
2. `repo` iznini seç
3. Token'ı kopyala

### Adım 4 — Yayınla
```bash
# Token'ı ortam değişkeni olarak set et
set GH_TOKEN=github_pat_...   (Windows CMD)
$env:GH_TOKEN="github_pat_..." (PowerShell)

# Build al ve GitHub Releases'a yükle
npm run electron:publish
```

### Adım 5 — Release'i yayınla
GitHub → Releases sayfasına git → Draft release'i "Publish" et.

---

## Güncelleme Nasıl Çalışır?

```
Uygulama açılır
      ↓ (30 saniye sonra)
GitHub Releases kontrol edilir
      ↓ yeni sürüm varsa
Arkaplanda sessizce indirilir
      ↓ indirme bitince
Sağ altta bildirim gösterilir
      ↓ kullanıcı onaylarsa
Uygulama kapanıp yeni sürüm kurulur
```

- Kontrol **her 4 saatte bir** tekrarlanır
- Kullanıcı bildirimi kapatabilir (güncelleme iptal olmaz, sonraki açılışta tekrar sorar)
- Hata olursa sessizce geçer, kullanıcıya gösterilmez

---

## Yeni Sürüm Yayınlamak

1. `package.json`'da `"version"` numarasını artır (ör. `1.0.0` → `1.1.0`)
2. `npm run electron:publish` çalıştır
3. GitHub Releases'ta draft release'i yayınla
4. Tüm kullanıcılara otomatik güncelleme gider

---

## Klasör Yapısı
```
drivecore/
├── electron/
│   ├── main.cjs          ← Electron ana process + auto-updater
│   └── preload.cjs       ← IPC köprüsü
├── src/
│   └── components/
│       └── updater/
│           └── UpdateNotification.tsx  ← Güncelleme bildirimi UI
├── dist/                 ← Vite build çıktısı (otomatik)
└── release/              ← .exe çıktısı (otomatik)
```
