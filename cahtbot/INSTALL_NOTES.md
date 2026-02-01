# 📦 ملاحظات التثبيت

## مشكلة psycopg2-binary

إذا واجهت مشكلة في تثبيت `psycopg2-binary`، جرّب أحد الحلول التالية:

### الحل 1: استخدام النسخة المثبتة مسبقاً
إذا كان `psycopg2` أو `psycopg2-binary` مثبت بالفعل في النظام، يمكنك تخطي هذه الخطوة.

### الحل 2: تثبيت من Wheel مباشرة
```bash
pip install psycopg2-binary --only-binary psycopg2-binary
```

### الحل 3: استخدام psycopg3 (البديل الحديث)
```bash
pip install psycopg[binary]
```

ثم تحديث الكود:
```python
# بدلاً من: import psycopg2
import psycopg as psycopg2
from psycopg import pool
```

### الحل 4: تثبيت PostgreSQL Development Files (إذا كنت تريد البناء من المصدر)

**Windows**:
- قم بتحميل PostgreSQL من: https://www.postgresql.org/download/windows/
- أضف مجلد `bin` إلى PATH

**Linux**:
```bash
sudo apt-get install libpq-dev python3-dev
```

**macOS**:
```bash
brew install postgresql
```

## التحقق من التثبيت

بعد حل المشكلة، تحقق من التثبيت:

```bash
python -c "import psycopg2; print('✅ psycopg2 installed successfully')"
```

## تثبيت باقي التبعيات

إذا كانت المشكلة فقط مع `psycopg2-binary`، يمكنك تثبيت باقي التبعيات:

```bash
pip install fastapi uvicorn[standard] pydantic python-dotenv sentence-transformers httpx slowapi redis prometheus-client psutil
```

## الحل المؤقت

إذا كان `psycopg2` مثبت بالفعل، يمكنك إزالته من `requirements.txt` مؤقتاً:

```txt
# psycopg2-binary==2.9.9  # Already installed
```

ثم:
```bash
pip install -r requirements.txt
```

## إدارة البيانات وتحديث الفهرس

عند إضافة أو تعديل بيانات في قاعدة البيانات (رحلات، سياسات، أسئلة)، يجب عليك تحديث فهرس البحث لكي يراها الشات بوت.

**الطريقة الموصى بها (الأكثر موثوقية):**
تشغيل السكربت يدوياً:
```bash
python build_embeddings.py
```

**الطريقة السريعة (تجريبية):**
عبر API النظام (قد تتأثر بانقطاع الاتصال أحياناً):
```bash
curl -X POST http://localhost:8000/system/reindex
```
