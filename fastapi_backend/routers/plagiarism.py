from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Form
from typing import Optional, Dict, Any
from fastapi_backend.services.plagiarism_service import plagiarism_service
from fastapi_backend.utils.document_text import extract_text_from_upload
from fastapi_backend.services.auth_service import AuthService

router = APIRouter()

def _user_from_request(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        return None
    try:
        return AuthService.get_current_user_profile(token)
    except Exception:
        return None

@router.post("/check")
async def check_plagiarism(
    request: Request,
    title: str = Form(...),
    file: Optional[UploadFile] = File(None),
    pasted_content: str = Form(None)
):
    """
    Checks for plagiarism against local BDU corpus and online sources.
    """
    print(f"Received plagiarism check request: {title}")
    user = _user_from_request(request)
    if not user:
        print("Unauthorized request to plagiarism check")
        raise HTTPException(
            status_code=401, 
            detail="Sign in to run plagiarism checks and save them to your account."
        )

    extracted_text = ""
    if file and file.filename:
        print(f"Processing uploaded file: {file.filename}")
        raw = await file.read()
        try:
            extracted_text, _ = extract_text_from_upload(file.filename, raw)
            print(f"Extracted {len(extracted_text)} characters from file")
        except Exception as e:
            print(f"Error extracting text: {e}")
            raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    if not extracted_text and pasted_content:
        print("Using pasted content")
        extracted_text = pasted_content

    if not extracted_text:
        print("No content provided")
        raise HTTPException(status_code=400, detail="No content provided to check")

    # Run the plagiarism check
    try:
        print("Running full check...")
        results = await plagiarism_service.run_full_check(extracted_text)
        print("Check complete")
        
        return {
            "id": "analysis_" + str(hash(title)),
            "title": title,
            "results": results
        }
    except Exception as e:
        print(f"Error during plagiarism check: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
