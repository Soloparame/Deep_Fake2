import hashlib
import uuid
from fastapi import HTTPException, status
from fastapi_backend.models.user import UserModel
from fastapi_backend.schemas.user import UserCreate, UserLogin

class AuthService:
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
        
        UserModel.create(new_user)
        
        token = f"token-{uuid.uuid4()}"
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
            
        token = f"token-{uuid.uuid4()}"
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_name": user.get("name") or "User",
            "user_email": user.get("email")
        }
