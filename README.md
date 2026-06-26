# 🚗 DriveCore — Premium Sürücü & Araç Yönetim Platformu

Ultra-premium bir sürücü ehliyeti ve araç yönetim platformu. Firebase + React 19 + TypeScript + Tailwind CSS ile inşa edilmiştir.

---

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Firebase Projesi Oluştur
1. [Firebase Console](https://console.firebase.google.com) → Yeni Proje
2. **Authentication** → Sign-in methods → Email/Password + Google'ı etkinleştir
3. **Firestore Database** → Production mode'da oluştur
4. **Storage** → Bucket oluştur
5. Proje ayarları → Uygulamanı ekle (Web)

### 3. Ortam Değişkenlerini Ayarla
```bash
cp .env.example .env
```
`.env` dosyasını Firebase bilgilerinle doldur:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Firestore Kurallarını Yükle
Firebase Console → Firestore → Kurallar → `firestore.rules` dosyasını yapıştır.

### 5. İlk Admin Kullanıcısını Oluştur
Uygulamada kaydolduktan sonra Firebase Console'dan Firestore'a git:
`admins` koleksiyonunda kullanıcının dokümanını bul → `role` alanını `"admin"` olarak değiştir.

### 6. Geliştirme Sunucusunu Başlat
```bash
npm run dev
```

---

## 🏗️ Teknoloji Yığını

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| React | 19 | UI Framework |
| TypeScript | 5 | Tip güvenliği |
| Vite | 6 | Build tool |
| Tailwind CSS | 3 | Stil |
| Firebase | 11 | Auth + DB + Storage |
| React Router | 6 | Routing |
| React Hook Form | 7 | Form yönetimi |
| Zod | 3 | Schema validasyon |
| Framer Motion | 11 | Animasyonlar |
| Recharts | 2 | Grafikler |
| TanStack Query | 5 | Server state |
| Lucide React | — | İkonlar |
| QRCode | — | Dijital ehliyet QR |

---

## 📁 Proje Yapısı

```
src/
├── components/
│   ├── drivers/          # Sürücü bileşenleri
│   │   ├── DriverForm.tsx
│   │   └── DigitalLicenseCard.tsx
│   ├── layout/           # Ana layout
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── shared/           # Paylaşılan bileşenler
│   │   └── ProtectedRoute.tsx
│   ├── ui/               # Temel UI bileşenleri
│   │   ├── StarRating.tsx
│   │   ├── AnimatedCounter.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── Modal.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── EmptyState.tsx
│   │   └── SearchBar.tsx
│   └── vehicles/         # Araç bileşenleri
│       └── VehicleForm.tsx
├── context/
│   ├── AuthContext.tsx   # Firebase auth yönetimi
│   └── ToastContext.tsx  # Bildirim sistemi
├── hooks/
│   ├── useDrivers.ts     # Sürücü CRUD
│   ├── useVehicles.ts    # Araç CRUD
│   ├── useActivityLog.ts # Aktivite günlüğü
│   ├── useNotifications.ts
│   └── useFileUpload.ts  # Firebase Storage
├── lib/
│   └── firebase.ts       # Firebase config
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── DashboardPage.tsx
│   ├── DriversPage.tsx
│   ├── DriverDetailPage.tsx
│   ├── VehiclesPage.tsx
│   ├── VehicleDetailPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── ActivityPage.tsx
│   ├── NotificationsPage.tsx
│   └── SettingsPage.tsx
├── types/
│   └── index.ts          # TypeScript tipleri
└── utils/
    └── index.ts          # Yardımcı fonksiyonlar
```

---

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- Email + Şifre girişi
- Google ile giriş
- Şifre sıfırlama
- Rol tabanlı erişim (Admin / Personel)
- Korumalı rotalar

### 👤 Sürücü Yönetimi
- Tam CRUD (Ekle/Düzenle/Sil/Görüntüle)
- 5 kategoride yıldız puanlama sistemi
- Dijital ehliyet kartı + QR kod
- Tablo ve kart görünümü
- Arama ve gelişmiş filtreleme
- CSV dışa aktarma

### 🚗 Araç Yönetimi
- Tam CRUD
- 8 kategoride performans puanlaması
- Radar chart ile performans analizi
- Sürücü-araç ilişkilendirmesi
- Resim yükleme (drag & drop)

### 📊 Dashboard
- Gerçek zamanlı istatistik kartları
- Animasyonlu sayaçlar
- Büyüme grafikleri (Recharts)
- Lisans türleri pasta grafiği
- En iyi sürücüler listesi

### 📈 Analitik
- Aylık büyüme trendi
- Puan dağılım grafiği
- Yakıt türü analizi
- Marka dağılımı
- Durum dağılımı

### 🔔 Bildirimler
- Gerçek zamanlı bildirim merkezi
- Okunmamış sayaç
- Türe göre filtreleme

### 📋 Aktivite Günlüğü
- Tüm işlemlerin kaydı
- Kim-ne zaman takibi
- Arama ve filtreleme

### ⚙️ Ayarlar
- Profil yönetimi
- Şifre değiştirme
- Bildirim tercihleri
- Tema seçimi

---

## 🎨 Tasarım Sistemi

**Renk Paleti:**
- Primary: `#2563EB`
- Secondary: `#06B6D4`
- Success: `#10B981`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Background: `#0F172A`
- Surface: `#1E293B`

**Tasarım İlkeleri:**
- Glassmorphism kartlar
- Yumuşak gölgeler + glow efektleri
- Framer Motion animasyonları
- Responsive (mobil/tablet/masaüstü)
- Loading skeleton states
- Empty state bileşenleri

---

## 🛡️ Güvenlik

- Firestore güvenlik kuralları (`firestore.rules`)
- Rol tabanlı erişim kontrolü
- Form validasyonu (Zod)
- Dosya tipi ve boyut doğrulama
- Korumalı rotalar (ProtectedRoute)

---

## 📦 Build

```bash
npm run build
```

Build çıktısı `dist/` klasörüne gider. Vercel, Netlify veya Firebase Hosting'e deploy edilebilir.

