from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi_backend.services import model_service
import shutil
import os
import uuid
from pydantic import BaseModel

router = APIRouter()

class DetectionResponse(BaseModel):
    result: str
    confidence: float
    frames_analyzed: int

@router.post("/detect-video", response_model=DetectionResponse)
async def detect_video(file: UploadFile = File(...)):
    """
    Upload a video file to detect deepfakes.
    """
    # Validate file type
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    # Save temp file
    temp_filename = f"temp_{uuid.uuid4()}.mp4"
    temp_path = os.path.join("temp_uploads", temp_filename)
    
    os.makedirs("temp_uploads", exist_ok=True)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run inference
        result = model_service.predict_video(temp_path)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
