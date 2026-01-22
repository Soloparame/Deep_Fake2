from fastapi import APIRouter, status
from fastapi_backend.schemas.user import UserCreate, UserLogin, Token
from fastapi_backend.services.auth_service import AuthService

router = APIRouter()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate):
    return AuthService.register_user(user)

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    return AuthService.authenticate_user(user)
