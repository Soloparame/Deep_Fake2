from fastapi import APIRouter, Request, HTTPException
from fastapi_backend.core.config import settings
import os
import uuid
import random

router = APIRouter()

@router.get("/community/videos")
async def get_videos(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    base_dir = os.path.join(settings.BASE_DIR, "testvideo")
    real_dir = os.path.join(base_dir, "Real")
    fake_dir = os.path.join(base_dir, "fake")
    items = []
    for fname in os.listdir(real_dir):
        f = fname.lower()
        if f.endswith((".mp4", ".mov", ".avi", ".webm")):
            items.append({"id": str(uuid.uuid4()), "url": f"/static/testvideo/Real/{fname}", "label": "REAL"})
    for fname in os.listdir(fake_dir):
        f = fname.lower()
        if f.endswith((".mp4", ".mov", ".avi", ".webm")):
            items.append({"id": str(uuid.uuid4()), "url": f"/static/testvideo/fake/{fname}", "label": "FAKE"})
    random.shuffle(items)
    return items
