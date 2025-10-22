# קליינט לקריאה לשירות AI לתחזיות ביקוש
"""
Forecast Client Module

קליינט לתקשורת עם שירות AI לתחזיות ביקוש.
מספק ממשק נקי לקריאה לשירות וטיפול בשגיאות.
"""

import httpx
import logging
import os
from typing import Dict, Optional, List, Tuple
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class ForecastClient:
    """קליינט לשירות תחזיות AI"""
    
    def __init__(self, ai_service_url: str = None, timeout: int = 30):
        if ai_service_url is None:
            ai_service_url = os.getenv("AI_SERVICE_URL", "http://localhost:8085")
        self.ai_service_url = ai_service_url.rstrip('/')
        self.timeout = timeout
        
    async def generate_forecast(
        self, 
        business_id: str, 
        week: str, 
        lookback_weeks: int = 8
    ) -> Tuple[bool, Dict]:
        """
        יוצר תחזית ביקוש לשבוע מסוים
        
        Args:
            business_id: מזהה עסק
            week: שבוע בפורמט YYYY-WW
            lookback_weeks: מספר שבועות אחורה לחישוב baseline
            
        Returns:
            (success, result): 
            - success: האם הפעולה הצליחה
            - result: תוצאה או שגיאה
        """
        
        url = f"{self.ai_service_url}/forecast/generate"
        payload = {
            "business_id": business_id,
            "week": week,
            "lookback_weeks": lookback_weeks
        }
        
        try:
            logger.info(f"קורא לשירות AI ליצירת תחזית: {business_id}, שבוע {week}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                
            if response.status_code == 200:
                result = response.json()
                logger.info(
                    f"תחזית נוצרה בהצלחה: {result.get('total_forecasts', 0)} רשומות, "
                    f"ביטחון ממוצע: {result.get('average_confidence', 0):.3f}"
                )
                return True, result
                
            elif response.status_code == 400:
                error_detail = response.json().get('detail', 'שגיאת קלט')
                logger.warning(f"שגיאת קלט ביצירת תחזית: {error_detail}")
                return False, {
                    "error": "invalid_input", 
                    "message": f"נתונים לא תקינים: {error_detail}"
                }
                
            elif response.status_code == 500:
                error_detail = response.json().get('detail', 'שגיאה פנימית')
                logger.error(f"שגיאה פנימית בשירות AI: {error_detail}")
                return False, {
                    "error": "internal_error",
                    "message": f"שגיאה בשירות התחזיות: {error_detail}"
                }
                
            else:
                logger.error(f"תגובה לא צפויה מהשירות AI: {response.status_code}")
                return False, {
                    "error": "unexpected_response",
                    "message": f"תגובה לא צפויה: {response.status_code}"
                }
                
        except httpx.TimeoutException:
            logger.error(f"זמן קריאה לשירות AI פג (timeout: {self.timeout}s)")
            return False, {
                "error": "timeout",
                "message": f"זמן הקריאה לשירות התחזיות פג ({self.timeout} שניות)"
            }
            
        except httpx.ConnectError:
            logger.error(f"לא ניתן להתחבר לשירות AI ב-{self.ai_service_url}")
            return False, {
                "error": "connection_failed",
                "message": "לא ניתן להתחבר לשירות התחזיות. בדוק שהשירות רץ."
            }
            
        except Exception as e:
            logger.error(f"שגיאה לא צפויה בקריאה לשירות AI: {e}")
            return False, {
                "error": "unknown_error",
                "message": f"שגיאה לא צפויה: {str(e)}"
            }
    
    async def get_forecast_details(
        self, 
        cache_key: str, 
        business_id: str
    ) -> Tuple[bool, Dict]:
        """
        מביא פירוט תחזית מה-cache
        
        Args:
            cache_key: מפתח cache של התחזית
            business_id: מזהה עסק (לאבטחה)
            
        Returns:
            (success, result): תוצאה או שגיאה
        """
        
        url = f"{self.ai_service_url}/forecast/details/{cache_key}"
        params = {"business_id": business_id}
        
        try:
            logger.info(f"מביא פירוט תחזית: {cache_key}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                
            if response.status_code == 200:
                result = response.json()
                forecast_count = len(result.get('forecasts', []))
                logger.info(f"פירוט תחזית התקבל: {forecast_count} רשומות")
                return True, result
                
            elif response.status_code == 404:
                logger.warning(f"תחזית לא נמצאה או פגה: {cache_key}")
                return False, {
                    "error": "not_found",
                    "message": "תחזית לא נמצאה או פג תוקפה"
                }
                
            else:
                logger.error(f"שגיאה בהבאת פירוט תחזית: {response.status_code}")
                return False, {
                    "error": "fetch_failed",
                    "message": f"לא ניתן להביא פירוט תחזית: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"שגיאה בהבאת פירוט תחזית: {e}")
            return False, {
                "error": "unknown_error",
                "message": f"שגיאה בהבאת פירוט: {str(e)}"
            }
    
    async def delete_forecast_cache(
        self, 
        cache_key: str, 
        business_id: str
    ) -> Tuple[bool, Dict]:
        """
        מוחק תחזית מה-cache
        
        Args:
            cache_key: מפתח cache של התחזית
            business_id: מזהה עסק (לאבטחה)
            
        Returns:
            (success, result): תוצאה או שגיאה
        """
        
        url = f"{self.ai_service_url}/forecast/cache/{cache_key}"
        params = {"business_id": business_id}
        
        try:
            logger.info(f"מוחק תחזית מ-cache: {cache_key}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(url, params=params)
                
            if response.status_code == 200:
                result = response.json()
                logger.info(f"תחזית נמחקה: {result.get('message', 'נמחק')}")
                return True, result
                
            elif response.status_code == 404:
                logger.warning(f"תחזית לא נמצאה למחיקה: {cache_key}")
                return False, {
                    "error": "not_found",
                    "message": "תחזית לא נמצאה"
                }
                
            else:
                logger.error(f"שגיאה במחיקת תחזית: {response.status_code}")
                return False, {
                    "error": "delete_failed",
                    "message": f"לא ניתן למחוק תחזית: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"שגיאה במחיקת תחזית: {e}")
            return False, {
                "error": "unknown_error",
                "message": f"שגיאה במחיקה: {str(e)}"
            }
    
    async def check_health(self) -> bool:
        """בדיקת בריאות שירות AI"""
        
        try:
            url = f"{self.ai_service_url}/health"
            
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(url)
                
            if response.status_code == 200:
                logger.info("שירות AI פעיל ותקין")
                return True
            else:
                logger.warning(f"שירות AI החזיר סטטוס {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"שירות AI לא זמין: {e}")
            return False


# יצירת instance גלובלי
forecast_client = ForecastClient()
