from app.database import get_connection, return_connection
import uuid
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class HistoryService:
    def get_or_create_conversation(self, user_id: str) -> str:
        """
        Get the ID of the most recent active conversation for the user, 
        or create a new one if none exists (or if the last one is too old).
        For simplicity, we just return the most recent one or create new.
        """
        conn = get_connection()
        cur = conn.cursor()
        try:
            # Check for existing conversation
            cur.execute("""
                SELECT id FROM conversations 
                WHERE user_id = %s 
                ORDER BY last_activity_at DESC 
                LIMIT 1
            """, (user_id,))
            row = cur.fetchone()
            
            if row:
                conv_id = str(row[0])
                # Update last activity
                cur.execute("UPDATE conversations SET last_activity_at = NOW() WHERE id = %s", (conv_id,))
                conn.commit()
                return conv_id
            else:
                # Create new
                conv_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO conversations (id, user_id) 
                    VALUES (%s, %s)
                """, (conv_id, user_id))
                conn.commit()
                return conv_id
        except Exception as e:
            logger.error(f"Error in get_or_create_conversation: {e}")
            conn.rollback()
            raise
        finally:
            cur.close()
            return_connection(conn)

    def add_message(self, conversation_id: str, role: str, content: str):
        """Save a message to the database"""
        conn = get_connection()
        cur = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO messages (conversation_id, role, content)
                VALUES (%s, %s, %s)
            """, (conversation_id, role, content))
            
            # Update conversation timestamp
            cur.execute("UPDATE conversations SET last_activity_at = NOW() WHERE id = %s", (conversation_id,))
            conn.commit()
        except Exception as e:
            logger.error(f"Error in add_message: {e}")
            conn.rollback()
            raise
        finally:
            cur.close()
            return_connection(conn)

    def get_recent_messages(self, conversation_id: str, limit: int = 10) -> List[Dict]:
        """Fetch recent messages for context"""
        conn = get_connection()
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT role, content 
                FROM messages 
                WHERE conversation_id = %s 
                ORDER BY created_at ASC 
            """, (conversation_id,))
            rows = cur.fetchall()
            
            # If total messages > limit, take the last 'limit'
            # (Fetching all and slicing in python is easier for maintaining chronological order)
            if len(rows) > limit:
                rows = rows[-limit:]
                
            return [{"role": r[0], "content": r[1]} for r in rows]
        except Exception as e:
            logger.error(f"Error in get_recent_messages: {e}")
            return []
        finally:
            cur.close()
            return_connection(conn)

history_service = HistoryService()
