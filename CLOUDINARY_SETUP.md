# ☁️ Cloudinary Kurulum Rehberi

DriveCore, görsel yükleme için **Firebase Storage yerine Cloudinary CDN** kullanır.
Bu sayede otomatik görsel optimizasyonu, WebP dönüşümü ve global CDN hızından faydalanılır.

---

## 1. Cloudinary Hesabı Oluştur

[cloudinary.com/users/register_free](https://cloudinary.com/users/register_free) adresine git → Ücretsiz hesap oluştur.

---

## 2. Cloud Name'i Al

Dashboard'a gir → Sol üstte **Cloud Name** yazar. Bunu kopyala.

---

## 3. Upload Preset Oluştur

1. **Settings** → **Upload** sekmesine git
2. Aşağı kaydır → **Upload presets** bölümünü bul
3. **Add upload preset** tıkla
4. Şu ayarları yap:

| Alan | Değer |
|------|-------|
| Preset name | `drivecore_preset` (istediğin isim) |
| Signing mode | **Unsigned** ⚠️ (zorunlu) |
| Folder | `drivecore` |
| Auto tagging | İsteğe bağlı |

5. **Save** tıkla

---

## 4. .env Dosyasını Doldur

```bash
cp .env.example .env
```

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_buraya
VITE_CLOUDINARY_UPLOAD_PRESET=drivecore_preset
```

---

## 5. Test Et

Uygulamayı çalıştır → Sürücü Ekle → Profil fotoğrafı yükle.
Cloudinary Dashboard'da **Media Library → drivecore/profiles** klasörüne bakarak doğrula.

---

## ✨ Otomatik Optimizasyon

Kod, yüklenen görselleri otomatik olarak optimize eder:

### Profil Fotoğrafları
```
/upload/w_300,h_300,c_fill,g_face,q_auto,f_auto/...
```
- 300×300 piksel, yüze odaklanmış kırpma
- Otomatik WebP/AVIF dönüşümü
- Otomatik kalite optimizasyonu

### Araç Görselleri
```
/upload/w_800,q_auto,f_auto,c_scale/...
```
- 800px genişlik, orantılı yükseklik
- Otomatik format seçimi

---

## 🔒 Güvenlik Notu

**Unsigned preset** kullandığınız için herkes yükleme yapabilir.
Production ortamında şunları yapmanız önerilir:

1. Cloudinary'de **upload limit** belirle (Settings → Security)
2. Dosya boyutu limiti koy (max 5MB kod tarafında uygulanıyor)
3. Allowed formats: `jpg,png,webp,gif`
4. İsteğe bağlı: **Signed uploads** için backend endpoint ekle

---

## 🆓 Ücretsiz Plan Limitleri

| Özellik | Limit |
|---------|-------|
| Depolama | 25 GB |
| Bant Genişliği | 25 GB/ay |
| Dönüşüm Kredisi | 25 kredi/ay |
| Toplam Görsel | Sınırsız |

Küçük-orta projeler için fazlasıyla yeterlidir.

