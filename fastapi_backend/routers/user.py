from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
import hashlib
from fastapi_backend.database import users_col

router = APIRouter()

class PasswordUpdate(BaseModel):
    currentPassword: str
    newPassword: str

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    token = auth_header.split(" ")[1]
    user = users_col.find_one({"token": token})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token or session expired"
        )
    return user

@router.get("/user")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "user": {
            "id": str(current_user.get("id")),
            "name": current_user.get("name"),
            "email": current_user.get("email"),
            "company": current_user.get("company")
        }
    }

@router.put("/user/password")
async def update_password(
    data: PasswordUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Verify current password
    pwd_hash = hashlib.sha256(data.currentPassword.encode("utf-8")).hexdigest()
    if current_user.get("password_hash") != pwd_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update to new password
    new_hash = hashlib.sha256(data.newPassword.encode("utf-8")).hexdigest()
    users_col.update_one(
        {"_id": current_user.get("_id")},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password updated successfully"}
