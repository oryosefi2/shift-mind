# API endpoints לתחזיות ביקוש
"""
Forecast Routes Module

API endpoints לניהול תחזיות ביקוש.
מספק ממשקים ליצירה, הצגה ומחיקה של תחזיות.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, Optional, List
from datetime import datetime
import re
from pydantic import BaseModel

from services.forecast_client import forecast_client
# from dependencies import get_business_id  # TODO: יצירת dependencies

router = APIRouter()

class ForecastGenerateRequest(BaseModel):
    lookback_weeks: Optional[int] = 8

class ForecastResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    error: Optional[Dict] = None

def validate_week_format(week: str) -> bool:
    """בודק פורמט שבוע YYYY-WW"""
    if not re.match(r'^\d{4}-\d{2}$', week):
        return False
    
    try:
        year, week_num = map(int, week.split('-'))
        return 2020 <= year <= 2030 and 1 <= week_num <= 53
    except ValueError:
        return False

@router.post("/{week}/generate")
async def generate_forecast(
    week: str,
    request: ForecastGenerateRequest,
    business_id: str = Query(..., description="Business UUID")
) -> ForecastResponse:
    """
    יוצר תחזית ביקוש לשבוע מסוים
    
    Args:
        week: שבוע בפורמט YYYY-WW (למשל: 2025-43)
        request: פרמטרים נוספים (lookback_weeks)
        business_id: מזהה עסק (מה-token)
        
    Returns:
        ForecastResponse עם תוצאות התחזית או שגיאה
        
    Example:
        POST /forecast/2025-43/generate?business_id=uuid
        {
            "lookback_weeks": 8
        }
    """
    
    # בדיקת פורמט שבוע
    if not validate_week_format(week):
        raise HTTPException(
            status_code=400,
            detail=f"פורמט שבוע לא תקין: '{week}'. נדרש פורמט YYYY-WW (למשל: 2025-43)"
        )
    
    # בדיקת בריאות שירות AI
    if not await forecast_client.check_health():
        raise HTTPException(
            status_code=503,
            detail="שירות התחזיות לא זמין כרגע. נסה שוב מאוחר יותר."
        )
    
    # יצירת תחזית
    success, result = await forecast_client.generate_forecast(
        business_id=business_id,
        week=week,
        lookback_weeks=request.lookback_weeks
    )
    
    if success:
        return ForecastResponse(
            success=True,
            data={
                "message": f"תחזית נוצרה בהצלחה לשבוע {week}",
                "forecast_summary": {
                    "business_id": result.get("business_id"),
                    "target_week": result.get("target_week"),
                    "cache_key": result.get("cache_key"),
                    "total_forecasts": result.get("total_forecasts"),
                    "average_confidence": result.get("average_confidence"),
                    "summary": result.get("summary"),
                    "created_at": result.get("created_at")
                }
            }
        )
    else:
        # טיפול בסוגי שגיאות שונים
        error_type = result.get("error", "unknown")
        
        if error_type == "invalid_input":
            raise HTTPException(status_code=400, detail=result.get("message"))
        elif error_type in ["timeout", "connection_failed"]:
            raise HTTPException(status_code=503, detail=result.get("message"))
        elif error_type == "internal_error":
            raise HTTPException(status_code=502, detail=result.get("message"))
        else:
            raise HTTPException(status_code=500, detail=result.get("message"))

@router.get("/{week}/details")
async def get_forecast_details(
    week: str,
    business_id: str = Query(..., description="Business UUID"),
    cache_key: Optional[str] = Query(None, description="מפתח cache ספציפי")
) -> ForecastResponse:
    """
    מחזיר פירוט מלא של תחזית לשבוע
    
    Args:
        week: שבוע בפורמט YYYY-WW
        business_id: מזהה עסק
        cache_key: מפתח cache (אופציונלי, יחושב אוטומטית)
        
    Returns:
        ForecastResponse עם פירוט התחזית
    """
    
    if not validate_week_format(week):
        raise HTTPException(
            status_code=400,
            detail=f"פורמט שבוע לא תקין: '{week}'"
        )
    
    # יצירת cache_key אם לא סופק
    if not cache_key:
        # בהנחה של lookback_weeks = 8 (ברירת מחדל)
        cache_key = f"forecast_{business_id}_{week}_lb8"
    
    success, result = await forecast_client.get_forecast_details(
        cache_key=cache_key,
        business_id=business_id
    )
    
    if success:
        return ForecastResponse(
            success=True,
            data={
                "message": f"פירוט תחזית לשבוע {week}",
                "forecast_details": result
            }
        )
    else:
        error_type = result.get("error", "unknown")
        
        if error_type == "not_found":
            raise HTTPException(
                status_code=404,
                detail=f"לא נמצאה תחזית לשבוע {week}. ייתכן שצריך ליצור תחזית חדשה."
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message"))

@router.delete("/{week}")
async def delete_forecast(
    week: str,
    business_id: str = Query(..., description="Business UUID"),
    cache_key: Optional[str] = Query(None, description="מפתח cache ספציפי")
) -> ForecastResponse:
    """
    מוחק תחזית לשבוע מסוים
    
    Args:
        week: שבוע בפורמט YYYY-WW
        business_id: מזהה עסק
        cache_key: מפתח cache (אופציונלי)
        
    Returns:
        ForecastResponse עם אישור מחיקה
    """
    
    if not validate_week_format(week):
        raise HTTPException(
            status_code=400,
            detail=f"פורמט שבוע לא תקין: '{week}'"
        )
    
    # יצירת cache_key אם לא סופק
    if not cache_key:
        cache_key = f"forecast_{business_id}_{week}_lb8"
    
    success, result = await forecast_client.delete_forecast_cache(
        cache_key=cache_key,
        business_id=business_id
    )
    
    if success:
        return ForecastResponse(
            success=True,
            data={
                "message": f"תחזית נמחקה בהצלחה לשבוע {week}",
                "details": result
            }
        )
    else:
        error_type = result.get("error", "unknown")
        
        if error_type == "not_found":
            raise HTTPException(
                status_code=404,
                detail=f"לא נמצאה תחזית למחיקה לשבוע {week}"
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message"))

@router.get("/health")
async def check_forecast_service():
    """בודק מצב שירות התחזיות"""
    
    if await forecast_client.check_health():
        return {
            "status": "healthy",
            "service": "forecast",
            "message": "שירות התחזיות פעיל ותקין"
        }
    else:
        raise HTTPException(
            status_code=503,
            detail="שירות התחזיות לא זמין"
        )
