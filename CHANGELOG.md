# DriveCore — Değişiklik Günlüğü

## v2.0.0 — Haziran 2025

### 🎨 Açık Mod (Light Mode)
- Tam açık/koyu mod desteği — LocalStorage'a kaydedilir, sistem temasını da okur
- Tüm bileşenler CSS değişkenleri (`--text-primary`, `--bg-card` vb.) kullanacak şekilde yeniden yazıldı
- Sidebar, Header, Modal, Form, Kart, Grafik — her bileşen her iki modda okunabilir
- Sidebar'da Güneş/Ay ikonu ile anında geçiş

### 🪟 Custom Titlebar
- Native başlık çubuğu kaldırıldı, sıfırdan tasarlanmış başlık çubuğu eklendi
- Windows: Küçült / Büyüt / Kapat butonları, kapat → minimize to tray
- macOS: Traffic lights korundu
- Kapatma butonu uygulamayı tamamen kapatmaz — sistem tepsisine küçülür

### 🗂️ Sistem Tepsisi (System Tray)
- Uygulama kapatıldığında arka planda çalışmaya devam eder
- Tepsi menüsü: Aç, Güncelleme Kontrol Et, Çıkış
- Güncelleme bulununca tepsi balonu bildirimi

### ✅ Toplu İşlem Barı (Bulk Actions)
- Sürücüler ve Araçlar listelerinde çoklu seçim desteği
- Seçim yapılınca ekranın altında animasyonlu aksiyon barı
- Dışa Aktar, Aktifleştir, Askıya Al, Sil aksiyonları

### 📤 Dışa Aktarma (Export)
- CSV, Excel (.xlsx) ve JSON formatlarında dışa aktarma
- Türkçe karakter desteği (UTF-8 BOM)
- Her tablo sayfasına Dışa Aktar butonu

### 🔍 Aktivite Filtresi
- Aktivite günlüğünde arama, tarih aralığı, işlem türü ve kullanıcı filtreleri
- Genişletilebilir filtre paneli, aktif filtre sayısı göstergesi

### 🔄 Güncelleme Sistemi
- Otomatik indirme kapatıldı — güncelleme bulununca kullanıcıya sorulur
- Windows native dialog'u kaldırıldı — sadece uygulama içi bildirim
- İlerleme çubuğu: indirilen MB, hız, kalan gösterir
- "Şimdi Yeniden Başlat" butonu uygulama içinde

### 🐛 Düzeltmeler
- "DriveCore" sidebar yazısı gradient yerine düz renk — her modda görünür
- Form inputları açık modda okunabilir (arka plan, metin rengi)
- Select dropdown'lar açık modda düzgün görünür
- Grafik tooltip'leri her iki modda okunabilir
