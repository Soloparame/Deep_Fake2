from fastapi import APIRouter, status, Request, HTTPException
from fastapi_backend.schemas.user import UserCreate, UserLogin, Token, ChangePassword
from fastapi_backend.services.auth_service import AuthService

router = APIRouter()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate):
    return AuthService.register_user(user)

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    return AuthService.authenticate_user(user)

@router.get("/me")
async def get_current_user(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    return AuthService.get_current_user_profile(token)

@router.post("/change-password")
async def change_password(request: Request, payload: ChangePassword):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    return AuthService.change_password(token, payload)
