# 🏢 Çok Kiracılı Kurum Sistemi

## Nasıl Çalışır?

### Kullanıcı Akışı
1. Kullanıcı kayıt olur / giriş yapar
2. **Kurum oluşturur** veya **davet linki** ile mevcut kuruma katılır
3. Dashboard'da yalnızca o kurumun verilerini görür
4. Birden fazla kuruma üye olabilir ve **kurumlar arası geçiş** yapabilir

---

## Firestore Yapısı

```
orgs/{orgId}
  └─ name, slug, logo, ownerId, plan

orgMembers/{orgId}_{uid}
  └─ uid, email, fullName, role, orgId, joinedAt

orgInvites/{inviteId}
  └─ orgId, email, role, token, status, expiresAt

drivers/{driverId}
  └─ orgId ← her sürücü bir kuruma aittir

vehicles/{vehicleId}
  └─ orgId ← her araç bir kuruma aittir

activityLogs/{logId}
  └─ orgId ← her log bir kuruma aittir

notifications/{notifId}
  └─ orgId ← her bildirim bir kuruma aittir
```

---

## Rol Yetki Tablosu

| İşlem                      | viewer | staff | admin | owner |
|----------------------------|:------:|:-----:|:-----:|:-----:|
| Veri görüntüleme           | ✅     | ✅    | ✅    | ✅    |
| Sürücü / araç ekle, düzenle| ❌     | ✅    | ✅    | ✅    |
| Sürücü / araç sil          | ❌     | ❌    | ✅    | ✅    |
| Üye davet et / yönet       | ❌     | ❌    | ✅    | ✅    |
| Kurumu sil                 | ❌     | ❌    | ❌    | ✅    |

---

## Davet Sistemi

Admin veya Owner, **Üyeler** sayfasından e-posta ve rol seçerek davet gönderir.

Sistem bir **token** oluşturur. Admin bu token ile oluşan linki paylaşır:
```
https://your-app.web.app/org/join?token=abc123xyz
```

Davet alıcısı:
1. Linke tıklar → Giriş sayfasına yönlendirilir
2. Giriş yapar veya kayıt olur
3. Token otomatik tanınır, kuruma katılım tamamlanır

---

## Kurumlar Arası Geçiş

Sol panelde kurum adının altındaki **ChevronDown** ikonuna tıklayarak açılan menüden:
- Mevcut kurumlar arasında tek tıkla geçiş yapılabilir
- "Yeni Kurum / Katıl" seçeneği ile yeni kurum oluşturulabilir

Aktif kurum `admins/{uid}.currentOrgId` alanında saklanır; bir sonraki girişte otomatik yüklenir.

---

## Veri İzolasyonu

Her Firestore sorgusu `where('orgId', '==', currentOrg.id)` filtresi içerir. Güvenlik kuralları da `orgMembers` koleksiyonunu kontrol ederek başka kurumun verisine erişimi önler.

