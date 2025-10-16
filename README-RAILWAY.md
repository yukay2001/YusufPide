# 🚂 Railway Deployment Guide

Railway, full-stack TypeScript uygulamaları için ideal bir platformdur. Vercel'in aksine, monorepo yapılarını ve PostgreSQL'i native olarak destekler.

## ⚡ Hızlı Başlangıç

### 1️⃣ Railway Hesabı Oluşturun
- https://railway.app adresine gidin
- **"Login with GitHub"** ile giriş yapın

### 2️⃣ Yeni Proje Oluşturun
1. **"New Project"** butonuna tıklayın
2. **"Deploy from GitHub repo"** seçin
3. Repository'nizi seçin (GitHub izni verin)

### 3️⃣ PostgreSQL Database Ekleyin
1. Proje dashboardınızda **"New"** butonuna tıklayın
2. **"Database"** → **"Add PostgreSQL"** seçin
3. Railway otomatik olarak `DATABASE_URL` environment variable'ını ayarlayacaktır ✅

### 4️⃣ Environment Variables Ekleyin
Proje ayarlarında **"Variables"** sekmesine gidin ve ekleyin:

```env
NODE_ENV=production
SESSION_SECRET=railway-super-secret-key-2024-pideci-panel
```

**Not:** `SESSION_SECRET` güvenli bir rastgele string olmalı (en az 32 karakter)

### 5️⃣ Deploy Ayarları
Railway otomatik olarak şu ayarları algılayacaktır:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Node Version:** 20.x (`.node-version` dosyasından)

### 6️⃣ Deploy!
- Railway otomatik olarak build ve deploy işlemini başlatacaktır
- İlk deployment 2-3 dakika sürebilir
- Deployment tamamlandığında size bir **public URL** verilecektir (örn: `https://your-app.up.railway.app`)

---

## 🔧 Deploy Sonrası

### Database Migration
Railway ilk deployment'ta database'i otomatik oluşturur. Schema'yı sync etmek için:

1. Railway dashboard'da terminal açın (proje → "..." → "Terminal")
2. Şu komutu çalıştırın:
```bash
npm run db:push
```

**VEYA** local'den remote database'e bağlanın:

```bash
# Railway'den DATABASE_URL'i kopyalayın
DATABASE_URL="postgresql://..." npm run db:push
```

### Database Seed (İlk Veriler)
Uygulama ilk çalıştığında otomatik olarak:
- ✅ Admin kullanıcısı (`admin` / `admin123`)
- ✅ Varsayılan kategoriler
- ✅ Örnek ürünler
- ✅ İlk business session

oluşturulacaktır.

---

## 📊 Monitoring & Logs

### Logs Görüntüleme
- Railway dashboard → Proje seçin → **"Deployments"** sekmesi
- Gerçek zamanlı logları görebilirsiniz

### Metrics
- **"Metrics"** sekmesinde CPU, RAM, Network kullanımını izleyebilirsiniz

---

## 💰 Fiyatlandırma

Railway **$5 ücretsiz kredi** ile başlar:

| Kaynak | Aylık Maliyet (Tahmini) |
|--------|--------------------------|
| Web Service (starter) | ~$5-10 |
| PostgreSQL (1GB) | ~$5 |
| **TOPLAM** | **~$10-15/ay** |

**Not:** İlk $5 kredi ile 2-4 hafta ücretsiz kullanabilirsiniz.

---

## 🆚 Railway vs Vercel

| Özellik | Railway | Vercel |
|---------|---------|--------|
| **Full-stack TS Support** | ✅ Native | ❌ Karmaşık |
| **PostgreSQL** | ✅ Dahil | ❌ Harici gerekli |
| **Monorepo** | ✅ Tam destek | ⚠️ Sınırlı |
| **WebSocket** | ✅ Destekler | ❌ Desteklemez |
| **Build Süresi** | 2-3 dakika | 1-2 dakika |
| **Fiyat** | ~$10/ay | Frontend ücretsiz |

**Sonuç:** Full-stack TypeScript uygulamaları için Railway çok daha uygun! 🚂

---

## 🔗 Faydalı Linkler

- 📚 [Railway Documentation](https://docs.railway.app)
- 💬 [Railway Discord Community](https://discord.gg/railway)
- 🎓 [Railway Guides](https://docs.railway.app/guides)

---

## ❓ Sorun Giderme

### "Build failed" Hatası
```bash
# Railway dashboard'da build logs'u kontrol edin
# Genellikle eksik dependency veya TypeScript hatası
```

### Database Bağlantı Hatası
```bash
# Railway Variables sekmesinde DATABASE_URL'in olduğundan emin olun
# Format: postgresql://user:password@host:port/database
```

### Port Hatası
Railway otomatik olarak `PORT` environment variable'ı sağlar. Server kodunuzda:
```typescript
const PORT = process.env.PORT || 5000;
```

---

## ✅ Deploy Checklist

- [ ] Railway hesabı oluşturuldu
- [ ] GitHub repository bağlandı
- [ ] PostgreSQL database eklendi
- [ ] Environment variables ayarlandı (`SESSION_SECRET`, `NODE_ENV`)
- [ ] İlk deployment başarılı
- [ ] Database migration çalıştırıldı (`npm run db:push`)
- [ ] Public URL açılıyor
- [ ] Admin login çalışıyor (`admin` / `admin123`)

---

🎉 **Başarılı deployment!** Artık projenize her cihazdan erişebilirsiniz.
