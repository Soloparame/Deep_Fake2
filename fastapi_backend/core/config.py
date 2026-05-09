import os
from typing import List

from dotenv import load_dotenv, dotenv_values

# Load environment variables from fastapi_backend/.env
# Use same method as database.py to ensure consistency
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # fastapi_backend directory
ENV_PATH = os.path.join(BASE_DIR, ".env")
if not os.path.exists(ENV_PATH):
    # Fallback: try current working directory
    ENV_PATH = os.path.join(os.getcwd(), "fastapi_backend", ".env")
    if not os.path.exists(ENV_PATH):
        # Last fallback: try just .env in current directory
        ENV_PATH = os.path.join(os.getcwd(), ".env")

print(f"Loading email config from: {ENV_PATH}")
print(f"File exists: {os.path.exists(ENV_PATH)}")

# Load .env file and ensure variables are applied to process environment
if os.path.exists(ENV_PATH):
    values = dotenv_values(ENV_PATH)
    if values:
        for k, v in values.items():
            if v is not None:
                os.environ[k] = v
    load_dotenv(ENV_PATH, override=True)
    print(f"[OK] Loaded .env file from: {ENV_PATH}")
else:
    print(f"[WARN] .env file not found at: {ENV_PATH}")
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "RealEye Backend"
    API_V1_STR: str = "/api"
    
    # Base directory
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Model path (full Saved Keras model)
    MODEL_PATH = os.path.join(BASE_DIR, "models", "deepfake_detector.keras")
    
    # Video processing settings
    MAX_FRAMES_TO_PROCESS = 15  # Number of frames to sample
    INPUT_SHAPE = (224, 224)    # Adjust based on your model's requirement
    FAKE_THRESHOLD = 0.6        # Safer threshold to reduce false FAKEs
    
    # Email/SMTP settings (for password reset)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "noreply@realeye.com"))
    
    # Frontend URL for password reset links
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Hugging Face Inference API (for image detection)
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    HF_IMAGE_MODEL: str = os.getenv("HF_IMAGE_MODEL", "Ateeqq/ai-vs-human-image-detector")
    # Video: comma-separated HF model ids (must be inference-live on router; see hf_video_model_ids default)
    HF_VIDEO_MODELS: str = os.getenv("HF_VIDEO_MODELS", "")
    # "true" = /api/detect-video uses HF only (skips local Keras on startup). "false" = legacy local model.
    VIDEO_USE_HF_API: bool = os.getenv("VIDEO_USE_HF_API", "true").strip().lower() in (
        "1",
        "true",
        "yes",
    )
    
    # Groq (LLM strategy generation, e.g. SWOT)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    def hf_video_model_ids(self) -> List[str]:
        raw = (self.HF_VIDEO_MODELS or "").strip()
        if raw:
            return [x.strip().strip("/") for x in raw.split(",") if x.strip()]
        # These two resolve on router.huggingface.co (legacy api-inference is 410; many hub IDs are 404 on inference).
        return [
            "dima806/deepfake_vs_real_image_detection",
            "Ateeqq/ai-vs-human-image-detector",
        ]


settings = Settings()

# Print email config status on startup (for debugging)
print("Email Configuration Status:")
print(f"   SMTP_HOST: {settings.SMTP_HOST}")
print(f"   SMTP_PORT: {settings.SMTP_PORT}")
print(f"   SMTP_USER: {settings.SMTP_USER if settings.SMTP_USER else '[NOT SET]'}")
print(
    f"   SMTP_PASSWORD: {'[SET] (' + str(len(settings.SMTP_PASSWORD)) + ' chars)' if settings.SMTP_PASSWORD else '[NOT SET]'}"
)
print(f"   SMTP_FROM: {settings.SMTP_FROM}")
print(f"   FRONTEND_URL: {settings.FRONTEND_URL}")

# Debug: Show raw environment variables
print("\nDebug - Raw Environment Variables:")
print(f"   os.getenv('SMTP_USER'): {os.getenv('SMTP_USER', 'NOT FOUND')}")
print(f"   os.getenv('SMTP_PASSWORD'): {'FOUND (' + str(len(os.getenv('SMTP_PASSWORD', ''))) + ' chars)' if os.getenv('SMTP_PASSWORD') else 'NOT FOUND'}")
print(f"   os.getenv('SMTP_HOST'): {os.getenv('SMTP_HOST', 'NOT FOUND')}")
