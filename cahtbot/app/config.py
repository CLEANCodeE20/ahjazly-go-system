import os
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class Settings:
    # Database
    DB_HOST = os.getenv("NEON_DB_HOST")
    DB_PORT = os.getenv("NEON_DB_PORT", "5432")
    DB_NAME = os.getenv("NEON_DB_NAME")
    DB_USER = os.getenv("NEON_DB_USER")
    DB_PASSWORD = os.getenv("NEON_DB_PASSWORD")
    DB_SSLMODE = os.getenv("NEON_DB_SSLMODE", "require")

    # Models
    HF_API_TOKEN = os.getenv("HF_API_TOKEN")
    HF_CHAT_MODEL = os.getenv("HF_CHAT_MODEL", "tiiuae/Falcon-Arabic-7B-Instruct")
    EMBED_MODEL_NAME = os.getenv(
        "EMBED_MODEL", "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
    )

    # API Keys
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    
    def validate(self):
        """Validate all required environment variables"""
        required_vars = [
            ('DB_HOST', self.DB_HOST),
            ('DB_NAME', self.DB_NAME),
            ('DB_USER', self.DB_USER),
            ('DB_PASSWORD', self.DB_PASSWORD),
            ('GROQ_API_KEY', self.GROQ_API_KEY),
        ]
        
        missing = [var[0] for var in required_vars if not var[1]]
        
        if missing:
            error_msg = f"❌ Missing required environment variables: {', '.join(missing)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        logger.info("✅ All required environment variables are set")
        return True

settings = Settings()

# Validate on import
try:
    settings.validate()
except ValueError as e:
    logger.error(f"Configuration validation failed: {e}")
    raise
