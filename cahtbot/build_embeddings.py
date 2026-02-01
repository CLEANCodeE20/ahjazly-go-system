import os
import psycopg2
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# تحميل .env
load_dotenv()

print("=" * 60)
print("Starting Embeddings Builder")
print("=" * 60)

DB_HOST = os.getenv("NEON_DB_HOST")
DB_PORT = os.getenv("NEON_DB_PORT", "5432")
DB_NAME = os.getenv("NEON_DB_NAME")
DB_USER = os.getenv("NEON_DB_USER")
DB_PASSWORD = os.getenv("NEON_DB_PASSWORD")
DB_SSLMODE = os.getenv("NEON_DB_SSLMODE", "require")

EMBED_MODEL_NAME = os.getenv(
    "EMBED_MODEL", "Omartificial-Intelligence-Space/arabic-matryoshka-embed-base"
)

print(f"\n📦 Loading embedding model: {EMBED_MODEL_NAME}")
try:
    embed_model = SentenceTransformer(EMBED_MODEL_NAME)
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("⚠️  Falling back to multilingual model...")
    embed_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-mpnet-base-v2")

def get_connection():
    from app.database import get_connection as get_conn
    return get_conn()

def return_connection(conn):
    from app.database import return_connection as return_conn
    return_conn(conn)

def clear_embeddings():
    print("\n🗑️  Clearing old embeddings...")
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM documents_embeddings;")
        deleted_count = cur.rowcount
        conn.commit()
        cur.close()
        return_connection(conn)
        print(f"✅ Deleted {deleted_count} old embeddings")
    except Exception as e:
        print(f"❌ Error clearing embeddings: {e}")

def fetch_trips_with_stops():
    """
    يجلب كل رحلة مع نقاط الصعود التابعة لها
    """
    print("\n📊 Fetching trips data...")
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT
                t.trip_id,
                r.origin_city,
                r.destination_city,
                t.departure_time,
                t.arrival_time,
                t.base_price,
                t.status,
                COALESCE(
                    STRING_AGG(
                        CONCAT(
                            'نقطة صعود: ', rs.stop_name,
                            ' في موقع ', rs.stop_location,
                            ' - ترتيب: ', rs.stop_order
                        ),
                        ' | '
                        ORDER BY rs.stop_order
                    ),
                    ''
                ) AS boarding_points
            FROM trips t
            LEFT JOIN routes r ON r.route_id = t.route_id
            LEFT JOIN route_stops rs ON rs.route_id = t.route_id
            WHERE t.status = 'Scheduled'
            GROUP BY
                t.trip_id,
                r.origin_city,
                r.destination_city,
                t.departure_time,
                t.arrival_time,
                t.base_price,
                t.status;
            """
        )
        rows = cur.fetchall()
        print(f"✅ Found {len(rows)} scheduled trips")
    except Exception as e:
        print(f"❌ Error fetching trips: {e}")
        rows = []
    cur.close()
    return_connection(conn)
    return rows

def fetch_routes():
    """
    يجلب معلومات المسارات
    """
    print("\n📊 Fetching routes data...")
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT
                r.route_id,
                r.origin_city,
                r.destination_city,
                r.estimated_duration_hours,
                r.distance_km,
                COALESCE(
                    STRING_AGG(
                        CONCAT(
                            rs.stop_name,
                            ' (', rs.stop_location, ')',
                            ' - ترتيب: ', rs.stop_order
                        ),
                        ' | '
                        ORDER BY rs.stop_order
                    ),
                    'لا توجد نقاط توقف'
                ) AS route_stops
            FROM routes r
            LEFT JOIN route_stops rs ON rs.route_id = r.route_id
            GROUP BY
                r.route_id,
                r.origin_city,
                r.destination_city,
                r.estimated_duration_hours,
                r.distance_km;
            """
        )
        rows = cur.fetchall()
        print(f"✅ Found {len(rows)} routes")
    except Exception as e:
        print(f"❌ Error fetching routes: {e}")
        rows = []
    cur.close()
    return_connection(conn)
    return rows

def fetch_cancel_policies():
    """
    يجلب سياسات الإلغاء مع معلومات الشركة
    """
    print("\n📊 Fetching cancellation policies...")
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                cp.cancel_policy_id, 
                cp.policy_name, 
                cp.description, 
                cp.refund_percentage, 
                cp.days_before_trip,
                p.company_name
            FROM cancel_policies cp
            LEFT JOIN partners p ON p.partner_id = cp.partner_id;
        """)
        rows = cur.fetchall()
        print(f"✅ Found {len(rows)} cancellation policies")
    except Exception as e:
        print(f"❌ Error fetching policies: {e}")
        rows = []
    cur.close()
    return_connection(conn)
    return rows

def insert_embedding(source_table, source_id, text_chunk, embedding):
    try:
        conn = get_connection()
        cur = conn.cursor()
        embedding_str = "[" + ",".join(str(float(x)) for x in embedding) + "]"
        cur.execute(
            """
            INSERT INTO documents_embeddings (source_table, source_id, text_chunk, embedding)
            VALUES (%s, %s, %s, %s::vector)
            ON CONFLICT DO NOTHING;
            """,
            (source_table, source_id, text_chunk, embedding_str),
        )
        conn.commit()
        cur.close()
        return_connection(conn)
        return True
    except Exception as e:
        print(f"  ❌ Error inserting embedding for {source_table}#{source_id}: {e}")
        return False

def index_trips():
    rows = fetch_trips_with_stops()
    print(f"\n🔄 Indexing {len(rows)} trips...")
    success_count = 0
    
    for idx, row in enumerate(rows, 1):
        (
            trip_id,
            origin_city,
            destination_city,
            departure_time,
            arrival_time,
            base_price,
            status,
            boarding_points,
        ) = row

        text_chunk = (
            f"رحلة رقم {trip_id}.\n"
            f"تنطلق من مدينة {origin_city or 'غير محدد'} إلى مدينة {destination_city or 'غير محدد'}.\n"
            f"وقت المغادرة: {departure_time}، ووقت الوصول المتوقع: {arrival_time}.\n"
            f"سعر التذكرة: {base_price} ريال.\n"
            f"حالة الرحلة: {status}.\n"
            f"نقاط الصعود المتاحة: {boarding_points or 'لا توجد نقاط صعود إضافية'}."
        )

        emb = embed_model.encode(text_chunk)
        if insert_embedding("trips", trip_id, text_chunk, emb):
            success_count += 1
        
        if idx % 10 == 0:
            print(f"  Progress: {idx}/{len(rows)} trips indexed")
    
    print(f"✅ Successfully indexed {success_count}/{len(rows)} trips")

def index_routes():
    rows = fetch_routes()
    print(f"\n🔄 Indexing {len(rows)} routes...")
    success_count = 0
    
    for idx, row in enumerate(rows, 1):
        (
            route_id,
            origin_city,
            destination_city,
            estimated_duration_hours,
            distance_km,
            route_stops,
        ) = row

        text_chunk = (
            f"مسار رقم {route_id}.\n"
            f"من {origin_city or 'غير محدد'} إلى {destination_city or 'غير محدد'}.\n"
            f"المدة المتوقعة: {estimated_duration_hours or 'غير محدد'} ساعة.\n"
            f"المسافة: {distance_km or 'غير محدد'} كم.\n"
            f"نقاط التوقف على المسار: {route_stops}"
        )

        emb = embed_model.encode(text_chunk)
        if insert_embedding("routes", route_id, text_chunk, emb):
            success_count += 1
    
    print(f"✅ Successfully indexed {success_count}/{len(rows)} routes")

def index_policies():
    rows = fetch_cancel_policies()
    print(f"\n🔄 Indexing {len(rows)} cancellation policies...")
    success_count = 0
    
    for row in rows:
        policy_id, policy_name, description, refund_percentage, days_before, company_name = row
        text_chunk = (
            f"سياسة الإلغاء: {policy_name}.\\n"
            f"الشركة: {company_name or 'غير محدد'}.\\n"
            f"{description or 'لا يوجد وصف'}.\\n"
            f"نسبة الاسترجاع: {refund_percentage}%.\\n"
            f"يجب الإلغاء قبل {days_before} يوم من موعد الرحلة."
        )
        emb = embed_model.encode(text_chunk)
        if insert_embedding("cancel_policies", policy_id, text_chunk, emb):
            success_count += 1
    
    print(f"✅ Successfully indexed {success_count}/{len(rows)} policies")

def fetch_active_faqs():
    """
    يجلب الأسئلة الشائعة النشطة من قاعدة البيانات
    """
    print("\n📊 Fetching active FAQs...")
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                faq_id, 
                category, 
                question, 
                answer 
            FROM faqs 
            WHERE is_active = true
            ORDER BY display_order;
        """)
        rows = cur.fetchall()
        print(f"✅ Found {len(rows)} active FAQs")
    except Exception as e:
        print(f"❌ Error fetching FAQs: {e}")
        rows = []
    cur.close()
    return_connection(conn)
    return rows

def index_faqs():
    rows = fetch_active_faqs()
    print(f"\n🔄 Indexing {len(rows)} FAQs...")
    success_count = 0
    
    for row in rows:
        faq_id, category, question, answer = row
        text_chunk = (
            f"سؤال شائع: {question}\n"
            f"التصنيف: {category or 'عام'}\n"
            f"الإجابة: {answer}"
        )
        
        # نستخدم السؤال + الإجابة لتوليد التضمين لضمان دقة البحث
        emb = embed_model.encode(text_chunk)
        if insert_embedding("faqs", faq_id, text_chunk, emb):
            success_count += 1
            
    print(f"✅ Successfully indexed {success_count}/{len(rows)} FAQs")

def main():
    try:
        clear_embeddings()
        index_trips()
        index_routes()
        index_policies()
        index_faqs()
        print("\n" + "=" * 60)
        print("✅ Indexing completed successfully!")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
