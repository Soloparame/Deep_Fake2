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
MOCK_MODE = False

def load_model():
    """
    Loads the TensorFlow/Keras model from disk.
    
    **CRITICAL:** This function MUST be called ONLY ONCE at application startup.
    Loading the model is expensive (takes several seconds) and uses significant memory.
    
    **Why load once?**
    - Model files are large (often 50-500MB)
    - Loading takes 2-10 seconds
    - Model stays in memory for fast inference
    - Loading on every request would be 100x slower
    
    **When is this called?**
    - Automatically during FastAPI startup (see main.py lifespan event)
    
    **Raises:**
        FileNotFoundError: If model file doesn't exist
        Exception: If model loading fails (corrupted file, version mismatch, etc.)
    """
    global _model, MOCK_MODE
    
    if not TF_AVAILABLE:
        logger.error("TensorFlow is not available. Cannot load model.")
        raise ImportError("TensorFlow is required but not installed. Install with: pip install tensorflow")

    # Check if model file exists
    if not os.path.exists(settings.MODEL_PATH):
        error_msg = f"Model file not found at: {settings.MODEL_PATH}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    try:
        logger.info(f"Loading TensorFlow/Keras model from: {settings.MODEL_PATH}")
        logger.info("This may take a few seconds...")
        
        # Load the model
        # Model was saved with TensorFlow 2.10 or earlier (uses batch_shape)
        # TensorFlow 2.13+ doesn't support batch_shape, so we need TF 2.10
        # Try multiple loading strategies
        _model = None
        last_error = None
        
        # Prefer Keras v3 loader for .keras format
        if settings.MODEL_PATH.endswith(".keras"):
            try:
                logger.info("Detected .keras format. Using Keras v3 loader...")
                import keras as k
                _model = k.models.load_model(settings.MODEL_PATH, compile=False)
                logger.info("✅ Model loaded successfully with Keras v3 loader!")
            except Exception as e0:
                last_error = e0
                logger.warning(f"Keras v3 loader failed: {str(e0)[:200]}")
        
        # Strategy 1: Standard TF-Keras load (if not loaded yet)
        if _model is None:
            try:
                logger.info("Attempting standard TF-Keras model load...")
                _model = tf.keras.models.load_model(settings.MODEL_PATH, compile=False)
                logger.info("✅ Model loaded successfully with TF-Keras!")
            except Exception as e1:
                last_error = e1
                logger.warning(f"TF-Keras load failed: {str(e1)[:200]}")
            
            # Strategy 2: Load with safe_mode=False
            try:
                logger.info("Attempting compatibility mode (safe_mode=False)...")
                _model = tf.keras.models.load_model(
                    settings.MODEL_PATH,
                    compile=False,
                    safe_mode=False
                )
                logger.info("✅ Model loaded with compatibility mode!")
            except Exception as e2:
                last_error = e2
                logger.warning(f"Compatibility mode failed: {str(e2)[:150]}")
                
                # Strategy 3: Try with custom objects for DTypePolicy
                try:
                    logger.info("Attempting load with custom objects...")
                    from keras import initializers
                    
                    custom_objects = {
                        'GlorotUniform': initializers.GlorotUniform,
                        'Zeros': initializers.Zeros,
                    }
                    
                    # Try to handle DTypePolicy if it exists
                    try:
                        from keras.dtype_policies import dtype_policy
                        custom_objects['DTypePolicy'] = dtype_policy.DTypePolicy
                    except:
                        try:
                            # Alternative import path
                            from keras import dtype_policies
                            custom_objects['DTypePolicy'] = dtype_policies.DTypePolicy
                        except:
                            pass
                    
                    _model = tf.keras.models.load_model(
                        settings.MODEL_PATH,
                        compile=False,
                        custom_objects=custom_objects
                    )
                    logger.info("✅ Model loaded with custom objects!")
                except Exception as e3:
                    last_error = e3
                    logger.error(f"Custom objects load failed: {str(e3)[:150]}")

                    # Attempt legacy InputLayer compatibility fallback
                    logger.info("Attempting legacy InputLayer compatibility fallback...")
                    try:
                        from tensorflow.keras.layers import InputLayer as TFInputLayer

                        class CompatInputLayer(TFInputLayer):
                            def __init__(self, batch_shape=None, **kwargs):
                                # Map legacy 'batch_shape' -> 'batch_input_shape'
                                if batch_shape is not None:
                                    kwargs.setdefault('batch_input_shape', batch_shape)
                                super().__init__(**kwargs)

                        _model = tf.keras.models.load_model(
                            settings.MODEL_PATH,
                            compile=False,
                            custom_objects={
                                'InputLayer': CompatInputLayer
                            }
                        )
                        logger.info("Model loaded using legacy InputLayer wrapper.")
                    except Exception as e4:
                        last_error = e4
                        logger.error(f"Legacy compatibility load failed: {e4}")
                        # Check for weights-only file (no model config)
                        try:
                            import h5py
                            with h5py.File(settings.MODEL_PATH, 'r') as f:
                                has_config = 'model_config' in f
                        except Exception:
                            has_config = True  # assume config exists if we cannot read file

                        if not has_config:
                            error_msg = (
                                "Model file appears to contain only weights (no model_config).\n"
                                "You need the model architecture to load weights.\n"
                                "Options:\n"
                                "  - Obtain the original model file that includes architecture, or\n"
                                "  - Recreate the model architecture in code and call `model.load_weights(...)`, then save the full model.\n"
                            )
                        else:
                            error_msg = (
                                "Failed to load model with compatibility fallbacks.\n"
                                "Recommended: load and re-save the model in an environment that can read it (try TensorFlow 2.10), e.g.:\n"
                                "  pip install tensorflow==2.10.0\n"
                                "  python -c \"import tensorflow as tf; m = tf.keras.models.load_model('fastapi_backend/models/deepfake_model.h5', compile=False); m.save('fastapi_backend/models/deepfake_model_compat.h5')\"\n"
                            )

                        logger.error(error_msg)
                        raise RuntimeError(error_msg) from last_error

        if _model is None:
            raise RuntimeError("Model loading failed - all strategies exhausted")
        
        # Log model summary for debugging
        logger.info("Model loaded successfully!")
        logger.info(f"Model input shape: {_model.input_shape}")
        logger.info(f"Model output shape: {_model.output_shape}")
        
    except Exception as e:
        error_msg = f"Failed to load model: {str(e)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e

def preprocess_frame(frame, target_size: tuple) -> np.ndarray:
    """
    Preprocesses a single video frame for model inference.
    
    **Steps:**
    1. Resize frame to model's expected input size (e.g., 224x224)
    2. Normalize pixel values from [0-255] to [0.0-1.0]
    3. Expand dimensions to add batch dimension (model expects batch)
    
    **Example:**
    - Input: (480, 640, 3) → Resize → (224, 224, 3) → Normalize → Expand → (1, 224, 224, 3)
    
    **Args:**
        frame: OpenCV frame (numpy array, shape: [height, width, channels])
        target_size: Tuple (width, height) for resizing
        
    **Returns:**
        np.ndarray: Preprocessed frame ready for model input
                   Shape: (1, height, width, channels)
    """
    # Convert BGR (OpenCV) -> RGB (Keras/TF models typically expect RGB)
    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Resize to model's expected input size
    frame = cv2.resize(frame, target_size)
    
    # Normalize pixel values: [0-255] → [0.0-1.0]
    # This is standard for most deep learning models
    frame = frame.astype("float32") / 255.0
    
    # Add batch dimension: (224, 224, 3) → (1, 224, 224, 3)
    # Models expect batch dimension even for single predictions
    frame = np.expand_dims(frame, axis=0)
    
    return frame

def predict_video(video_path: str) -> dict:
    """
    Processes a video file and returns prediction results.
    
    **Process Flow:**
    1. Opens video file using OpenCV
    2. Samples frames (not every frame for performance)
    3. Preprocesses each frame (resize, normalize)
    4. Runs model inference on each frame
    5. Aggregates predictions across all frames
    6. Applies threshold to classify REAL/FAKE
    7. Returns result with confidence score
    
    **Args:**
        video_path (str): Path to the video file
        
    **Returns:**
        dict: {
            "result": "REAL" or "FAKE",
            "confidence": float (0.0 to 1.0)
        }
        
    **Raises:**
        RuntimeError: If model is not loaded
        ValueError: If video file cannot be opened or processed
    """
    global _model, MOCK_MODE
    
    # Check if model is loaded
    if _model is None and not MOCK_MODE:
        error_msg = "Model is not loaded and Mock Mode is disabled. Check server logs."
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    if MOCK_MODE:
        logger.warning("Running prediction in MOCK MODE (Real model unavailable).")
        import time
        import random
        
        # Simulate processing time
        time.sleep(1.5)
        
        # Simulate a result (mostly REAL for test, occasionally FAKE)
        is_fake = random.random() > 0.7  # 30% chance of fake
        confidence = 0.85 + (random.random() * 0.14) if is_fake else 0.10 + (random.random() * 0.10)
        
        result_label = "FAKE" if is_fake else "REAL"
        
        return {
            "result": result_label,
            "confidence": float(confidence),
            "mock_mode": True
        }

    # Open video file
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    try:
        # Get video properties
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        if frame_count == 0:
            raise ValueError("Video file appears to be empty or corrupted")
        
        logger.info(f"Processing video: {frame_count} frames, {fps:.2f} FPS")
        
        # Determine input size from model if available
        input_size = settings.INPUT_SHAPE
        try:
            ishape = getattr(_model, "input_shape", None)
            if isinstance(ishape, tuple) and len(ishape) >= 4:
                w = ishape[1]
                h = ishape[2]
                if isinstance(w, int) and isinstance(h, int) and w > 0 and h > 0:
                    input_size = (w, h)
        except Exception:
            pass
        
        # Determine sampling interval to get MAX_FRAMES_TO_PROCESS
        # Example: If video has 300 frames and we want 30 frames,
        # we sample every 10th frame (skip_frames = 10)
        skip_frames = max(1, frame_count // settings.MAX_FRAMES_TO_PROCESS)
        
        predictions = []
        frame_index = 0
        processed_count = 0
        
        # Read and process frames
        while processed_count < settings.MAX_FRAMES_TO_PROCESS:
            ret, frame = cap.read()
            if not ret:
                # End of video
                break
            
            # Sample frames based on skip interval
            if frame_index % skip_frames == 0:
                try:
                    # Preprocess frame (resize, normalize)
                    processed_frame = preprocess_frame(frame, input_size)
                    
                    # Run model inference
                    # Model output shape: [batch_size, 1] for binary classification
                    # or [batch_size, 2] for softmax over classes
                    pred = _model.predict(processed_frame, verbose=0)
                    
                    # Extract prediction value
                    arr = np.array(pred)
                    flat = arr.flatten()
                    
                    # If softmax with two classes and sums to ~1, use index 1 as "fake" prob
                    if flat.size >= 2 and np.all((flat >= 0.0) & (flat <= 1.0)) and abs(np.sum(flat[:2]) - 1.0) < 1e-3:
                        prediction_value = float(flat[1])
                    else:
                        # Single logit or single probability
                        v = float(flat[0])
                        # If outside [0,1], treat as logit and apply sigmoid
                        if v < 0.0 or v > 1.0:
                            prediction_value = float(1.0 / (1.0 + np.exp(-v)))
                        else:
                            prediction_value = v
                    predictions.append(prediction_value)
                    
                    processed_count += 1
                    
                except Exception as e:
                    logger.warning(f"Error processing frame {frame_index}: {e}")
                    # Continue with next frame instead of failing
            
            frame_index += 1
        
        # Release video capture
        cap.release()
        
        # Validate we got predictions
        if not predictions:
            raise ValueError("Could not extract any valid frames from video")
        
        logger.info(f"Processed {processed_count} frames, got {len(predictions)} predictions")
        
        # ============================================
        # AGGREGATION LOGIC
        # ============================================
        # Strategy: Average all frame predictions
        # This gives us a single probability score
        avg_confidence = np.mean(predictions)
        
        # ============================================
        # THRESHOLDING & CLASSIFICATION
        # ============================================
        # Assumption: Model outputs probability where:
        #   - Close to 0.0 = REAL video
        #   - Close to 1.0 = FAKE video (deepfake)
        # 
        # Threshold: 0.5 (can be adjusted based on your model's training)
        # If avg_confidence > 0.5 → FAKE
        # If avg_confidence <= 0.5 → REAL
        #
        # Confidence score: 
        #   - For FAKE: use avg_confidence directly
        #   - For REAL: use (1 - avg_confidence) to show "realness" confidence
        
        threshold = 0.5
        is_fake = avg_confidence > threshold
        
        result = "FAKE" if is_fake else "REAL"
        
        # Confidence reflects certainty relative to threshold (0.5):
        #  - Near 0.5 → low confidence
        #  - Far from 0.5 → high confidence
        confidence = float(abs(avg_confidence - threshold) * 2.0)
        confidence = max(0.0, min(1.0, confidence))
        
        logger.info(f"Prediction: {result} (confidence: {confidence:.3f})")
        
        return {
            "result": result,
            "confidence": confidence
        }
        
    except Exception as e:
        # Ensure video is released even on error
        cap.release()
        raise ValueError(f"Error processing video: {str(e)}")
