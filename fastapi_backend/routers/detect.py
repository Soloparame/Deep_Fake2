from fastapi import APIRouter, UploadFile, File, HTTPException, status, Request
from fastapi_backend.services import model_service
import shutil
import os
import uuid
from pydantic import BaseModel
from typing import Literal
import datetime
from fastapi_backend.database import predictions_col

router = APIRouter()

class DetectionResponse(BaseModel):
    """
    Response model for video detection endpoint.
    Returns label (REAL/FAKE) and score (0-1).
    """
    label: Literal["REAL", "FAKE", "UNKNOWN"]
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
        user_email = request.headers.get("X-User-Email")
        record = {
            "id": str(uuid.uuid4()),
            "user_email": user_email,
            "filename": file.filename,
            "label": result["label"],
            "score": result["score"],
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
