from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import hashlib
import uuid
import datetime
from fastapi_backend.database import users_col

router = APIRouter()

# --- Schemas ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str

# --- Endpoints ---

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate):
    # Check if user already exists
    existing = users_col.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Simple password hash (for demo; replace with a proper hash in production)
    pwd_hash = hashlib.sha256(user.password.encode("utf-8")).hexdigest()
    
    doc = {
        "id": str(uuid.uuid4()),
        "name": user.name,
        "email": user.email,
        "password_hash": pwd_hash,
        "company": user.company,
        "created_at": datetime.datetime.utcnow()
    }
    result = users_col.insert_one(doc)
    
    token = f"token-{uuid.uuid4()}"
    
    # Store token in database
    users_col.update_one(
        {"_id": result.inserted_id},
        {"$set": {"token": token}}
    )
    
    return {
        "message": "User created successfully",
        "user": {
            "name": user.name,
            "email": user.email
        },
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    # Verify credentials against DB
    found = users_col.find_one({"email": user.email})
    if not found:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    pwd_hash = hashlib.sha256(user.password.encode("utf-8")).hexdigest()
    if found.get("password_hash") != pwd_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token = f"token-{uuid.uuid4()}"
    
    # Store token in database
    users_col.update_one(
        {"_id": found.get("_id")},
        {"$set": {"token": token}}
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": found.get("name") or "User",
        "user_email": user.email
    }
