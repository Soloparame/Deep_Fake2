from fastapi import APIRouter, Request, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi_backend.database import analyses_col, predictions_col
from fastapi_backend.models.chat import ChatModel
from fastapi_backend.services.auth_service import AuthService
from typing import Dict, Any

router = APIRouter()

@router.get("/user/stats", response_model=Dict[str, Any])
async def get_user_stats(request: Request):
    """
    Get aggregated statistics for the current user (MongoDB: chats, predictions, plagiarism analyses).
    """
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    profile = AuthService.get_current_user_profile(token)
    user_email = profile["email"]

    chats = ChatModel.get_user_sessions(user_email) or []
    total_chats = len(chats)

    total_predictions = 0
    total_images = 0
    total_videos = 0
    last_prediction = None
    try:
        preds = list(predictions_col.find({"user_email": user_email}))
        total_predictions = len(preds)
        for p in preds:
            t = (p.get("type") or "").lower()
            if t == "image":
                total_images += 1
            elif t == "video":
                total_videos += 1
        if preds:
            preds.sort(key=lambda x: x.get("created_at") or 0, reverse=True)
            last_prediction = preds[0]
    except Exception as e:
        print(f"Error fetching prediction stats: {e}")

    total_analyses = 0
    try:
        total_analyses = analyses_col.count_documents({"user_email": user_email})
    except Exception as e:
        print(f"Error fetching analysis stats: {e}")

    last_chat_session = None
    if chats:
        try:
            chats_sorted = sorted(
                chats,
                key=lambda x: x.get("updated_at") or x.get("created_at") or 0,
                reverse=True,
            )
            last_chat_session = chats_sorted[0]
        except Exception:
            last_chat_session = chats[0]

    return jsonable_encoder(
        {
            "email": user_email,
            "name": profile.get("name"),
            "total_chats": total_chats,
            "total_predictions": total_predictions,
            "total_images": total_images,
            "total_videos": total_videos,
            "total_analyses": total_analyses,
            "last_prediction": last_prediction,
            "last_chat_session": last_chat_session,
        }
    )
