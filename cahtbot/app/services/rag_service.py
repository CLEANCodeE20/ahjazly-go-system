import logging
from sentence_transformers import SentenceTransformer
from app.config import settings
from app.database import get_connection

logger = logging.getLogger(__name__)

# Global variable for the model
embed_model = None

def load_embedding_model():
    global embed_model
    if embed_model is not None:
        return

    logger.info(f"Loading embedding model: {settings.EMBED_MODEL_NAME}")
    try:
        # Try loading with local files only first if possible, or just standard load
        # We can pass local_files_only=False (default) but let's try to be robust
        embed_model = SentenceTransformer(settings.EMBED_MODEL_NAME)
        logger.info("✅ Embedding model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Error loading primary embedding model: {e}")
        try:
            logger.info("⚠️ Falling back to multilingual model (fallback)...")
            embed_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-mpnet-base-v2")
            logger.info("✅ Fallback embedding model loaded successfully")
        except Exception as e2:
             logger.error(f"❌ CRITICAL: Could not load any embedding model. RAG will not work. Error: {e2}")
             embed_model = None

# Initial load attempt (can be called from main.py startup event)
# We don't call it here to avoid blocking import


def retrieve_context(query_text: str, k: int = 5) -> list[str]:
    """
    Retrieve top k context chunks using semantic search
    """
    try:
        if embed_model is None:
            load_embedding_model()
            
        if embed_model is None:
            logger.warning("Embedding model not available. Returning empty context.")
            return []

        query_emb = embed_model.encode(query_text)
        embedding_str = "[" + ",".join(str(float(x)) for x in query_emb) + "]"

        from app.database import get_connection, return_connection
        conn = get_connection()
        cur = conn.cursor()
        
        try:
            cur.execute(
                """
                SELECT text_chunk, source_table, source_id
                FROM documents_embeddings
                ORDER BY embedding <-> %s::vector
                LIMIT %s;
                """,
                (embedding_str, k),
            )
            rows = cur.fetchall()
            
            logger.info(f"Retrieved {len(rows)} context chunks for query: {query_text[:50]}...")
            return [r[0] for r in rows]
        finally:
            cur.close()
            return_connection(conn)
    
    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        return []
