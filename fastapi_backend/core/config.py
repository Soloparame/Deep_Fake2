import os

class Settings:
    PROJECT_NAME: str = "RealEye Backend"
    API_V1_STR: str = "/api"
    
    # Base directory
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Model path (full Saved Keras model)
    MODEL_PATH = os.path.join(BASE_DIR, "models", "deepfake_detector.keras")
    
    # Video processing settings
    MAX_FRAMES_TO_PROCESS = 30  # Number of frames to sample
    INPUT_SHAPE = (224, 224)    # Adjust based on your model's requirement
    FAKE_THRESHOLD = 0.6        # Safer threshold to reduce false FAKEs
    
settings = Settings()
