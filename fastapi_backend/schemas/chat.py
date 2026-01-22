from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    id: str
    role: str  # "user" or "assistant"
    text: str
    created_at: str

class ChatSession(BaseModel):
    session_id: str
    title: str
    created_at: str
    updated_at: str

class ChatSessionDetail(ChatSession):
    messages: List[ChatMessage]

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Chat"

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # If None, creates a new session

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message: ChatMessage
