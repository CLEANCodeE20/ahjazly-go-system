import logging
from sentence_transformers import SentenceTransformer
from app.database import get_connection, return_connection
from app.config import settings
from app.services.rag_service import embed_model, load_embedding_model

logger = logging.getLogger(__name__)

class IndexingService:
    def reindex_all(self):
        """
        Re-builds the embeddings for all data in the database.
        This runs the same logic as build_embeddings.py but integrated into the app.
        """
        logger.info("♻️ Starting full re-indexing process...")
        
        # Ensure model is loaded
        if embed_model is None:
            logger.info("Embedding model not loaded, loading now...")
            load_embedding_model()
            
        conn = get_connection()
        try:
            # 1. Clear old embeddings
            self._clear_embeddings(conn)
            
            # 2. Index Trips
            trips = self._fetch_trips(conn)
            self._index_items(conn, trips, "trips")
            
            # 3. Index Routes
            routes = self._fetch_routes(conn)
            self._index_items(conn, routes, "routes")
            
            # 4. Index Policies
            policies = self._fetch_policies(conn)
            self._index_items(conn, policies, "cancel_policies")
            
            # 5. Index FAQs
            faqs = self._fetch_faqs(conn)
            self._index_items(conn, faqs, "faqs")
            
            logger.info("✅ Re-indexing completed successfully!")
            return {"status": "success", "message": "Re-indexing completed"}
            
        except Exception as e:
            logger.error(f"❌ Error during re-indexing: {e}")
            raise e
        finally:
            return_connection(conn)

    def _clear_embeddings(self, conn):
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM documents_embeddings;")
            conn.commit()
            logger.info("🗑️ Cleared old embeddings")
        finally:
            cur.close()

    def _fetch_trips(self, conn):
        cur = conn.cursor()
        try:
            # Similar SQL to build_embeddings.py but simplified
            query = """
                SELECT 
                    t.id, 
                    c1.name, 
                    c2.name, 
                    t.departure_time, 
                    t.price,
                    comp.name
                FROM trips t
                JOIN cities c1 ON t.from_city_id = c1.id
                JOIN cities c2 ON t.to_city_id = c2.id
                JOIN companies comp ON t.company_id = comp.id
                WHERE t.status = 'scheduled';
            """
            cur.execute(query)
            return cur.fetchall()
        finally:
            cur.close()

    def _fetch_routes(self, conn):
        cur = conn.cursor()
        try:
            query = """
                SELECT r.id, c1.name, c2.name, r.estimated_duration, r.distance_km
                FROM routes r
                JOIN cities c1 ON r.from_city_id = c1.id
                JOIN cities c2 ON r.to_city_id = c2.id;
            """
            cur.execute(query)
            return cur.fetchall()
        finally:
            cur.close()

    def _fetch_policies(self, conn):
        cur = conn.cursor()
        try:
            query = """
                SELECT cp.id, c.name, cp.policy_type, cp.refund_percentage, cp.hours_before_trip
                FROM cancel_policies cp
                JOIN companies c ON cp.company_id = c.id;
            """
            cur.execute(query)
            return cur.fetchall()
        finally:
            cur.close()

    def _fetch_faqs(self, conn):
        cur = conn.cursor()
        try:
            cur.execute("SELECT id, question, answer, category FROM faqs;")
            return cur.fetchall()
        finally:
            cur.close()

    def _index_items(self, conn, items, source_table):
        if not items:
            logger.warning(f"No items found for {source_table}")
            return
            
        logger.info(f"Indexing {len(items)} items from {source_table}...")
        cur = conn.cursor()
        
        try:
            for item in items:
                text_chunk = self._format_item(item, source_table)
                embedding = embed_model.encode(text_chunk)
                embedding_list = embedding.tolist()
                
                cur.execute(
                    """
                    INSERT INTO documents_embeddings 
                    (source_table, source_id, text_chunk, embedding)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (source_table, item[0], text_chunk, str(embedding_list))
                )
            conn.commit()
        finally:
            cur.close()

    def _format_item(self, item, source_table):
        # Simplified formatting logic based on build_embeddings.py
        if source_table == "trips":
            from_city = item[1]
            to_city = item[2]
            dep_time = item[3]
            price = item[4]
            company = item[5]
            return (f"رحلة متاحة من {from_city} إلى {to_city}.\n"
                    f"الشركة: {company}.\n"
                    f"موعد الانطلاق: {dep_time}.\n"
                    f"السعر: {price} ريال.")
        elif source_table == "routes":
            return (f"مسار سفر بري من {item[1]} إلى {item[2]}.\n"
                    f"المسافة: {item[4]} كم.\n"
                    f"المدة المتوقعة: {item[3]}.")
        elif source_table == "cancel_policies":
            hours = item[4]
            refund = item[3]
            days = hours / 24
            time_str = f"{int(days)} يوم" if days >= 1 else f"{hours} ساعة"
            return (f"سياسة الإلغاء: {item[2]}.\n"
                    f"الشركة: {item[1]}.\n"
                    f"استرداد {refund}% قبل {hours} ساعة من انطلاق الرحلة.\n"
                    f"نسبة الاسترجاع: {refund}%.\n"
                    f"يجب الإلغاء قبل {time_str} من موعد الرحلة.")
        elif source_table == "faqs":
             return (f"سؤال شائع: {item[1]}\n"
                     f"التصنيف: {item[3]}\n"
                     f"الإجابة: {item[2]}")
        return ""

indexing_service = IndexingService()
