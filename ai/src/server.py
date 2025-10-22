# Copilot: FastAPI endpoint /forecast/generate (validate week)
"""
AI Server Module

FastAPI server for AI forecasting endpoints.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import asyncio

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
import asyncpg

from forecast import DemandForecaster, ForecastInput, HourlyForecast

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ShiftMind AI Service",
    description="AI-powered demand forecasting and optimization",
    version="0.1.0"
)

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "54322")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Global forecaster instance
forecaster: Optional[DemandForecaster] = None


# Pydantic models
class ForecastRequest(BaseModel):
    business_id: str = Field(..., description="Business UUID")
    week: str = Field(..., pattern=r"^\d{4}-\d{2}$", description="Target week in YYYY-WW format")
    lookback_weeks: Optional[int] = Field(8, ge=1, le=52, description="Number of weeks to look back")


class ForecastResponse(BaseModel):
    business_id: str
    target_week: str
    cache_key: str
    total_forecasts: int
    average_confidence: float
    summary: Dict[str, float]
    created_at: str


from typing import Dict, List, Optional, Any, Union
import asyncio

class ForecastDetails(BaseModel):
    forecasts: List[Dict[str, Any]]
    metadata: Dict[str, Union[str, int, float, Dict[str, Any]]]


# Startup/Shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connections and services"""
    global forecaster
    
    logger.info("Starting AI service...")
    logger.info(f"Connecting to database: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    
    try:
        forecaster = DemandForecaster(DATABASE_URL)
        await forecaster.connect()
        logger.info("Database connection established")
        
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up database connections"""
    global forecaster
    
    logger.info("Shutting down AI service...")
    
    if forecaster:
        await forecaster.close()
        logger.info("Database connections closed")


# Helper functions
def validate_week_format(week_str: str) -> bool:
    """Validate week format and check if it's reasonable"""
    try:
        year, week = map(int, week_str.split('-'))
        
        # Basic validation
        if year < 2020 or year > 2030:
            return False
        if week < 1 or week > 53:
            return False
            
        return True
        
    except (ValueError, AttributeError):
        return False


def generate_cache_key(business_id: str, week: str, lookback_weeks: int) -> str:
    """Generate cache key for forecast results"""
    return f"forecast_{business_id}_{week}_lb{lookback_weeks}"


async def save_forecast_to_cache(
    business_id: str,
    cache_key: str,
    forecasts: List[HourlyForecast],
    expires_hours: int = 24
) -> int:
    """Save forecast results to database cache"""
    
    if not forecaster or not forecaster.pool:
        raise RuntimeError("Database not connected")
    
    # Calculate expiry time
    expires_at = datetime.now() + timedelta(hours=expires_hours)
    
    # Prepare batch insert
    insert_query = """
    INSERT INTO forecast_cache 
    (business_id, cache_key, forecast_date, hour_of_day, forecasted_demand, 
     confidence_score, model_version, parameters_used, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (business_id, cache_key, forecast_date, hour_of_day) 
    DO UPDATE SET
        forecasted_demand = EXCLUDED.forecasted_demand,
        confidence_score = EXCLUDED.confidence_score,
        model_version = EXCLUDED.model_version,
        parameters_used = EXCLUDED.parameters_used,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    """
    
    # Prepare data for batch insert
    insert_data = []
    for forecast in forecasts:
        parameters_used = json.dumps({
            "baseline_value": forecast.baseline_value,
            "applied_multiplier": forecast.applied_multiplier
        })
        
        # Convert date to proper date object for database
        if isinstance(forecast.date, str):
            date_obj = datetime.strptime(forecast.date, "%Y-%m-%d").date()
        elif hasattr(forecast.date, 'date'):
            date_obj = forecast.date.date()
        else:
            date_obj = forecast.date
            
        insert_data.append((
            business_id,
            cache_key,
            date_obj,
            forecast.hour_of_day,
            forecast.forecasted_demand,
            forecast.confidence_score,
            "baseline_v1.0",
            parameters_used,
            expires_at
        ))
    
    # Execute batch insert
    async with forecaster.pool.acquire() as conn:
        await conn.executemany(insert_query, insert_data)
    
    return len(insert_data)


# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ShiftMind AI",
        "version": "0.1.0",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/forecast/generate", response_model=ForecastResponse)
async def generate_forecast(
    request: ForecastRequest,
    background_tasks: BackgroundTasks
) -> ForecastResponse:
    """
    Generate demand forecast for the specified business and week
    
    This endpoint:
    1. Loads demand_history for business + target week
    2. Computes simple baseline (moving average) for each hour  
    3. Applies active multipliers (seasonal, holiday, events)
    4. Writes hourly results to forecast_cache (with confidence)
    5. Returns summary
    """
    
    # Validate inputs
    if not validate_week_format(request.week):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid week format '{request.week}'. Expected YYYY-WW"
        )
    
    if not forecaster:
        raise HTTPException(
            status_code=500,
            detail="AI service not properly initialized"
        )
    
    try:
        # Create forecast input
        forecast_input = ForecastInput(
            business_id=request.business_id,
            target_week=request.week,
            lookback_weeks=request.lookback_weeks
        )
        
        # Generate forecasts
        logger.info(f"Starting forecast generation for {request.business_id}, week {request.week}")
        forecasts = await forecaster.generate_forecast(forecast_input)
        
        if not forecasts:
            raise HTTPException(
                status_code=400,
                detail="Could not generate forecasts - insufficient data or invalid parameters"
            )
        
        # Calculate summary statistics
        total_demand = sum(f.forecasted_demand for f in forecasts)
        avg_confidence = sum(f.confidence_score for f in forecasts) / len(forecasts)
        
        # Generate cache key
        cache_key = generate_cache_key(
            request.business_id, 
            request.week, 
            request.lookback_weeks
        )
        
        # Save to cache in background
        background_tasks.add_task(
            save_forecast_to_cache,
            request.business_id,
            cache_key,
            forecasts
        )
        
        # Calculate daily summaries
        daily_summary = {}
        current_date = None
        daily_total = 0
        
        for forecast in forecasts:
            if current_date != forecast.date:
                if current_date is not None:
                    daily_summary[current_date] = round(daily_total, 2)
                current_date = forecast.date
                daily_total = 0
            daily_total += forecast.forecasted_demand
        
        # Add last day
        if current_date is not None:
            daily_summary[current_date] = round(daily_total, 2)
        
        # Prepare response
        response = ForecastResponse(
            business_id=request.business_id,
            target_week=request.week,
            cache_key=cache_key,
            total_forecasts=len(forecasts),
            average_confidence=round(avg_confidence, 3),
            summary={
                "total_weekly_demand": round(total_demand, 2),
                "average_hourly_demand": round(total_demand / len(forecasts), 2),
                **daily_summary
            },
            created_at=datetime.now().isoformat()
        )
        
        logger.info(
            f"Forecast generated successfully: {len(forecasts)} forecasts, "
            f"avg confidence: {avg_confidence:.3f}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating forecast: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/forecast/details/{cache_key}")
async def get_forecast_details(
    cache_key: str,
    business_id: str = Query(..., description="Business UUID for security")
) -> ForecastDetails:
    """Get detailed forecast results from cache"""
    
    if not forecaster or not forecaster.pool:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = """
    SELECT forecast_date, hour_of_day, forecasted_demand, confidence_score,
           model_version, parameters_used, created_at
    FROM forecast_cache
    WHERE business_id = $1 AND cache_key = $2 AND expires_at > NOW()
    ORDER BY forecast_date, hour_of_day
    """
    
    try:
        async with forecaster.pool.acquire() as conn:
            rows = await conn.fetch(query, business_id, cache_key)
        
        if not rows:
            raise HTTPException(
                status_code=404,
                detail="Forecast not found or expired"
            )
        
        # Convert to list of dictionaries
        forecasts = []
        for row in rows:
            forecast_dict = dict(row)
            # Convert datetime to ISO string
            if 'created_at' in forecast_dict and forecast_dict['created_at']:
                forecast_dict['created_at'] = forecast_dict['created_at'].isoformat()
            # Convert date to ISO string  
            if 'forecast_date' in forecast_dict and forecast_dict['forecast_date']:
                forecast_dict['forecast_date'] = forecast_dict['forecast_date'].isoformat()
            # Convert Decimal to float
            if 'forecasted_demand' in forecast_dict:
                forecast_dict['forecasted_demand'] = float(forecast_dict['forecasted_demand'])
            if 'confidence_score' in forecast_dict:
                forecast_dict['confidence_score'] = float(forecast_dict['confidence_score'])
            forecasts.append(forecast_dict)
        
        # Calculate metadata
        total_demand = sum(f['forecasted_demand'] for f in forecasts)
        avg_confidence = sum(f['confidence_score'] for f in forecasts) / len(forecasts)
        
        metadata = {
            "total_forecasts": len(forecasts),
            "total_demand": round(float(total_demand), 2),
            "average_confidence": round(float(avg_confidence), 3),
            "date_range": {
                "start": forecasts[0]['forecast_date'] if forecasts else None,
                "end": forecasts[-1]['forecast_date'] if forecasts else None
            }
        }
        
        return ForecastDetails(
            forecasts=forecasts,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"Error retrieving forecast details: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.delete("/forecast/cache/{cache_key}")
async def delete_forecast_cache(
    cache_key: str,
    business_id: str = Query(..., description="Business UUID for security")
) -> Dict[str, str]:
    """Delete forecast from cache"""
    
    if not forecaster or not forecaster.pool:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    delete_query = """
    DELETE FROM forecast_cache 
    WHERE business_id = $1 AND cache_key = $2
    """
    
    try:
        async with forecaster.pool.acquire() as conn:
            result = await conn.execute(delete_query, business_id, cache_key)
        
        # Extract number of deleted rows from result
        deleted_count = int(result.split()[-1]) if result else 0
        
        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Forecast cache not found"
            )
        
        return {
            "message": f"Deleted {deleted_count} forecast records",
            "cache_key": cache_key
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting forecast cache: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8085,
        reload=True,
        log_level="info"
    )
