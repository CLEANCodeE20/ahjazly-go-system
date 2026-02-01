# 🚀 دليل الاختبار السريع

## اختبار التحسينات

### 1. اختبار البيئة
```bash
# التحقق من المتغيرات البيئية
python -c "from app.config import settings; print('✅ Configuration is valid')"
```

### 2. اختبار قاعدة البيانات
```bash
# اختبار الاتصال بقاعدة البيانات
python -c "from app.database import init_connection_pool, get_connection, return_connection; init_connection_pool(); conn = get_connection(); print('✅ Database connection successful'); return_connection(conn)"
```

### 3. تشغيل الخادم
```bash
# تشغيل الخادم
python -m app.main
```

### 4. اختبار Health Check
```bash
# في نافذة أخرى
curl http://localhost:8000/health
```

### 5. اختبار Chat Endpoint
```bash
# اختبار بسيط
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "ما هي الرحلات المتاحة؟", "user_id": "test_user"}'
```

### 6. اختبار Rate Limiting
```bash
# إرسال 25 طلب متتالي (يجب أن يفشل بعد 20)
for i in {1..25}; do
  echo "Request $i"
  curl -X POST http://localhost:8000/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "test", "user_id": "test_user"}'
  sleep 0.1
done
```

## النتائج المتوقعة

### Health Check Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-06T...",
  "checks": {
    "database": "connected",
    "embedding_model": "loaded",
    "groq_api": "configured",
    "memory_usage": "45.2%",
    "cpu_usage": "12.3%"
  }
}
```

### Chat Response:
```json
{
  "answer": "...",
  "context_used": ["..."],
  "request_id": "uuid-here"
}
```

### Rate Limit Response (بعد 20 طلب):
```json
{
  "error": "Rate limit exceeded: 20 per 1 minute"
}
```

## التحقق من Logs

```bash
# عرض آخر 50 سطر من السجلات
tail -f logs/chatbot.log
```

## ملاحظات
- تأكد من تثبيت جميع التبعيات من `requirements.txt`
- تأكد من وجود جميع المتغيرات البيئية في `.env`
- تأكد من تشغيل قاعدة البيانات
