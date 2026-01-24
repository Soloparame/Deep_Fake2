from fastapi import APIRouter, Request, status, HTTPException
from typing import List, Dict
from fastapi_backend.schemas.chat import (
    ChatRequest, 
    ChatResponse, 
    ChatSession, 
    ChatSessionDetail,
    CreateSessionRequest,
    ChatMessage
)
from fastapi_backend.services.chat_service import ChatService
from fastapi_backend.services.auth_service import AuthService

router = APIRouter()

def get_user_email_from_token(req: Request) -> str:
    """Extract user email from Authorization token"""
    token = req.headers.get("Authorization")
    if not token:
        return "anonymous"
    try:
        profile = AuthService.get_current_user_profile(token)
        return profile.get("email", "anonymous")
    except:
        return "anonymous"

@router.get("/chat", response_model=Dict[str, List[ChatMessage]])
async def get_latest_chat(req: Request):
    """Get messages from the most recent session (or empty)"""
    user_email = get_user_email_from_token(req)
    return ChatService.get_latest_session_messages(user_email)

@router.get("/chat/questions", response_model=List[str])
async def get_suggested_questions():
    """Get list of suggested questions from knowledge base"""
    return ChatService.get_suggested_questions()

@router.get("/chat/sessions", response_model=List[ChatSession])
async def get_sessions(req: Request):
    """Get all chat sessions for the user"""
    user_email = get_user_email_from_token(req)
    return ChatService.get_user_sessions(user_email)

@router.post("/chat/sessions", status_code=status.HTTP_201_CREATED)
async def create_session(req: Request, body: CreateSessionRequest):
    """Create a new chat session"""
    user_email = get_user_email_from_token(req)
    session_id = ChatService.create_session(user_email, body.title)
    return {"session_id": session_id}

@router.get("/chat/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session_history(req: Request, session_id: str):
    """Get full history of a specific session"""
    user_email = get_user_email_from_token(req)
    
    session = ChatService.get_session_detail(session_id, user_email)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/chat", response_model=ChatResponse)
async def send_message(req: Request, request: ChatRequest):
    """
    Send a message to the chatbot.
    If session_id is provided, appends to that session.
    If not, creates a new session.
    """
    user_email = get_user_email_from_token(req)
    
    return ChatService.process_message(user_email, request.session_id, request.message)
