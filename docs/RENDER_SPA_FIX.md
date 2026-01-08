# حل مشكلة اختفاء المحتوى عند التحديث على Render

## 🔍 المشكلة المكتشفة

عند الدخول المباشر أو تحديث صفحة فرعية (مثل `/features` أو `/about`)، يعود الخادم بصفحة فارغة تماماً.

### السبب:
Render لا يطبق إعدادات `routes` من `render.yaml` بشكل صحيح، أو هناك تعارض مع CSP Headers.

## ✅ الحلول المتاحة

### الحل 1: إضافة ملف `_redirects` (موصى به)

أنشئ ملف في `public/_redirects`:

```
/*    /index.html   200
```

هذا يخبر Render أن يعيد توجيه جميع الطلبات إلى `index.html` مع الحفاظ على المسار.

### الحل 2: تحديث `render.yaml`

المشكلة قد تكون في CSP Header الذي يتعارض. حدّث `render.yaml`:

```yaml
staticSites:
  - name: ahjazly-admin-panel
    buildCommand: npm install && npm run build
    publishDir: dist
    
    # SPA Routing - MUST BE FIRST
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    
    headers:
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: Referrer-Policy
        value: strict-origin-when-cross-origin
      - path: /*
        name: Permissions-Policy
        value: "camera=(), microphone=(), geolocation=(), payment=()"
      - path: /assets/*
        name: Cache-Control
        value: public, max-age=31536000, immutable
      - path: /index.html
        name: Cache-Control
        value: no-cache, no-store, must-revalidate
      # Remove CSP from here - let index.html handle it
    
    envVars:
      - key: VITE_SUPABASE_URL
      - key: VITE_SUPABASE_PUBLISHABLE_KEY
      - key: VITE_FIREBASE_API_KEY
      - key: VITE_FIREBASE_AUTH_DOMAIN
      - key: VITE_FIREBASE_PROJECT_ID
      - key: VITE_FIREBASE_STORAGE_BUCKET
      - key: VITE_FIREBASE_MESSAGING_SENDER_ID
      - key: VITE_FIREBASE_APP_ID
      - key: VITE_FIREBASE_VAPID_KEY
```

### الحل 3: استخدام Render Dashboard

1. اذهب إلى Render Dashboard
2. اختر المشروع
3. Settings → Redirects/Rewrites
4. أضف:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** Rewrite

## 🚀 الحل الأسرع (موصى به)

استخدم ملف `_redirects` لأنه الأبسط والأكثر موثوقية:
