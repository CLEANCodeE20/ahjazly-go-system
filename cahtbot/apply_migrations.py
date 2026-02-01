import psycopg2
from app.config import settings

def run_migration():
    print("🚀 applying migrations...")
    try:
        conn = psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            sslmode=settings.DB_SSLMODE,
        )
        cur = conn.cursor()
        
        with open("migrations/001_create_history_tables.sql", "r", encoding="utf-8") as f:
            sql = f.read()
            cur.execute(sql)
            
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Migrations applied successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
