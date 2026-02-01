from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import logging

from app.services.rag_service import retrieve_context
from app.services.llm_service import call_groq_api, build_system_prompt
from app.exceptions import DatabaseException, ModelException, ChatbotException
from app.services.indexing_service import indexing_service
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

from app.services.history_service import history_service

class ChatRequest(BaseModel):
    message: str
    user_id: str | None = None
    max_results: int = 5

class ChatResponse(BaseModel):
    answer: str
    context_used: list[str] | None = None
    request_id: str | None = None

@router.post("/system/reindex")
async def reindex_endpoint(request: Request):
    """
    Trigger a full re-indexing of the database.
    In a real production app, this should be protected by Auth and run as a Background Task.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.info(f"[{request_id}] Re-indexing triggered via API")
    
    # Run in background/thread pool because it's CPU intensive
    try:
        # We wrap the synchronous reindex_all in to_thread to avoid blocking event loop
        result = await asyncio.to_thread(indexing_service.reindex_all)
        return result
    except Exception as e:
        logger.error(f"[{request_id}] Re-indexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, request: Request):
    """
    Chat endpoint with rate limiting and enhanced error handling
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"[{request_id}] Received chat request: {req.message[:50]}...")
        
        if not req.message or len(req.message.strip()) == 0:
            raise HTTPException(status_code=400, detail="الرسالة فارغة")

        user_id = req.user_id or "default_user"
        
        # 1. Get/Create Conversation & Retrieve History
        try:
            conversation_id = history_service.get_or_create_conversation(user_id)
            history = history_service.get_recent_messages(conversation_id, limit=10)
        except Exception as e:
            logger.error(f"[{request_id}] Database error in conversation management: {e}")
            raise DatabaseException("خطأ في إدارة المحادثة")

        # 2. Query Rewriting
        search_query = req.message
        if len(history) > 0:
             try:
                 context_history = "\n".join([f"{m['role']}: {m['content']}" for m in history[-2:]])
                 rewrite_prompt = [
                     {"role": "system", "content": "أنت مساعد بحثي. أعد صياغة سؤال المستخدم الأخير ليكون سؤالاً مكتملاً مستقلاً يصلح للبحث في قاعدة البيانات، مع مراعاة سياق المحادثة السابقة إذا لزم الأمر."},
                     {"role": "user", "content": f"سياق سابق:\n{context_history}\n\nسؤال المستخدم الحالي: {req.message}\n\nالصياغة البحثية:"}
                 ]
                 rewritten = await call_groq_api(rewrite_prompt)
                 if rewritten and len(rewritten) < 200:
                     logger.info(f"[{request_id}] Query rewritten: '{req.message}' -> '{rewritten}'")
                     search_query = rewritten
             except Exception as e:
                 logger.warning(f"[{request_id}] Failed to rewrite query: {e}")

        # 3. Retrieve Context
        try:
            context_chunks = retrieve_context(search_query, k=req.max_results)
        except Exception as e:
            logger.error(f"[{request_id}] Error retrieving context: {e}")
            context_chunks = []
        
        # 4. Build System Prompt
        system_instruction = build_system_prompt(context_chunks)

        # 5. Prepare Messages for LLM
        messages = [{"role": "system", "content": system_instruction}]
        messages.extend(history)
        messages.append({"role": "user", "content": req.message})

        # 6. Call LLM
        try:
            answer_raw = await call_groq_api(messages)
        except Exception as e:
            logger.error(f"[{request_id}] Error calling LLM: {e}")
            raise ModelException("خطأ في نموذج الذكاء الاصطناعي")
        
        # 7. Save to Database
        try:
            history_service.add_message(conversation_id, "user", req.message)
            history_service.add_message(conversation_id, "assistant", answer_raw)
        except Exception as e:
            logger.error(f"[{request_id}] Error saving messages: {e}")
            # Don't fail the request if saving fails
        
        logger.info(f"[{request_id}] Request completed successfully")
        
        return ChatResponse(
            answer=answer_raw,
            context_used=context_chunks if context_chunks else None,
            request_id=request_id
        )
            
    except HTTPException:
        raise
    except DatabaseException as e:
        logger.error(f"[{request_id}] Database error: {e}")
        raise HTTPException(status_code=503, detail="خطأ في الاتصال بقاعدة البيانات")
    except ModelException as e:
        logger.error(f"[{request_id}] Model error: {e}")
        raise HTTPException(status_code=500, detail="خطأ في نموذج الذكاء الاصطناعي")
    except ChatbotException as e:
        logger.error(f"[{request_id}] Chatbot error: {e}")
        raise HTTPException(status_code=500, detail="حدث خطأ في النظام")
    except Exception as e:
        logger.error(f"[{request_id}] Unexpected error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="حدث خطأ غير متوقع")
