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
    global _model
    
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
                
                # Strategy 3: Handle batch_shape mismatch (common issue)
                try:
                    logger.info("Attempting to load with custom object scope...")
                    # Sometimes custom layers or specific TF versions need help
                    with tf.keras.utils.custom_object_scope({'BatchNormalization': tf.keras.layers.BatchNormalization}):
                        _model = tf.keras.models.load_model(settings.MODEL_PATH, compile=False)
                    logger.info("✅ Model loaded with custom object scope!")
                except Exception as e3:
                    last_error = e3
                    logger.warning(f"Custom object load failed: {str(e3)[:150]}")
                    
                    # Strategy 4: H5PY manual config fix (Deep fallback)
                    # This is for models saved with 'batch_shape' in config which breaks new TF
                    try:
                        logger.info("Attempting deep h5py architecture rebuild...")
                        import h5py
                        import json
                        
                        with h5py.File(settings.MODEL_PATH, 'r') as f:
                            if 'model_config' in f:
                                config = json.loads(f['model_config'][()])
                                
                                # Fix batch_shape issues in config
                                def fix_batch_shape(obj):
                                    if isinstance(obj, dict):
                                        if 'batch_shape' in obj:
                                            obj['batch_input_shape'] = obj.pop('batch_shape')
                                        for key, value in obj.items():
                                            fix_batch_shape(value)
                                    elif isinstance(obj, list):
                                        for item in obj:
                                            fix_batch_shape(item)
                                
                                fix_batch_shape(config)
                                
                                # Rebuild model from fixed config
                                from tensorflow.keras.models import model_from_config
                                _model = model_from_config(config)
                                
                                # Load weights
                                _model.load_weights(settings.MODEL_PATH)
                                logger.info("✅ Model loaded with h5py architecture rebuild!")
                            else:
                                raise ValueError("No model_config found in h5 file")
                    except Exception as e4:
                        last_error = e4
                        logger.error(f"h5py architecture rebuild failed: {e4}")
                        
                        # Final fallback: Check for weights-only file
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
                                "Failed to load model with all compatibility fallbacks.\n"
                                "The model file may be corrupted or saved with an incompatible TensorFlow version.\n"
                                "Recommended solutions:\n"
                                "  1. Re-save the model in TensorFlow 2.10 environment\n"
                                "  2. Use the original training code to recreate and save the model\n"
                                "  3. Convert the model to a more compatible format (ONNX, TFLite)\n"
                            )

                        logger.error(error_msg)
                        raise RuntimeError(error_msg) from last_error

        if _model is None:
            raise RuntimeError("Model could not be loaded.")
        
        # Log model summary for debugging
        logger.info("Model loaded successfully!")
        if hasattr(_model, "input_shape"):
            logger.info(f"Model input shape: {_model.input_shape}")
        if hasattr(_model, "output_shape"):
            logger.info(f"Model output shape: {_model.output_shape}")
        
    except Exception as e:
        error_msg = f"Failed to load model: {str(e)}"
        logger.error(error_msg)
        raise e


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
    # cv2.resize expects (width, height)
    frame = cv2.resize(frame, target_size)
    
    # Normalize pixel values: [0-255] → [0.0-1.0]
    # This is standard for most deep learning models
    frame = frame.astype("float32") / 255.0
    
    # Note: We do NOT expand dimensions here if we are building a batch manually
    # But for single frame models, we usually do.
    # The caller will handle dimension expansion if needed for batching.
    
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
            "label": "REAL" or "FAKE",
            "score": float (0.0 to 1.0),
            "probability": float,
            "classification": str
        }
        
    **Raises:**
        RuntimeError: If model is not loaded
        ValueError: If video file cannot be opened or processed
    """
    global _model
    
    # Check if model is loaded
    if _model is None:
        error_msg = "Model is not loaded. Please ensure the model file exists at the correct path."
        logger.error(error_msg)
        raise RuntimeError(error_msg)

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
        
        # Determine input size and shape from model
        input_size = settings.INPUT_SHAPE
        is_video_model = False
        seq_length = 1
        
        try:
            ishape = getattr(_model, "input_shape", None)
            if isinstance(ishape, tuple):
                logger.info(f"Detected model input shape: {ishape}")
                
                # Check for 5D input (Batch, Frames, Height, Width, Channels)
                if len(ishape) == 5:
                    is_video_model = True
                    seq_length = ishape[1]
                    h = ishape[2]
                    w = ishape[3]
                    c = ishape[4]
                    if isinstance(w, int) and isinstance(h, int) and w > 0 and h > 0:
                        input_size = (w, h)
                    logger.info(f"Model appears to be a 3D CNN/Video model expecting {seq_length} frames of size {input_size} with {c} channels")
                
                # Check for 4D input (Batch, Height, Width, Channels)
                elif len(ishape) == 4:
                    h = ishape[1]
                    w = ishape[2]
                    if isinstance(w, int) and isinstance(h, int) and w > 0 and h > 0:
                        input_size = (w, h)
                    logger.info(f"Model appears to be a 2D CNN/Image model expecting size {input_size}")
                    
        except Exception as e:
            logger.warning(f"Failed to determine model input shape automatically: {e}")
        
        predictions = []
        
        # If it's a video model, we need to buffer frames
        if is_video_model:
            # Collect frames
            frames_buffer = []
            
            # Read all needed frames
            # Strategy: evenly sample 'seq_length' frames from the video
            # If video has fewer frames, duplicate
            
            # Read all frames into memory (be careful with long videos, but here we assume short clips)
            # If video is long, just read what we need
            
            # Better strategy: Read frames with a stride
            total_frames_to_read = seq_length
            stride = max(1, frame_count // total_frames_to_read)
            
            current_frame = 0
            prev_rgb = None
            while len(frames_buffer) < seq_length and current_frame < frame_count:
                cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
                ret, frame = cap.read()
                if ret:
                    p_frame = preprocess_frame(frame, input_size)
                    if prev_rgb is None:
                        diff = np.zeros_like(p_frame)
                    else:
                        diff = np.abs(p_frame - prev_rgb)
                    combined = np.concatenate([p_frame, diff], axis=-1)
                    frames_buffer.append(combined)
                    prev_rgb = p_frame
                current_frame += stride
            
            # Pad if not enough frames
            while len(frames_buffer) < seq_length:
                if frames_buffer:
                    frames_buffer.append(frames_buffer[-1]) # Duplicate last frame
                else:
                    # Video empty? Should have been caught.
                    break
            
            if len(frames_buffer) == seq_length:
                try:
                    batch_input = np.array(frames_buffer)
                    
                    batch_input = np.expand_dims(batch_input, axis=0)
                    
                    if batch_input.shape[-1] != _model.input_shape[-1]:
                        raise ValueError(f"Channel mismatch: built {batch_input.shape[-1]} vs model {_model.input_shape[-1]}")
                    
                    logger.info(f"Running inference with shape: {batch_input.shape}")
                    pred = _model.predict(batch_input, verbose=0)
                    
                    # Process prediction
                    arr = np.array(pred)
                    flat = arr.flatten()
                    
                    if flat.size >= 2 and np.all((flat >= 0.0) & (flat <= 1.0)) and abs(np.sum(flat[:2]) - 1.0) < 1e-3:
                         val = float(flat[1])
                    else:
                         val = float(flat[0])
                         if val < 0.0 or val > 1.0:
                             val = float(1.0 / (1.0 + np.exp(-val)))
                    
                    predictions.append(val)
                    
                except Exception as e:
                    logger.error(f"Inference failed for video batch: {e}")
                    import traceback
                    traceback.print_exc()

        else:
            # Frame-by-frame processing (existing logic)
            skip_frames = max(1, frame_count // settings.MAX_FRAMES_TO_PROCESS)
            frame_index = 0
            processed_count = 0
            
            while processed_count < settings.MAX_FRAMES_TO_PROCESS:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_index % skip_frames == 0:
                    try:
                        processed_frame = preprocess_frame(frame, input_size)
                        # Add batch dimension: (1, H, W, C)
                        batch_input = np.expand_dims(processed_frame, axis=0)
                        
                        pred = _model.predict(batch_input, verbose=0)
                        
                        arr = np.array(pred)
                        flat = arr.flatten()
                        
                        if flat.size >= 2 and np.all((flat >= 0.0) & (flat <= 1.0)) and abs(np.sum(flat[:2]) - 1.0) < 1e-3:
                            prediction_value = float(flat[1])
                        else:
                            v = float(flat[0])
                            if v < 0.0 or v > 1.0:
                                prediction_value = float(1.0 / (1.0 + np.exp(-v)))
                            else:
                                prediction_value = v
                        predictions.append(prediction_value)
                        processed_count += 1
                        
                    except Exception as e:
                        logger.warning(f"Error processing frame {frame_index}: {e}")
                
                frame_index += 1
        
        # Release video capture
        cap.release()
        
        # Validate we got predictions
        if not predictions:
            logger.warning("No frames could be processed/detected from the video.")
            # Default to REAL if no predictions (conservative approach)
            return {
                "label": "REAL",
                "score": 0.0,
                "probability": 0.0,
                "classification": "REAL",
                "message": "No detectable face or valid frames found in the video. Defaulting to REAL."
            }
        
        logger.info(f"Processed frames, got {len(predictions)} predictions")
        
        # Aggregation
        avg_confidence = np.mean(predictions)
        score = float(avg_confidence)
        
        # Thresholding - only REAL or FAKE, no uncertainty
        if score > settings.FAKE_THRESHOLD:
            label = "FAKE"
            message = "The video is likely manipulated."
        else:
            label = "REAL"
            message = "The video appears authentic."
            
        logger.info(f"Prediction: {label} (score: {score:.4f})")
        
        return {
            "label": label,
            "score": score,
            "probability": score,
            "classification": label,
            "message": message
        }
        
    except Exception as e:
        cap.release()
        raise ValueError(f"Error processing video: {str(e)}")
