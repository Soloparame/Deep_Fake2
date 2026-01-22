from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi_backend.core.config import settings
from fastapi_backend.services import model_service
from fastapi_backend.models.knowledge import KnowledgeModel
from fastapi_backend.routers import detect, auth, chat, history

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model and seed knowledge base
    try:
        model_service.load_model()
        print("✅ Model loaded successfully!")
    except FileNotFoundError as e:
        print(f"❌ ERROR: Model file not found: {e}")
        print(f"   Please place your deepfake_model.h5 file at: {settings.MODEL_PATH}")
        print("   The API will start, but /api/detect-video will not work until the model is available.")
    except ImportError as e:
        print(f"❌ ERROR: {e}")
        print("   Please install TensorFlow: pip install tensorflow")
        print("   The API will start, but /api/detect-video will not work until TensorFlow is installed.")
    except Exception as e:
        print(f"❌ WARNING: Could not load model: {e}")
        print("   The API will start, but /api/detect-video will not work until the model loads successfully.")
    
    # Seed knowledge base
    try:
        KnowledgeModel.seed_defaults()
    except Exception as e:
        print(f"⚠️  Could not seed knowledge base: {e}")

    yield
    
    # Shutdown: Clean up if needed
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# CORS Setup
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(detect.router, prefix="/api", tags=["Detection"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(history.router, prefix="/api", tags=["History"])

@app.get("/")
def read_root():
    return {"message": "RealEye Backend is Running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_backend.main:app", host="0.0.0.0", port=4000, reload=True)
