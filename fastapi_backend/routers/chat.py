from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import List
import datetime
from fastapi_backend.database import chats_col

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
    messages = []
    try:
        cursor = chats_col.find({}, sort=[("created_at", 1)], limit=50)
        for doc in cursor:
            messages.append({
                "id": str(doc.get("id", "")),
                "userId": str(doc.get("user_id", "")),
                "role": doc.get("role", "assistant"),
                "text": doc.get("text", ""),
                "createdAt": (doc.get("created_at") or datetime.datetime.utcnow()).isoformat()
            })
    except Exception:
        pass
    return {"messages": messages}

@router.post("/chat")
async def send_message(req: Request, request: ChatRequest):
    user_email = req.headers.get("X-User-Email")
    user_id = user_email or "anonymous"
    now = datetime.datetime.utcnow()
    
    user_msg = {
        "id": str(datetime.datetime.utcnow().timestamp()).replace(".", ""),
        "user_id": user_id,
        "role": "user",
        "text": request.message,
        "created_at": now
    }
    assistant_msg = {
        "id": str(datetime.datetime.utcnow().timestamp()).replace(".", ""),
        "user_id": user_id,
        "role": "assistant",
        "text": "I received your message. Real AI processing will be implemented soon.",
        "created_at": now
    }
    try:
        chats_col.insert_many([user_msg, assistant_msg])
    except Exception:
        pass
    
    return {
        "response": assistant_msg["text"],
        "messages": [
            {
                "id": user_msg["id"],
                "userId": user_id,
                "role": "user",
                "text": user_msg["text"],
                "createdAt": user_msg["created_at"].isoformat()
            },
            {
                "id": assistant_msg["id"],
                "userId": user_id,
                "role": "assistant",
                "text": assistant_msg["text"],
                "createdAt": assistant_msg["created_at"].isoformat()
            }
        ]
    }
