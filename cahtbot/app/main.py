import logging
import sys
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime

from app.routers import chat
from app.database import get_connection, return_connection, init_connection_pool, close_all_connections
from app.config import settings

# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Disable noisy loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

from app.services.rag_service import load_embedding_model, embed_model
import threading

# Request ID Middleware
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response

# Initialize FastAPI app
app = FastAPI(
    title="RAG Chatbot API",
    description="Enterprise-grade RAG Chatbot Service",
    version="2.0.0"
)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Server starting up...")
    # Initialize connection pool
    init_connection_pool()
    # Load model in background to avoid blocking critical path
    threading.Thread(target=load_embedding_model, daemon=True).start()
    logger.info("✅ Startup completed")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Server shutting down...")
    close_all_connections()
    logger.info("✅ Shutdown completed")

# Add Middlewares
app.add_middleware(RequestIDMiddleware)

# CORS - Restricted for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        # Add your Flutter app domains here when deployed
        # "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)

# Include Routers
app.include_router(chat.router)

@app.get("/health")
def health_check():
    """Enhanced health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "checks": {}
    }
    
    # Check database
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.close()
        return_connection(conn)
        health_status["checks"]["database"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = f"error: {str(e)}"
    
    # Check embedding model
    health_status["checks"]["embedding_model"] = "loaded" if embed_model else "not_loaded"
    
    # Check Groq API key
    health_status["checks"]["groq_api"] = "configured" if settings.GROQ_API_KEY else "not_configured"
    
    # Memory and CPU usage
    try:
        import psutil
        health_status["checks"]["memory_usage"] = f"{psutil.virtual_memory().percent}%"
        health_status["checks"]["cpu_usage"] = f"{psutil.cpu_percent()}%"
    except ImportError:
        health_status["checks"]["system_metrics"] = "psutil not installed"
    
    return health_status

@app.get("/", response_class=HTMLResponse)
async def root():
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "Frontend file not found."

# Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Enterprise RAG Chatbot...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
