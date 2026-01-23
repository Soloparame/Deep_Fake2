from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi_backend.core.config import settings
from fastapi_backend.services import model_service
from fastapi_backend.models.knowledge import KnowledgeModel
from fastapi_backend.routers import detect, auth, chat, history, user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model and seed knowledge base
    try:
        model_service.load_model()
        # Check if model actually loaded or if we're in mock mode
        if model_service._model is not None:
            print("✅ Model loaded successfully!")
        elif model_service.MOCK_MODE:
            print("⚠️  Model loading failed - MOCK MODE enabled")
            print("   The API will work with simulated predictions for testing.")
        else:
            print("❌ WARNING: Model is not loaded and MOCK_MODE is disabled")
            print("   The API may not work correctly. Check server logs for details.")
    except FileNotFoundError as e:
        print(f"❌ ERROR: Model file not found: {e}")
        print(f"   Please place your model file at: {settings.MODEL_PATH}")
        print("   MOCK MODE will be enabled - API will work with simulated predictions.")
    except ImportError as e:
        print(f"❌ ERROR: {e}")
        print("   Please install TensorFlow: pip install tensorflow")
        print("   MOCK MODE will be enabled - API will work with simulated predictions.")
    except Exception as e:
        print(f"❌ WARNING: Could not load model: {e}")
        print("   MOCK MODE will be enabled - API will work with simulated predictions.")
    
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
app.include_router(user.router, prefix="/api", tags=["User"])

@app.get("/")
def read_root():
    return {"message": "RealEye Backend is Running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_backend.main:app", host="0.0.0.0", port=4000, reload=True)
