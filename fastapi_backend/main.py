import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi_backend.core.config import settings
from fastapi_backend.services import model_service
from fastapi_backend.models.knowledge import KnowledgeModel
from fastapi_backend.routers import detect, auth, chat, history, user, community, analyze, plagiarism
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model and seed knowledge base
    try:
        model_service.load_model()
        if model_service.uses_hf_video():
            mids = ", ".join(settings.hf_video_model_ids())
            print(
                "[OK] Video detection: Hugging Face Inference API "
                f"({mids}). No local .keras file required."
            )
        else:
            print("[OK] Local Keras model loaded for video detection.")
    except FileNotFoundError as e:
        print(f"[ERROR] Model file not found: {e}")
        print(f"   Please place your deepfake model at: {settings.MODEL_PATH}")
        print("   Or set HF_TOKEN and VIDEO_USE_HF_API=true (default) to use Hugging Face for video.")
        print("   The API will start, but /api/detect-video will not work until a backend is available.")
    except ImportError as e:
        print(f"[ERROR] {e}")
        print("   Install TensorFlow 2.10.x, or run: pip uninstall keras")
        print("   (A separate Keras 3 install often breaks TensorFlow 2.10’s bundled keras.)")
        print("   Or use HF_TOKEN + VIDEO_USE_HF_API=true for API-based video detection.")
        print("   The API will start, but local /api/detect-video will not work until the model loads.")
    except Exception as e:
        print(f"[WARN] Could not load model: {e}")
        print("   The API will start, but local /api/detect-video will not work until the model loads successfully.")
    
    # Seed knowledge base
    try:
        KnowledgeModel.seed_defaults()
    except Exception as e:
        print(f"[WARN] Could not seed knowledge base: {e}")

    yield
    
    # Shutdown: Clean up if needed
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# CORS: localhost always allowed for local dev. Set ALLOWED_ORIGINS on Render for production
# (comma-separated), e.g. https://your-app.vercel.app — no change needed in fastapi_backend/.env locally.
_DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]


def _cors_origins() -> list[str]:
    origins = list(_DEFAULT_CORS_ORIGINS)
    extra = os.getenv("ALLOWED_ORIGINS", "").strip()
    if extra:
        for origin in extra.split(","):
            o = origin.strip().rstrip("/")
            if o and o not in origins:
                origins.append(o)
    return origins


origins = _cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(detect.router, prefix="/api", tags=["Detection"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(user.router, prefix="/api", tags=["User"])
app.include_router(community.router, prefix="/api", tags=["Community"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(plagiarism.router, prefix="/api/plagiarism", tags=["Plagiarism"])

app.mount("/static/testvideo", StaticFiles(directory=f"{settings.BASE_DIR}/testvideo"), name="testvideo")

@app.get("/")
def read_root():
    return {"message": "RealEye Backend is Running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_backend.main:app", host="0.0.0.0", port=8000, reload=True)
