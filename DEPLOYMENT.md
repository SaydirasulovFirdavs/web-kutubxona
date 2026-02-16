# 🚀 Web Kutubxona Unified Deployment Guide

Loyiha bitta serverda (Unified) ishlash uchun to'liq tayyorlandi. Endi Backend va Frontend birga build qilinadi va bitta portda ishlaydi.

## 1. Environment Variables (.env)
Serverda `backend` papkasida `.env` faylini yarating:

```env
NODE_ENV=production
PORT=5000
DB_HOST=sizning_db_host
DB_PORT=5432
DB_NAME=web_kutubxona
DB_USER=postgres
DB_PASSWORD=maxfiy_parol
JWT_SECRET=maxfiy_kalit_123
# URGENT: Productionda FRONTEND_URL ni backend URL bilan bir xil qiling
FRONTEND_URL=https://sizning-saytingiz.uz
```

## 2. O'rnatish va Ishga tushirish (Render/VPS uchun)
Bitta buyruq orqali hamma narsani tayyorlash:

```bash
# Barcha dependency-larni o'rnatish va frontendni build qilish
npm run build

# Serverni ishga tushirish
npm start
```

## 3. Render.com uchun sozlamalar:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `.` (Loyihaning eng boshlang'ich papkasi)

## 4. Nega bu usul yaxshi?
- ✅ **Bitta Port**: Frontend ham, Backend ham bitta manzilda (masalan: `mysite.uz`) turadi.
- ✅ **CORS muammosi yo'q**: Ikkalasi bitta "Origin" da bo'lgani uchun xavfsizlik muammolari kamayadi.
- ✅ **Har doim ishlab turadi**: Backend har doim Frontendni taniy oladi.

## 5. Muhim eslatma:
Serverda doimiy kitoblar yuklanishi uchun `uploads` papkasini serveringizga bog'lab qo'yishni (Mount disk) unutmang. Aks holda bepul serverlar fayllarni o'chirib yuborishi mumkin.
