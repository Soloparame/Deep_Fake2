import hashlib
import uuid
from fastapi import HTTPException, status
from fastapi_backend.models.user import UserModel
from fastapi_backend.schemas.user import UserCreate, UserLogin, ChangePassword

class AuthService:
    _token_store = {}  # Deprecated fallback for dev restarts

    @staticmethod
    def _make_token(user_id: str) -> str:
        return f"re|{user_id}|{uuid.uuid4()}"

    @staticmethod
    def _extract_user_id(token: str) -> str:
        raw = token.replace("Bearer", "").strip()
        parts = raw.split("|")
        if len(parts) < 3 or parts[0] != "re":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")
        return parts[1]
    @staticmethod
    def register_user(user_data: UserCreate):
        existing = UserModel.get_by_email(user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        
        # Simple password hash
        pwd_hash = hashlib.sha256(user_data.password.encode("utf-8")).hexdigest()
        
        new_user = {
            "name": user_data.name,
            "email": user_data.email,
            "password_hash": pwd_hash
        }
        
        created = UserModel.create(new_user)
        
        token = AuthService._make_token(created["id"])
        return {
            "message": "User created successfully",
            "user": {
                "name": user_data.name,
                "email": user_data.email
            },
            "access_token": token,
            "token_type": "bearer"
        }

    @staticmethod
    def authenticate_user(login_data: UserLogin):
        user = UserModel.get_by_email(login_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        pwd_hash = hashlib.sha256(login_data.password.encode("utf-8")).hexdigest()
        if user.get("password_hash") != pwd_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Update last_login
        try:
            from datetime import datetime
            UserModel.update_last_login_by_id(user["id"], datetime.utcnow())
        except Exception:
            pass
             
        token = AuthService._make_token(user["id"])
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_name": user.get("name") or "User",
            "user_email": user.get("email")
        }

    @staticmethod
    def get_current_user_profile(token: str):
        user_id = AuthService._extract_user_id(token)
        user = UserModel.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {
            "id": user.get("id"),
            "email": user.get("email"),
            "name": user.get("name"),
            "created_at": user.get("created_at").isoformat() if hasattr(user.get("created_at"), "isoformat") else str(user.get("created_at")),
            "last_login": user.get("last_login").isoformat() if hasattr(user.get("last_login"), "isoformat") and user.get("last_login") else (str(user.get("last_login")) if user.get("last_login") else None),
            "mongo_id": str(user.get("_id")) if user.get("_id") else None,
        }

    @staticmethod
    def change_password(token: str, payload: ChangePassword):
        user_id = AuthService._extract_user_id(token)
        user = UserModel.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        old_hash = hashlib.sha256(payload.old_password.encode("utf-8")).hexdigest()
        if user.get("password_hash") != old_hash:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        new_hash = hashlib.sha256(payload.new_password.encode("utf-8")).hexdigest()
        updated = UserModel.update_password_by_id(user_id, new_hash)
        if not updated:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update password")
        return {"message": "Password updated successfully"}
