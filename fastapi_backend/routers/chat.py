from fastapi import APIRouter, Request
from fastapi_backend.schemas.chat import ChatRequest, ChatHistoryResponse, ChatResponse
from fastapi_backend.services.chat_service import ChatService

router = APIRouter()

@router.get("/chat", response_model=ChatHistoryResponse)
async def get_chat_history():
    messages = ChatService.get_history()
    return {"messages": messages}

@router.post("/chat", response_model=ChatResponse)
async def send_message(req: Request, request: ChatRequest):
    user_email = req.headers.get("X-User-Email")
    user_id = user_email or "anonymous"
    
    return ChatService.process_message(user_id, request.message)
