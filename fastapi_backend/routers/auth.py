from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# --- Schemas ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

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
    # In a real app, you would hash the password and save to DB
    # For now, we mock the success and return a token so the user is logged in
    return {
        "message": "User created successfully",
        "user": {
            "name": user.name,
            "email": user.email
        },
        "access_token": "mock-jwt-token-for-development",
        "token_type": "bearer"
    }

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    # In a real app, you would verify credentials against DB
    # Mock authentication
    if user.email == "test@example.com" and user.password == "wrong":
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Return a mock token
    return {
        "access_token": "mock-jwt-token-for-development",
        "token_type": "bearer",
        "user_name": "Test User",
        "user_email": user.email
    }
