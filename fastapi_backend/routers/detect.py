from fastapi import APIRouter, UploadFile, File, HTTPException, status, Request
from fastapi_backend.services import model_service
from fastapi_backend.services.auth_service import AuthService
import shutil
import os
import uuid
from pydantic import BaseModel
from typing import Literal
import datetime
from fastapi_backend.database import predictions_col, challenge_videos_col, community_votes_col
import json
import urllib.request
from pydantic import BaseModel
import random
from fastapi_backend.core.config import settings
from fastapi import Form

router = APIRouter()

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
        "user_email": user_email,
        "filename": video.filename or "unknown",
        "result": analysis_data.get("label", "UNKNOWN"),
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
            "user_email": user_email,
            "filename": file.filename or "unknown",
            "result": result["label"],  # Changed from "label" to "result" to match history API
            "confidence": result["score"],  # Changed from "score" to "confidence" to match history API
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

@router.post("/videos/upload")
async def save_video(file: UploadFile = File(None), video: UploadFile = File(None)):
    selected = file or video
    if selected is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")
    allowed_exts = {".mp4", ".avi", ".mov", ".webm"}
    ct = (selected.content_type or "").lower()
    fname = (selected.filename or "")
    ext = os.path.splitext(fname)[1].lower()
    if not (ct.startswith("video/") or ext in allowed_exts):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported video format")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_uploads = os.path.abspath(os.path.join(base_dir, "..", "public", "uploads"))
    os.makedirs(public_uploads, exist_ok=True)
    chosen_ext = ext if ext in allowed_exts else ".mp4"
    unique_name = f"{uuid.uuid4()}{chosen_ext}"
    out_path = os.path.join(public_uploads, unique_name)
    try:
        with open(out_path, "wb") as f:
            shutil.copyfileobj(selected.file, f)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save: {e}")
    data_dir = os.path.abspath(os.path.join(base_dir, "..", "data"))
    os.makedirs(data_dir, exist_ok=True)
    db_path = os.path.join(data_dir, "videos.json")
    try:
        existing = []
        if os.path.exists(db_path):
            with open(db_path, "r", encoding="utf-8") as rf:
                existing = json.load(rf) or []
        entry = {"filename": unique_name, "url": f"http://localhost:3000/uploads/{unique_name}", "created_at": datetime.datetime.utcnow().isoformat()}
        existing.insert(0, entry)
        with open(db_path, "w", encoding="utf-8") as wf:
            json.dump(existing[:200], wf)
    except Exception:
        pass
    return {"filename": unique_name, "url": f"http://localhost:3000/uploads/{unique_name}"}

@router.get("/videos/list")
async def list_videos():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_uploads = os.path.abspath(os.path.join(base_dir, "..", "public", "uploads"))
    try:
        files = []
        if os.path.isdir(public_uploads):
            for x in os.listdir(public_uploads):
                p = os.path.join(public_uploads, x)
                if os.path.isfile(p) and os.path.splitext(x)[1].lower() in {".mp4", ".webm", ".mov", ".avi"}:
                    files.append(f"http://localhost:3000/uploads/{x}")
        return files
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

class ImportRequest(BaseModel):
    url: str

@router.post("/videos/import-url")
async def import_video_from_url(req: ImportRequest):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_uploads = os.path.abspath(os.path.join(base_dir, "..", "public", "uploads"))
    os.makedirs(public_uploads, exist_ok=True)
    try:
        with urllib.request.urlopen(req.url) as resp:
            data = resp.read()
            ct = resp.info().get_content_type().lower()
            ext = ".mp4"
            if "webm" in ct:
                ext = ".webm"
            elif "quicktime" in ct or "mov" in ct:
                ext = ".mov"
            elif "x-msvideo" in ct or "avi" in ct:
                ext = ".avi"
            fname = f"{uuid.uuid4()}{ext}"
            out_path = os.path.join(public_uploads, fname)
            with open(out_path, "wb") as f:
                f.write(data)
        data_dir = os.path.abspath(os.path.join(base_dir, "..", "data"))
        os.makedirs(data_dir, exist_ok=True)
        db_path = os.path.join(data_dir, "videos.json")
        try:
            existing = []
            if os.path.exists(db_path):
                with open(db_path, "r", encoding="utf-8") as rf:
                    existing = json.load(rf) or []
            entry = {"filename": fname, "url": f"http://localhost:3000/uploads/{fname}", "source": req.url, "created_at": datetime.datetime.utcnow().isoformat()}
            existing.insert(0, entry)
            with open(db_path, "w", encoding="utf-8") as wf:
                json.dump(existing[:200], wf)
        except Exception:
            pass
        return {"filename": fname, "url": f"http://localhost:3000/uploads/{fname}"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

class ImportDirRequest(BaseModel):
    dir: str | None = None
    limit: int | None = None
    recursive: bool | None = True

@router.post("/videos/import-dir")
async def import_videos_from_dir(req: ImportDirRequest):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_uploads = os.path.abspath(os.path.join(base_dir, "..", "public", "uploads"))
    os.makedirs(public_uploads, exist_ok=True)
    dataset_dir = req.dir or os.path.abspath(os.path.join(base_dir, "..", "dataset_videos"))
    if not os.path.isdir(dataset_dir):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset directory not found")
    exts = {".mp4", ".webm", ".mov", ".avi"}
    paths = []
    if req.recursive:
        for root, _, files in os.walk(dataset_dir):
            for f in files:
                if os.path.splitext(f)[1].lower() in exts:
                    paths.append(os.path.join(root, f))
    else:
        for f in os.listdir(dataset_dir):
            p = os.path.join(dataset_dir, f)
            if os.path.isfile(p) and os.path.splitext(f)[1].lower() in exts:
                paths.append(p)
    if not paths:
        return {"imported": [], "count": 0}
    if isinstance(req.limit, int) and req.limit > 0:
        paths = paths[:req.limit]
    imported = []
    for src in paths:
        try:
            ext = os.path.splitext(src)[1].lower() or ".mp4"
            fname = f"{uuid.uuid4()}{ext}"
            dst = os.path.join(public_uploads, fname)
            shutil.copyfile(src, dst)
            imported.append(f"http://localhost:3000/uploads/{fname}")
        except Exception:
            pass
    return {"imported": imported, "count": len(imported)}

@router.post("/model/upload")
async def upload_model(file: UploadFile = File(...)):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.abspath(os.path.join(base_dir, "models"))
    os.makedirs(models_dir, exist_ok=True)
    allowed_exts = {".keras", ".h5"}
    fname = (file.filename or "")
    ext = os.path.splitext(fname)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Model must be .keras or .h5")
    unique_name = f"{uuid.uuid4()}{ext}"
    out_path = os.path.join(models_dir, unique_name)
    try:
        with open(out_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        model_service.set_model_path(out_path)
        return {"message": "Model uploaded and reloaded", "path": out_path}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to upload/reload: {e}")

class ReloadModelRequest(BaseModel):
    path: str

@router.post("/model/reload")
async def reload_model(req: ReloadModelRequest):
    try:
        model_service.set_model_path(req.path)
        return {"message": "Model reloaded", "path": req.path}
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model file not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/videos/seed-ambiguous")
async def seed_ambiguous_videos():
    curated = [
        "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
        "https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4",
        "https://sample-videos.com/video321/mp4/720/sample_960x540.mp4",
        "https://sample-videos.com/video321/mp4/720/sample_1280x720.mp4",
        "https://sample-videos.com/video321/webm/720/big_buck_bunny_720p_1mb.webm",
        "https://sample-videos.com/video321/webm/480/big_buck_bunny_480p_1mb.webm",
        "https://sample-videos.com/video321/webm/240/big_buck_bunny_240p_1mb.webm",
        "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
        "https://filesamples.com/samples/video/mp4/sample_960x400.mp4",
        "https://filesamples.com/samples/video/mp4/sample_1280x720.mp4",
        "https://sample-videos.com/video321/mp4/720/sample_1280x720.mp4",
        "https://sample-videos.com/video321/mp4/480/sample_640x360.mp4",
        "https://sample-videos.com/video321/mp4/240/sample_320x240.mp4",
        "https://sample-videos.com/video321/webm/720/sample_1280x720.webm",
        "https://sample-videos.com/video321/webm/480/sample_640x360.webm",
        "https://sample-videos.com/video321/avi/720/sample_1280x720.avi",
        "https://filesamples.com/samples/video/mp4/sample_960x540.mp4",
        "https://filesamples.com/samples/video/mp4/sample_1920x1080.mp4",
        "https://filesamples.com/samples/video/webm/sample_640x360.webm",
        "https://filesamples.com/samples/video/avi/sample_640x360.avi",
    ]
    saved = []
    for u in curated:
        try:
            res = await import_video_from_url(ImportRequest(url=u))
            saved.append(res["url"])
        except Exception:
            pass
    # Ensure we have at least 10 by duplicating existing files if imports failed
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_uploads = os.path.abspath(os.path.join(base_dir, "..", "public", "uploads"))
    os.makedirs(public_uploads, exist_ok=True)
    try:
        # Count current files
        current_files = []
        for x in os.listdir(public_uploads):
            p = os.path.join(public_uploads, x)
            if os.path.isfile(p) and os.path.splitext(x)[1].lower() in {".mp4", ".webm", ".mov", ".avi"}:
                current_files.append(x)
        # Duplicate until at least 10 exist
        import random
        while len(current_files) < 10 and current_files:
            src = os.path.join(public_uploads, random.choice(current_files))
            ext = os.path.splitext(src)[1].lower() or ".mp4"
            new_name = f"{uuid.uuid4()}{ext}"
            dst = os.path.join(public_uploads, new_name)
            shutil.copyfile(src, dst)
            current_files.append(new_name)
            saved.append(f"http://localhost:3000/uploads/{new_name}")
            # also record in data/videos.json
            data_dir = os.path.abspath(os.path.join(base_dir, "..", "data"))
            os.makedirs(data_dir, exist_ok=True)
            db_path = os.path.join(data_dir, "videos.json")
            try:
                existing = []
                if os.path.exists(db_path):
                    with open(db_path, "r", encoding="utf-8") as rf:
                        existing = json.load(rf) or []
                entry = {"filename": new_name, "url": f"http://localhost:3000/uploads/{new_name}", "source": "duplicate", "created_at": datetime.datetime.utcnow().isoformat()}
                existing.insert(0, entry)
                with open(db_path, "w", encoding="utf-8") as wf:
                    json.dump(existing[:200], wf)
            except Exception:
                pass
    except Exception:
        pass
    return {"imported": saved}

class VoteRequest(BaseModel):
    video_url: str
    vote: Literal["REAL", "FAKE"]

@router.post("/community/vote")
async def community_vote(request: Request, payload: VoteRequest):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_uploads = os.path.abspath(os.path.join(base_dir, "..", "public", "uploads"))
    if "/uploads/" not in payload.video_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid video URL")
    filename = payload.video_url.split("/uploads/")[-1]
    file_path = os.path.join(public_uploads, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    uid = request.headers.get("X-User-Id") or request.headers.get("X-User-Email") or "anonymous"
    data_dir = os.path.abspath(os.path.join(base_dir, "..", "data"))
    os.makedirs(data_dir, exist_ok=True)
    votes_path = os.path.join(data_dir, "community_votes.json")
    existing = []
    if os.path.exists(votes_path):
        try:
            with open(votes_path, "r", encoding="utf-8") as rf:
                existing = json.load(rf) or []
        except Exception:
            existing = []
    for v in existing:
        if v.get("user_id") == uid and v.get("filename") == filename:
            return {"duplicate": True, "user_id": uid, "filename": filename}
    try:
        result = model_service.predict_video(file_path)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    correct = payload.vote == result.get("label")
    rec = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "filename": filename,
        "video_url": payload.video_url,
        "user_vote": payload.vote,
        "model_label": result.get("label"),
        "model_score": result.get("score"),
        "correct": bool(correct),
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    existing.append(rec)
    try:
        with open(votes_path, "w", encoding="utf-8") as wf:
            json.dump(existing, wf)
    except Exception:
        pass
    return {"correct": bool(correct), "model_label": result.get("label"), "model_score": result.get("score")}

@router.get("/community/user-score")
async def community_user_score(request: Request):
    uid = request.headers.get("X-User-Id") or request.headers.get("X-User-Email") or "anonymous"
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.abspath(os.path.join(base_dir, "..", "data"))
    votes_path = os.path.join(data_dir, "community_votes.json")
    total = 0
    correct = 0
    if os.path.exists(votes_path):
        try:
            with open(votes_path, "r", encoding="utf-8") as rf:
                arr = json.load(rf) or []
                for v in arr:
                    if v.get("user_id") == uid:
                        total += 1
                        if v.get("correct"):
                            correct += 1
        except Exception:
            pass
    return {"user_id": uid, "attempts": total, "correct": correct}

# =========================
# Community Challenge (Human vs AI)
# =========================

class ChallengeVideo(BaseModel):
    id: str
    video_url: str
    true_label: Literal["REAL", "FAKE"]
    ai_verdict: Literal["REAL", "FAKE"]
    ai_confidence: float
    difficulty: str | None = None
    stats: dict | None = None

class NextChallengeResponse(BaseModel):
    video_id: str
    video_url: str
    ai_verdict: Literal["REAL", "FAKE"]
    ai_confidence: float
    community_accuracy: float
    total_guesses: int

class SubmitGuessRequest(BaseModel):
    video_id: str
    user_guess: Literal["REAL", "FAKE"]

class SubmitGuessResponse(BaseModel):
    correct: bool
    true_label: Literal["REAL", "FAKE"]
    ai_verdict: Literal["REAL", "FAKE"]
    ai_confidence: float
    community_accuracy: float
    total_guesses: int

@router.post("/community/seed-challenges")
async def seed_challenges():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_uploads = os.path.abspath(os.path.join(base_dir, "..", "public", "uploads"))
    os.makedirs(public_uploads, exist_ok=True)
    created = 0
    try:
        files = []
        for x in os.listdir(public_uploads):
            p = os.path.join(public_uploads, x)
            if os.path.isfile(p) and os.path.splitext(x)[1].lower() in {".mp4", ".webm", ".mov", ".avi"}:
                files.append((x, p))
        for fname, path in files:
            existing = None
            try:
                existing = challenge_videos_col.find_one({"video_url": f"http://localhost:3000/uploads/{fname}"})
            except Exception:
                existing = None
            if existing:
                continue
            try:
                res = model_service.predict_video(path)
                ai_verdict = res.get("label", "REAL")
                ai_conf = float(res.get("score", 0.0))
            except Exception:
                ai_verdict = "REAL"
                ai_conf = 0.0
            doc = {
                "_id": str(uuid.uuid4()),
                "video_url": f"http://localhost:3000/uploads/{fname}",
                "true_label": ai_verdict,  # default to AI verdict until curated truth is provided
                "ai_verdict": ai_verdict,
                "ai_confidence": ai_conf,
                "difficulty": None,
                "stats": {"total_guesses": 0, "human_correct": 0, "human_incorrect": 0},
                "created_at": datetime.datetime.utcnow(),
            }
            try:
                challenge_videos_col.insert_one(doc)
                created += 1
            except Exception:
                pass
        return {"seeded": created}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/community/next-challenge", response_model=NextChallengeResponse)
async def get_next_challenge(request: Request):
    uid = request.headers.get("X-User-Id") or request.headers.get("X-User-Email") or "anonymous"
    # Collect already voted video_ids
    voted_ids = set()
    try:
        cursor = community_votes_col.find({"user_id": uid}, {"video_id": 1})
        for v in cursor:
            vid = v.get("video_id")
            if vid:
                voted_ids.add(vid)
    except Exception:
        voted_ids = set()
    # Find a challenge not yet seen
    candidates = []
    try:
        for doc in challenge_videos_col.find({}):
            if doc.get("_id") not in voted_ids:
                candidates.append(doc)
    except Exception:
        candidates = []
    # If none exist, try to seed from uploads
    if not candidates:
        try:
            await seed_challenges()
            for doc in challenge_videos_col.find({}):
                if doc.get("_id") not in voted_ids:
                    candidates.append(doc)
        except Exception:
            pass
    if not candidates:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No challenge videos available")
    doc = random.choice(candidates)
    stats = doc.get("stats") or {"total_guesses": 0, "human_correct": 0}
    total = int(stats.get("total_guesses", 0) or 0)
    correct = int(stats.get("human_correct", 0) or 0)
    accuracy = float(correct / total * 100) if total > 0 else 0.0
    return NextChallengeResponse(
        video_id=str(doc.get("_id")),
        video_url=doc.get("video_url"),
        ai_verdict=doc.get("ai_verdict", "REAL"),
        ai_confidence=float(doc.get("ai_confidence", 0.0)),
        community_accuracy=accuracy,
        total_guesses=total,
    )

@router.post("/community/submit-guess", response_model=SubmitGuessResponse)
async def submit_guess(request: Request, payload: SubmitGuessRequest):
    uid = request.headers.get("X-User-Id") or request.headers.get("X-User-Email") or "anonymous"
    # Load video
    doc = challenge_videos_col.find_one({"_id": payload.video_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge video not found")
    true_label = doc.get("true_label") or doc.get("ai_verdict") or "REAL"
    is_correct = payload.user_guess == true_label
    # Update global stats
    try:
        challenge_videos_col.update_one(
            {"_id": payload.video_id},
            {"$inc": {
                "stats.total_guesses": 1,
                "stats.human_correct": 1 if is_correct else 0,
                "stats.human_incorrect": 0 if is_correct else 1,
            }}
        )
    except Exception:
        pass
    # Save vote
    try:
        community_votes_col.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": uid,
            "video_id": payload.video_id,
            "user_guess": payload.user_guess,
            "is_correct": bool(is_correct),
            "timestamp": datetime.datetime.utcnow(),
        })
    except Exception:
        pass
    # Compute updated stats
    updated = challenge_videos_col.find_one({"_id": payload.video_id}) or doc
    stats = updated.get("stats") or {"total_guesses": 0, "human_correct": 0}
    total = int(stats.get("total_guesses", 0) or 0)
    correct = int(stats.get("human_correct", 0) or 0)
    accuracy = float(correct / total * 100) if total > 0 else 0.0
    return SubmitGuessResponse(
        correct=bool(is_correct),
        true_label=true_label,
        ai_verdict=updated.get("ai_verdict", "REAL"),
        ai_confidence=float(updated.get("ai_confidence", 0.0)),
        community_accuracy=accuracy,
        total_guesses=total,
    )
