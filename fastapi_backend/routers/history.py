from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi_backend.database import predictions_col

router = APIRouter()

class PredictionHistoryItem(BaseModel):
    """Single prediction record"""
    id: str
    user_email: Optional[str] = None
    filename: str
    result: str  # "REAL" or "FAKE"
    confidence: float
    message: str
    created_at: datetime

class PredictionHistoryResponse(BaseModel):
    """Response containing list of predictions"""
    predictions: List[PredictionHistoryItem]
    total: int

@router.get("/predictions", response_model=PredictionHistoryResponse)
async def get_predictions(
    user_email: Optional[str] = Query(None, description="Filter by user email"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
    result: Optional[str] = Query(None, description="Filter by result: REAL or FAKE")
):
    """
    Get prediction history.
    
    **Query Parameters:**
    - `user_email`: Filter predictions by user email (optional)
    - `limit`: Maximum number of results (1-100, default: 50)
    - `skip`: Number of results to skip for pagination (default: 0)
    - `result`: Filter by result type - "REAL" or "FAKE" (optional)
    
    **Response:**
    ```json
    {
        "predictions": [
            {
                "id": "uuid",
                "user_email": "user@example.com",
                "filename": "video.mp4",
                "result": "FAKE",
                "confidence": 95.5,
                "message": "The video is likely manipulated.",
                "created_at": "2024-01-01T12:00:00"
            }
        ],
        "total": 1
    }
    ```
    """
    try:
        # Build query
        query = {}
        if user_email:
            query["user_email"] = user_email
        if result:
            query["result"] = result.upper()
        
        # Get predictions (sorted by created_at descending)
        predictions = list(predictions_col.find(
            query,
            sort=[("created_at", -1)],
            limit=limit + skip
        ))
        
        # Apply skip for pagination
        predictions = predictions[skip:skip + limit]
        
        # Convert to response format
        prediction_items = []
        for pred in predictions:
            # Handle ObjectId if present
            pred_id = pred.get("_id")
            if hasattr(pred_id, "__str__"):
                pred_id = str(pred_id)
            elif not pred_id:
                pred_id = pred.get("id", str(pred.get("_id", "")))
            
            prediction_items.append(PredictionHistoryItem(
                id=pred_id,
                user_email=pred.get("user_email"),
                filename=pred.get("filename", "unknown"),
                result=pred.get("result", "UNKNOWN"),
                confidence=pred.get("confidence", 0.0),
                message=pred.get("message", ""),
                created_at=pred.get("created_at", datetime.utcnow())
            ))
        
        # Get total count
        total = len(list(predictions_col.find(query)))
        
        return PredictionHistoryResponse(
            predictions=prediction_items,
            total=total
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve predictions: {str(e)}"
        )

@router.get("/predictions/{prediction_id}", response_model=PredictionHistoryItem)
async def get_prediction_by_id(prediction_id: str):
    """
    Get a single prediction by ID.
    
    **Response:**
    ```json
    {
        "id": "uuid",
        "user_email": "user@example.com",
        "filename": "video.mp4",
        "result": "FAKE",
        "confidence": 95.5,
        "message": "The video is likely manipulated.",
        "created_at": "2024-01-01T12:00:00"
    }
    ```
    """
    try:
        # Try to find by id field first
        pred = predictions_col.find_one({"id": prediction_id})
        
        # If not found, try _id (for MongoDB ObjectId)
        if not pred:
            try:
                from bson import ObjectId
                pred = predictions_col.find_one({"_id": ObjectId(prediction_id)})
            except:
                pass
        
        if not pred:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prediction with ID {prediction_id} not found"
            )
        
        # Convert to response format
        pred_id = pred.get("_id")
        if hasattr(pred_id, "__str__"):
            pred_id = str(pred_id)
        elif not pred_id:
            pred_id = pred.get("id", "")
        
        return PredictionHistoryItem(
            id=pred_id,
            user_email=pred.get("user_email"),
            filename=pred.get("filename", "unknown"),
            result=pred.get("result", "UNKNOWN"),
            confidence=pred.get("confidence", 0.0),
            message=pred.get("message", ""),
            created_at=pred.get("created_at", datetime.utcnow())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve prediction: {str(e)}"
        )

@router.delete("/predictions/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prediction(prediction_id: str):
    """
    Delete a prediction by ID.
    
    Returns 204 No Content on success.
    """
    try:
        # Try to delete by id field first
        result = predictions_col.delete_one({"id": prediction_id})
        
        # If not found, try _id (for MongoDB ObjectId)
        if result.deleted_count == 0:
            try:
                from bson import ObjectId
                result = predictions_col.delete_one({"_id": ObjectId(prediction_id)})
            except:
                pass
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prediction with ID {prediction_id} not found"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete prediction: {str(e)}"
        )

@router.get("/predictions/stats/summary")
async def get_prediction_stats(user_email: Optional[str] = Query(None)):
    """
    Get prediction statistics.
    
    **Query Parameters:**
    - `user_email`: Filter stats by user email (optional)
    
    **Response:**
    ```json
    {
        "total": 100,
        "real_count": 60,
        "fake_count": 40,
        "average_confidence": 87.5
    }
    ```
    """
    try:
        query = {}
        if user_email:
            query["user_email"] = user_email
        
        predictions = list(predictions_col.find(query))
        
        total = len(predictions)
        real_count = sum(1 for p in predictions if p.get("result") == "REAL")
        fake_count = sum(1 for p in predictions if p.get("result") == "FAKE")
        
        confidences = [p.get("confidence", 0.0) for p in predictions if p.get("confidence")]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return {
            "total": total,
            "real_count": real_count,
            "fake_count": fake_count,
            "average_confidence": round(avg_confidence, 2)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve stats: {str(e)}"
        )

