from fastapi import APIRouter, Request, HTTPException
from fastapi_backend.models.chat import ChatModel
from fastapi_backend.models.user import UserModel
from fastapi_backend.services.auth_service import AuthService
from typing import Dict, Any

router = APIRouter()

@router.get("/user/stats", response_model=Dict[str, Any])
async def get_user_stats(request: Request):
    """
    Get aggregated statistics for the current user.
    """
    # 1. Auth Check (Simplified for demo)
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    profile = AuthService.get_current_user_profile(token)
    user_email = profile["email"]
    
    # 2. Fetch Stats
    # Chat Stats
    chats = ChatModel.get_user_sessions(user_email) or []
    total_chats = len(chats)
    
    # Video Stats (Placeholder until VideoModel exists)
    total_videos = 0 
    
    return {
        "total_chats": total_chats,
        "total_videos": total_videos,
        "last_prediction": None, # Placeholder
        "last_chat_session": chats[0] if chats else None
    }
