# Ahjazly Bus Booking System (نظام احجزلي)

نظام حجوزات حافلات متكامل مصمم لتسهيل عمليات الحجز وإدارة الأسطول لشركات النقل.

## المميزات الرئيسية

- **لوحة تحكم شاملة**: إدارة الأسطول، الحجوزات، الموظفين، والتقارير المالية.
- **نظام حجز متطور**: واجهة سهلة الاستخدام للعملاء لحجز الرحلات.
- **إدارة مالية**: تتبع المدفوعات، العمولات، والفواتير بشكل آلي.
- **تطبيق السائق**: واجهة مخصصة للسائقين لإدارة الرحلات والركاب.
- **دعم فني**: نظام تذاكر دعم ومحادثة مباشرة.

## التقنيات المستخدمة

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Deployment**: Render (Static Site)

## بدء التشغيل

لنسخ المشروع وتشغيله محلياً:

```bash
# تثبيت المكتبات
npm install

# تشغيل خادم التطوير
npm run dev
```

## المتغيرات البيئية

تأكد من إعداد ملف `.env` بالمتغيرات التالية:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
# Firebase config if needed
```

## هيكل المشروع

- `/src`
  - `/components`: مكونات React القابلة لإعادة الاستخدام
  - `/pages`: صفحات التطبيق
  - `/hooks`: Hooks مخصصة
  - `/integrations`: ربط مع الخدمات الخارجية (Supabase, etc)
  - `/lib`: دوال مساعدة وأدوات

## حقوق الملكية

تطوير فريق Ahjazly Team. جميع الحقوق محفوظة.
