from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    id: str
    userId: str
    role: str
    text: str
    createdAt: str

class ChatRequest(BaseModel):
    message: str

class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    response: str
    messages: List[ChatMessage]
