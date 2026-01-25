import hashlib
import uuid
from fastapi import HTTPException, status
from fastapi_backend.models.user import UserModel
from fastapi_backend.schemas.user import UserCreate, UserLogin, ChangePassword
from fastapi_backend.services.email_service import EmailService
from fastapi_backend.core.config import settings

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

    @staticmethod
    def request_password_reset(email: str):
        """Generate and store password reset token, then send verification email"""
        user = UserModel.get_by_email(email)
        if not user:
            # Don't reveal if user exists for security
            return {"message": "If an account exists with this email, a reset link has been sent."}
        
        # Generate reset token
        reset_token = f"reset_{uuid.uuid4()}_{uuid.uuid4()}"
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
        
        UserModel.set_reset_token(email, reset_token, expires_at)
        
        # Create reset link
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        # Send verification email
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Attempting to send password reset email to {email}")
        
        email_sent = EmailService.send_password_reset_email(email, reset_link)
        
        if email_sent:
            logger.info(f"✅ Password reset email successfully sent to {email}")
            return {
                "message": "Password reset link has been sent to your email. Please check your inbox (and spam folder)."
            }
        else:
            # If email sending fails, still return success message for security
            # but log the issue. In development, you might want to return the link
            # For production, this should always send email
            logger.warning(f"❌ Failed to send password reset email to {email}, but token was generated")
            
            # In development, return link if SMTP not configured
            # In production, this should not happen
            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                logger.warning("SMTP not configured - returning reset link in response for development")
                return {
                    "message": "Password reset link generated. Email service not configured. Please configure SMTP settings in .env file. Check backend logs for details.",
                    "reset_link": reset_link,  # Only in development
                    "reset_token": reset_token  # Only in development
                }
            else:
                logger.error("SMTP is configured but email sending failed. Check backend logs for error details.")
                return {
                    "message": "Password reset link has been sent to your email. Please check your inbox and spam folder. If you don't receive it, check backend logs for errors."
                }

    @staticmethod
    def reset_password(reset_token: str, new_password: str):
        """Reset password using reset token"""
        user = UserModel.get_by_reset_token(reset_token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Update password
        new_hash = hashlib.sha256(new_password.encode("utf-8")).hexdigest()
        updated = UserModel.update_password_by_email(user["email"], new_hash)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset password"
            )
        
        # Clear reset token
        UserModel.clear_reset_token(user["email"])
        
        return {"message": "Password has been reset successfully"}
