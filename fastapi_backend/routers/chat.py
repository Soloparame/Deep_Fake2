from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
import datetime

router = APIRouter()

class ChatMessage(BaseModel):
    id: str
    userId: str
    role: str
    text: str
    createdAt: str

class ChatRequest(BaseModel):
    message: str

@router.get("/chat")
async def get_chat_history():
    # Return mock history
    return {
        "messages": [
            {
                "id": "1",
                "userId": "user-1",
                "role": "assistant",
                "text": "Hello! I am your Deepfake Detection Assistant. How can I help you today?",
                "createdAt": datetime.datetime.now().isoformat()
            }
        ]
    }

@router.post("/chat")
async def send_message(request: ChatRequest):
    # Mock response
    return {
        "response": "This is a mock response. The backend is running in development mode.",
        "messages": [
            {
                "id": "2",
                "userId": "user-1",
                "role": "user",
                "text": request.message,
                "createdAt": datetime.datetime.now().isoformat()
            },
            {
                "id": "3",
                "userId": "user-1",
                "role": "assistant",
                "text": "I received your message. Real AI processing will be implemented soon.",
                "createdAt": datetime.datetime.now().isoformat()
            }
        ]
    }
