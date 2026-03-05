from fastapi import APIRouter, UploadFile, File, HTTPException, status, Request
from fastapi_backend.services import model_service
from fastapi_backend.services.auth_service import AuthService
from fastapi_backend.core.config import settings
import shutil
import os
import uuid
import requests
from pydantic import BaseModel
from typing import Literal
import datetime
from fastapi_backend.database import predictions_col

router = APIRouter()

# Hugging Face Inference API for image detection
@router.post("/videos/upload")
async def save_video_prediction(request: Request, video: UploadFile = File(...), analysis: str = None):
    """
    Save a video prediction result to history.
    This endpoint is used by the frontend after client-side analysis.
    """
    import json
    
    # Extract user email from token
    user_email = None
    try:
        token = request.headers.get("Authorization")
        if token:
            profile = AuthService.get_current_user_profile(token)
            user_email = profile.get("email")
    except:
        pass
    
    # Parse analysis data if provided
    analysis_data = {}
    if analysis:
        try:
            analysis_data = json.loads(analysis)
        except:
            pass
    
    # Create prediction record
    record = {
        "id": str(uuid.uuid4()),
        "type": "video",
        "user_email": user_email,
        "filename": video.filename or "unknown",
        "result": analysis_data.get("label", "REAL"),  # Default to REAL if not provided
        "confidence": analysis_data.get("confidence", 0.0),
        "message": analysis_data.get("message", ""),
        "created_at": datetime.datetime.utcnow(),
    }
    
    try:
        if predictions_col:
            predictions_col.insert_one(record)
            return {"message": "Prediction saved successfully", "id": record["id"]}
        else:
            return {"message": "MongoDB not connected, prediction not saved"}
    except Exception as e:
        print(f"Failed to save prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save prediction: {str(e)}")


@router.post("/images/upload")
async def detect_image(request: Request, file: UploadFile = File(...)):
    """
    Upload an image to detect AI-generated vs human-captured.
    Uses Hugging Face Ateeqq/ai-vs-human-image-detector model.
    Returns label (REAL/FAKE), score (0-1), and saves to prediction history.
    """
    # Validate file type
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
    fname = (file.filename or "").lower()
    ext = os.path.splitext(fname)[1].lower()
    ct = (file.content_type or "").lower()
    if not (ct.startswith("image/") or ext in allowed_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image. Supported: jpg, png, webp, bmp, gif"
        )

    # Validate size (max 10MB for images)
    image_data = await file.read()
    if not image_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )
    
    MAX_SIZE = 10 * 1024 * 1024
    if len(image_data) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size: 10MB"
        )

    hf_token = (settings.HF_TOKEN or "").strip()
    if not hf_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hugging Face token not configured for Image Doctor. Please add HF_TOKEN to your .env file."
        )

    try:
        # Construct the exact URL that worked in terminal
        model_id = settings.HF_IMAGE_MODEL.strip()
        hf_api_url = f"https://router.huggingface.co/hf-inference/models/{model_id}"
        
        # Use a more stable content type if possible, or fallback to the file's content type
        content_type = file.content_type
        if not content_type or content_type == "application/octet-stream":
            if ext == ".png":
                content_type = "image/png"
            else:
                content_type = "image/jpeg"

        headers = {
            "Authorization": f"Bearer {hf_token}",
            "Content-Type": content_type
        }

        try:
            resp = requests.post(hf_api_url, headers=headers, data=image_data, timeout=60)
            resp.raise_for_status() # This will raise HTTPError for 4xx/5xx
        except requests.exceptions.RequestException as e:
            # Handle model loading separately
            if resp.status_code == 503 or resp.status_code == 422:
                try:
                    err_data = resp.json()
                    if "loading" in str(err_data).lower():
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Model is currently loading on Hugging Face. Please try again in a few seconds."
                        )
                except:
                    pass
            
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE if resp.status_code in {429, 503} else status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to reach Hugging Face API ({type(e).__name__}): {str(e)}"
            )

        # Parse API response (list of {"label":"hum"|"ai","score":0-1})
        if not resp.text or not resp.text.strip():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Hugging Face API returned an empty response"
            )

        try:
            result = resp.json()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Hugging Face API returned non-JSON response: {resp.text[:200]}"
            )

        if not result or not isinstance(result, list):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid response from image detection model"
            )

        # Use API result directly: highest-score class wins. hum -> REAL, ai -> FAKE.
        pred = max(result, key=lambda x: x.get("score", 0))
        label_raw = (pred.get("label") or "").lower()
        score = float(pred.get("score", 0))
        if "ai" in label_raw or label_raw == "ai":
            label = "FAKE"
        else:
            label = "REAL"
        confidence = score

        # Get user email for history
        user_email = None
        try:
            token = request.headers.get("Authorization")
            if token:
                profile = AuthService.get_current_user_profile(token)
                user_email = profile.get("email")
        except Exception:
            pass

        # Save to MongoDB
        record = {
            "id": str(uuid.uuid4()),
            "type": "image",
            "user_email": user_email,
            "filename": file.filename or "unknown",
            "result": label,
            "confidence": confidence,
            "message": f"AI-generated" if label == "FAKE" else "Human-captured",
            "created_at": datetime.datetime.utcnow(),
        }
        if predictions_col:
            try:
                predictions_col.insert_one(record)
            except Exception as e:
                print(f"Failed to save image prediction: {e}")

        return {
            "label": label,
            "score": confidence,
            "confidence": confidence,
            "classification": label,
            "message": record["message"],
        }

    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to reach Hugging Face API ({type(e).__name__}): {str(e)}"
        )
    except Exception as e:
        # Check if it's a model loading error from HF
        err_msg = str(e).lower()
        if "loading" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model is currently loading on Hugging Face. Please try again in a few seconds."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )


class DetectionResponse(BaseModel):
    """
    Response model for video detection endpoint.
    Returns label (REAL/FAKE) and score (0-1).
    """
    label: Literal["REAL", "FAKE"]
    score: float
    probability: float
    classification: str
    message: str

@router.post("/detect-video", response_model=DetectionResponse, status_code=status.HTTP_200_OK)
async def detect_video(request: Request, file: UploadFile = File(...)):
    """
    Upload a video file to detect deepfakes.
    
    **Request:**
    - Content-Type: multipart/form-data
    - Body: video file (mp4, avi, mov, etc.)
    
    **Response:**
    ```json
    {
        "result": "REAL" or "FAKE",
        "confidence": 0.955,
        "message": "The video is likely manipulated."
    }
    ```
    
    **Process:**
    1. Validates video file type
    2. Saves video temporarily
    3. Extracts and processes frames
    4. Runs ML model inference
    5. Aggregates predictions
    6. Returns result with confidence and message
    7. Cleans up temporary files
    """
    # Validate file type (allow by extension if Content-Type is missing)
    allowed_exts = {".mp4", ".avi", ".mov", ".webm"}
    print(f"Incoming upload headers: content_type={file.content_type}, filename={file.filename}")
    ct = (file.content_type or "").lower()
    fname = (file.filename or "")
    ext = os.path.splitext(fname)[1].lower()
    if not (ct.startswith("video/") or ext in allowed_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a video. Supported formats: mp4, avi, mov, webm, etc."
        )
    
    # Validate file size (optional: limit to 100MB)
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )

    # Create temp directory if it doesn't exist
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    # Generate unique temp filename with appropriate extension
    original_ext = os.path.splitext(file.filename or "")[1].lower()
    # Fallback by MIME type if no extension or unknown
    if not original_ext or original_ext not in {".mp4", ".avi", ".mov", ".webm"}:
        ct = (file.content_type or "").lower()
        if "mp4" in ct:
            original_ext = ".mp4"
        elif "webm" in ct:
            original_ext = ".webm"
        elif "quicktime" in ct or "mov" in ct:
            original_ext = ".mov"
        elif "x-msvideo" in ct or "avi" in ct:
            original_ext = ".avi"
        else:
            # Default to mp4 if unknown
            original_ext = ".mp4"
    temp_filename = f"temp_{uuid.uuid4()}{original_ext}"
    temp_path = os.path.join(temp_dir, temp_filename)
    
    try:
        # Save uploaded file temporarily
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run ML inference
        result = model_service.predict_video(temp_path)
        
        # Persist prediction to MongoDB
        user_email = None
        try:
            token = request.headers.get("Authorization")
            if token:
                profile = AuthService.get_current_user_profile(token)
                user_email = profile.get("email")
        except:
            pass  # If auth fails, continue without user_email
        
        record = {
            "id": str(uuid.uuid4()),
            "type": "video",
            "user_email": user_email,
            "filename": file.filename or "unknown",
            "result": result["label"],
            "confidence": result["score"],
            "message": result.get("message", ""),
            "created_at": datetime.datetime.utcnow(),
        }
        try:
            # Print for debugging
            print(f"Attempting to save record to DB: {record}")
            if predictions_col:
                insert_result = predictions_col.insert_one(record)
                print(f"✅ Record saved with ID: {insert_result.inserted_id}")
            else:
                print("⚠️  predictions_col is None, skipping save")
        except Exception as e:
            print(f"❌ Failed to save to MongoDB: {e}")
        
        # Ensure response matches exact format
        return DetectionResponse(
            label=result["label"],
            score=result["score"],
            probability=result.get("probability", result["score"]),
            classification=result.get("classification", result["label"]),
            message=result.get("message", "")
        )
        
    except ValueError as e:
        # Video processing errors (invalid file, can't read, etc.)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid video file: {str(e)}"
        )
    except RuntimeError as e:
        # Model not loaded errors
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML model not available: {str(e)}"
        )
    except Exception as e:
        # Generic server errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
    finally:
        # Always clean up temporary file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as cleanup_error:
                # Log but don't fail the request if cleanup fails
                print(f"Warning: Could not delete temp file {temp_path}: {cleanup_error}")
