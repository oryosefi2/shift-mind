
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from db import db

load_dotenv()

# Pydantic models
class BusinessCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    timezone: str = "Asia/Jerusalem"

class Business(BaseModel):
    id: str
    name: str
    industry: Optional[str] = None
    timezone: str
    created_at: datetime
    updated_at: datetime

class BusinessShort(BaseModel):
    id: str
    name: str

class Employee(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    hourly_rate: Optional[float]

# In-memory storage (temporary - will be replaced with database)
businesses_db = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    yield
    # Shutdown
    await db.disconnect()

app = FastAPI(
    title="ShiftMind API",
    description="Backend API for ShiftMind application",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to ShiftMind API"}

# Business endpoints
@app.get("/businesses", response_model=List[BusinessShort])
async def get_businesses():
    """Get all businesses - returns id and name only"""
    try:
        return await db.get_businesses()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Employee endpoints
@app.get("/employees", response_model=List[Employee])
async def get_employees(business_id: str = Query(..., description="Business ID to get employees for")):
    """Get employees for a specific business"""
    try:
        return await db.get_employees(business_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Legacy business endpoints (keeping for backward compatibility)
@app.get("/businesses-old", response_model=List[Business])
async def get_businesses_old():
    """Get all businesses (legacy endpoint with full data)"""
    return businesses_db

@app.post("/businesses", response_model=Business)
async def create_business(business: BusinessCreate):
    """Create a new business"""
    now = datetime.utcnow()
    new_business = Business(
        id=str(uuid.uuid4()),
        name=business.name,
        industry=business.industry,
        timezone=business.timezone,
        created_at=now,
        updated_at=now
    )
    businesses_db.append(new_business)
    return new_business

@app.get("/businesses/{business_id}", response_model=Business)
async def get_business(business_id: str):
    """Get a specific business by ID"""
    for business in businesses_db:
        if business.id == business_id:
            return business
    raise HTTPException(status_code=404, detail="Business not found")

@app.put("/businesses/{business_id}", response_model=Business)
async def update_business(business_id: str, business_update: BusinessCreate):
    """Update a business"""
    for i, business in enumerate(businesses_db):
        if business.id == business_id:
            updated_business = Business(
                id=business_id,
                name=business_update.name,
                industry=business_update.industry,
                timezone=business_update.timezone,
                created_at=business.created_at,
                updated_at=datetime.utcnow()
            )
            businesses_db[i] = updated_business
            return updated_business
    raise HTTPException(status_code=404, detail="Business not found")

@app.delete("/businesses/{business_id}")
async def delete_business(business_id: str):
    """Delete a business"""
    for i, business in enumerate(businesses_db):
        if business.id == business_id:
            deleted_business = businesses_db.pop(i)
            return {"message": f"Business '{deleted_business.name}' deleted successfully"}
    raise HTTPException(status_code=404, detail="Business not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)