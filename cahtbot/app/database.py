import psycopg2
from psycopg2 import pool
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Global connection pool
connection_pool = None

def init_connection_pool():
    """Initialize the database connection pool"""
    global connection_pool
    try:
        connection_pool = pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=20,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            sslmode=settings.DB_SSLMODE,
        )
        logger.info("✅ Database connection pool created successfully")
    except Exception as e:
        logger.error(f"❌ Error creating connection pool: {e}")
        raise

def get_connection():
    """Get a connection from the pool"""
    if connection_pool is None:
        init_connection_pool()
    return connection_pool.getconn()

def return_connection(conn):
    """Return a connection to the pool"""
    if connection_pool:
        connection_pool.putconn(conn)

def close_all_connections():
    """Close all connections in the pool"""
    if connection_pool:
        connection_pool.closeall()
        logger.info("All database connections closed")
