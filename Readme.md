# 🌊 Həyat Balansı - Life Balance Tracker

Həyat sahələrinizdəki aydınlıq və qaranlıq əməllərinizi izləyən, kalıcı hafızaya sahip tam stack web uygulaması.

## 🚀 Özellikler

- ✅ **Kalıcı Veri Saklama** - SQLite veritabanı ile tüm verileriniz güvenle saklanır
- ✅ **8 Hayat Alanı** - Career, Mental, Physical, Social, Romantic, Hobiler, Finans, Spritual
- ✅ **Light & Dark Actions** - Pozitif ve negatif alışkanlıklarınızı takip edin
- ✅ **Görsel Takip** - Damla animasyonları ve interaktif grafikler
- ✅ **Detaylı Tarihçe** - Tüm eylemlerinizin kaydı
- ✅ **Vizualizasyon** - Yaşam dengenizi görsel olarak analiz edin
- ✅ **Responsive Tasarım** - Mobil ve masaüstü uyumlu

## 📋 Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

## 🛠️ Kurulum

### 1. Projeyi İndirin
```bash
# Dosyaları bir klasöre kopyalayın
life-balance-tracker/
├── server.js
├── package.json
└── public/
    ├── index.html
    └── app.js
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

Bu komut şu paketleri yükleyecek:
- express (web server)
- sqlite3 (veritabanı)
- cors (çapraz kaynak paylaşımı)

### 3. Veritabanını Başlatın
İlk çalıştırmada veritabanı otomatik olarak oluşturulacak ve varsayılan alanlar eklenecektir.

### 4. Sunucuyu Başlatın
```bash
npm start
```

Veya development modunda (otomatik yeniden başlatma ile):
```bash
npm run dev
```

### 5. Uygulamayı Açın
Tarayıcınızda şu adresi açın:
```
http://localhost:3000
```

## 📁 Proje Yapısı

```
life-balance-tracker/
│
├── server.js              # Backend sunucu (Express + SQLite)
├── package.json           # Proje bağımlılıkları
├── life_balance.db        # SQLite veritabanı (otomatik oluşturulur)
│
└── public/
    ├── index.html         # Ana HTML dosyası
    └── app.js            # Frontend JavaScript (API iletişimi)
```

## 🎯 Kullanım

### Temel İşlemler

1. **Eylem Ekleme**: Bir alan kartına tıklayın, light veya dark action seçin
2. **Manuel Ayarlama**: "Manuel" butonuyla doğrudan seviye ayarlayın
3. **Sıfırlama**: Tek bir alanı veya tüm alanları sıfırlayabilirsiniz
4. **Görselleştirme**: "VİZUALİZASİYA" butonu ile yaşam dengenizi görün

### API Endpoints

Backend aşağıdaki API endpoint'leri sağlar:

```
GET    /api/areas                    # Tüm alanları getir
PUT    /api/areas/:name/levels       # Alan seviyelerini güncelle
POST   /api/areas/:name/actions      # Yeni action ekle
POST   /api/areas/:name/history      # Tarihçeye kayıt ekle
DELETE /api/areas/:name/reset        # Alanı sıfırla
DELETE /api/areas/reset-all          # Tüm alanları sıfırla
```

## 🔧 Yapılandırma

### Port Değiştirme
`server.js` dosyasında:
```javascript
const PORT = 3000; // İstediğiniz porta değiştirin
```

### Veritabanı Konumu
`server.js` dosyasında:
```javascript
const db = new sqlite3.Database('./life_balance.db'); 
// Yolu değiştirebilirsiniz
```

## 📊 Veritabanı Şeması

### Areas Tablosu
```sql
id, name, color, light_level, dark_level, created_at, updated_at
```

### Actions Tablosu
```sql
id, area_id, action_text, type, is_custom, created_at
```

### History Tablosu
```sql
id, area_id, action_text, type, amount, note, timestamp, created_at
```

## 🐛 Sorun Giderme

### "Backend ilə əlaqə qurula bilmədi" hatası
- Sunucunun çalıştığından emin olun: `npm start`
- Port'un açık olduğunu kontrol edin
- Firewall ayarlarını kontrol edin

### Veritabanı hataları
- `life_balance.db` dosyasını silin ve sunucuyu yeniden başlatın
- Dosya izinlerini kontrol edin

### Frontend bağlantı sorunu
- `public/app.js` içinde `API_BASE` URL'ini kontrol edin
- CORS hatası alıyorsanız, backend `cors` middleware'inin aktif olduğundan emin olun

## 🔒 Güvenlik Notları

- Bu uygulama şu anda temel authentication içermemektedir
- Production ortamında kullanmadan önce:
  - Authentication ekleyin
  - HTTPS kullanın
  - Rate limiting ekleyin
  - Input validation güçlendirin

## 🎨 Özelleştirme

### Yeni Alan Ekleme
`server.js` dosyasındaki `defaultAreas` array'ine yeni alan ekleyin:

```javascript
{ 
    name: 'YeniAlan', 
    color: '#hexcode', 
    lightActions: [...], 
    darkActions: [...] 
}
```

### Renk Teması Değiştirme
`public/index.html` dosyasındaki CSS değişkenlerini düzenleyin.

## 📝 Lisans

MIT License - İstediğiniz gibi kullanabilirsiniz.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

**Uğurlu balanslar! 🌊✨**
