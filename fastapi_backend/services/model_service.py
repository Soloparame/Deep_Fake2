import cv2
import numpy as np
import os
import logging
from fastapi_backend.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Handle TensorFlow import gracefully
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError as e:
    logger.error(f"Failed to import TensorFlow: {e}")
    TF_AVAILABLE = False
    tf = None

# Global variable to hold the model
_model = None

def load_model():
    """
    Loads the Keras model from disk.
    This should be called once at startup.
    """
    global _model
    
    if not TF_AVAILABLE:
        logger.warning("TensorFlow is not available. Running in MOCK mode.")
        return

    try:
        if os.path.exists(settings.MODEL_PATH):
            logger.info(f"Loading model from {settings.MODEL_PATH}...")
            _model = tf.keras.models.load_model(settings.MODEL_PATH)
            logger.info("Model loaded successfully.")
        else:
            logger.error(f"Model file not found at {settings.MODEL_PATH}")
            # For now, we might want to raise an error or handle it gracefully
            # raise FileNotFoundError(f"Model not found at {settings.MODEL_PATH}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        # raise e # Don't crash the app, just log it

def preprocess_frame(frame, target_size):
    """
    Preprocesses a single frame for the model.
    1. Resize
    2. Normalize (0-1)
    3. Expand dims (batch size)
    """
    frame = cv2.resize(frame, target_size)
    frame = frame.astype("float32") / 255.0
    frame = np.expand_dims(frame, axis=0)
    return frame

def predict_video(video_path: str):
    """
    Processes a video file and returns prediction results.
    """
    global _model
    
    # MOCK MODE if TF is missing or model didn't load
    if _model is None:
        if not TF_AVAILABLE:
             logger.warning("MOCK MODE: Skipping model inference.")
             # Simulate processing
             return {
                 "result": "FAKE", 
                 "confidence": 0.95, 
                 "frames_analyzed": 10,
                 "note": "MOCK RESULT (TensorFlow missing)"
             }
        else:
             raise RuntimeError("Model is not loaded (but TensorFlow is available). Check file path.")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")

    frames = []
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Determine sampling interval to get MAX_FRAMES_TO_PROCESS
    skip_frames = max(1, frame_count // settings.MAX_FRAMES_TO_PROCESS)
    
    predictions = []
    
    count = 0
    processed_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if count % skip_frames == 0 and processed_count < settings.MAX_FRAMES_TO_PROCESS:
            # Preprocess
            processed_frame = preprocess_frame(frame, settings.INPUT_SHAPE)
            
            # Predict
            pred = _model.predict(processed_frame, verbose=0)
            predictions.append(pred[0][0]) # Assuming binary classification output [0-1]
            
            processed_count += 1
            
        count += 1

    cap.release()
    
    if not predictions:
        return {"result": "UNKNOWN", "confidence": 0.0, "frames_analyzed": 0}
        
    # Aggregate predictions
    # Strategy: Average confidence
    avg_confidence = np.mean(predictions)
    
    # Thresholding (assuming 0=Real, 1=Fake or vice versa depending on training)
    # Usually: 0.5 threshold. 
    # Let's assume closer to 1 is FAKE, closer to 0 is REAL.
    # Adjust this based on your specific model training!
    
    threshold = 0.5
    is_fake = avg_confidence > threshold
    
    result = "FAKE" if is_fake else "REAL"
    confidence = float(avg_confidence) if is_fake else float(1 - avg_confidence)
    
    return {
        "result": result,
        "confidence": confidence,
        "frames_analyzed": processed_count
    }
