# Vercel Deployment Guide

## ✅ Tamamlanan Hazırlıklar

Uygulama Vercel serverless deployment için tamamen hazır:

### Backend Değişiklikleri
- ✅ Express app serverless uyumlu hale getirildi (server/app.ts)
- ✅ esbuild bundler ile backend tek dosyada paketlendi (api/_app.bundle.js)
- ✅ Serverless handler oluşturuldu (api/index.ts)
- ✅ vercel.json deployment konfigürasyonu tamamlandı

### Test Edilen Özellikler
- ✅ Authentication (login/logout/session)
- ✅ RBAC (role-based access control)
- ✅ Sales & Expenses tracking
- ✅ Stock management & alerts
- ✅ Orders & Kitchen display
- ✅ PDF report generation

### Bug Düzeltmeleri
- ✅ Kitchen display: getActiveOrders() artık 'active', 'preparing', 'ready' statuslardaki siparişleri gösteriyor
- ✅ Session/Cookie sorunları düzeltildi (farklı cihazlardan giriş yapamama sorunu)
  - `trust proxy` eklendi (Vercel reverse proxy için)
  - `sameSite: 'lax'` cookie ayarı eklendi
  - `proxy: true` session ayarı eklendi
- ✅ Aktif session yokken API'lerin boş array döndürmesi sağlandı

---

## 🚀 Deployment Adımları

### 1. GitHub'a Push

Replit'te Git işlemleri kısıtlı olduğu için kodu manuel olarak GitHub'a aktarmanız gerekiyor:

**Seçenek A: Replit'ten GitHub'a Export**
1. Replit sidebar'da "Version Control" sekmesine gidin
2. "Connect to GitHub" butonuna tıklayın
3. Repository oluşturun veya mevcut repo'ya bağlayın
4. Değişiklikleri commit & push edin

**Seçenek B: Manuel Download & Upload**
1. Replit'te tüm dosyaları indirin (Download as ZIP)
2. Yerel bilgisayarınızda GitHub repo'su oluşturun
3. Dosyaları repo'ya yükleyin ve push edin

### 2. Vercel'e Deploy

1. **Vercel'e Giriş Yapın**: https://vercel.com
2. **New Project** → **Import Git Repository**
3. GitHub repo'nuzu seçin
4. **Framework Preset**: Other (veya boş bırakın)
5. **Build & Development Settings**:
   - Build Command: `npm run build:serverless`
   - Output Directory: `.` (boş bırakabilirsiniz)
   - Install Command: `npm install`

6. **Environment Variables** ekleyin:
   - `DATABASE_URL`: PostgreSQL connection string (Neon/Railway/Supabase)
   - `SESSION_SECRET`: Güvenli bir random string
   
   Örnek DATABASE_URL:
   ```
   postgresql://user:password@host/database?sslmode=require
   ```

7. **Deploy** butonuna tıklayın

### 3. Database Setup

Vercel'de PostgreSQL için önerilen seçenekler:

**Neon (Önerilen - Serverless PostgreSQL)**
- https://neon.tech → Ücretsiz plan
- Database oluşturun
- Connection string'i kopyalayın
- Vercel Environment Variables'a ekleyin

**Railway**
- https://railway.app → PostgreSQL template
- Connection string'i alın
- Vercel'e ekleyin

**Supabase**
- https://supabase.com → Yeni proje
- Database settings → Connection string
- Vercel'e ekleyin

### 4. İlk Çalıştırma

Deploy tamamlandıktan sonra:

1. Vercel deployment URL'ini açın
2. İlk açılışta seed data otomatik oluşacak:
   - Admin user: `admin` / `admin123`
   - İlk business session
   - Örnek ürünler

3. Admin olarak giriş yapın ve sistemi test edin

---

## 📋 Deployment Checklist

- [ ] GitHub repository oluşturuldu
- [ ] Kod GitHub'a push edildi
- [ ] Vercel projesi oluşturuldu
- [ ] DATABASE_URL environment variable eklendi
- [ ] SESSION_SECRET environment variable eklendi
- [ ] İlk deployment başarılı
- [ ] Admin login çalışıyor
- [ ] Seed data oluşturuldu

---

## 🔧 Önemli Notlar

### Database Session Store
- PostgreSQL session store kullanıyoruz (`connect-pg-simple`)
- Serverless cold start'larda session yönetimi otomatik

### Bundle Size
- Backend bundle: ~4.3MB
- Vercel limit: 50MB
- ✅ Limit içinde, sorun yok

### WebSocket (Kitchen Display)
- Local development'ta WebSocket çalışıyor
- Production'da HTTP polling kullanılacak (otomatik fallback var)

### Monitoring
İlk deploy sonrası izlenmesi gerekenler:
1. Database connection pool (Neon/Railway)
2. Session store performance
3. Cold start süreleri (ilk request ~2-3sn normal)

---

## 🐛 Sorun Giderme

### "Cannot find module" hatası
- `vercel.json` buildCommand doğru mu kontrol edin
- `api/_app.bundle.js` oluşturuldu mu kontrol edin

### Database connection hatası
- DATABASE_URL environment variable doğru mu?
- SSL mode aktif mi? (`?sslmode=require`)
- Database erişilebilir mi?

### Session hatası
- SESSION_SECRET tanımlı mı?
- Database'de `session` tablosu var mı?

### Kitchen display çalışmıyor
- WebSocket serverless'ta çalışmaz (beklenen)
- HTTP polling otomatik devreye girer
- Refresh butonu ile manuel yenileme mümkün

---

## 📞 Destek

Deployment sırasında sorun yaşarsanız:
1. Vercel deployment logs'larını kontrol edin
2. Browser console'da hata var mı bakın
3. Database bağlantısını test edin
4. Environment variables'ları doğrulayın
