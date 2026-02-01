
import time
import psycopg2
from app.config import settings

def test_conn():
    print(f"Connecting to {settings.DB_HOST}...")
    try:
        conn = psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            sslmode=settings.DB_SSLMODE,
            connect_timeout=10 
        )
        print("✅ Connection successful!")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

# Try 5 times
for i in range(5):
    print(f"Attempt {i+1}...")
    if test_conn():
        break
    time.sleep(2)
