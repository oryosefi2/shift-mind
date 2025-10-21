from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, date, time
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from db import db

# Import routes
from routes.schedule import router as schedule_router
from routes.calendar import router as calendar_router

# Load environment variables
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

class AvailabilityCreate(BaseModel):
    employee_id: str
    day_of_week: int
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    is_available: bool = True
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None

class AvailabilityUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_available: Optional[bool] = None
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None

class Availability(BaseModel):
    id: str
    business_id: str
    employee_id: str
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool
    effective_from: Optional[date]
    effective_until: Optional[date]
    created_at: datetime
    updated_at: datetime

class BudgetCreate(BaseModel):
    name: str
    budget_type: str  # weekly, monthly, quarterly, yearly
    amount: float
    currency: str = "ILS"
    period_start: date
    period_end: date
    department: Optional[str] = None
    is_active: bool = True

class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    budget_type: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class Budget(BaseModel):
    id: str
    business_id: str
    name: str
    budget_type: str
    amount: float
    currency: str
    period_start: date
    period_end: date
    department: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

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

# Include routers
app.include_router(schedule_router, prefix="/api", tags=["schedule"])
app.include_router(calendar_router, prefix="/api", tags=["calendar"])

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

# Availability endpoints
@app.get("/availability", response_model=List[Availability])
async def get_availability(
    business_id: str = Query(..., description="Business ID to get availability for"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page")
):
    """Get availability records for a specific business"""
    try:
        offset = (page - 1) * page_size
        query = """
            SELECT id, business_id, employee_id, day_of_week, 
                   start_time::text, end_time::text, is_available,
                   effective_from, effective_until, created_at, updated_at
            FROM availability 
            WHERE business_id = $1 
            ORDER BY day_of_week, start_time
            LIMIT $2 OFFSET $3
        """
        rows = await db.fetch_all(query, business_id, page_size, offset)
        return [
            Availability(
                id=str(row['id']),
                business_id=str(row['business_id']),
                employee_id=str(row['employee_id']),
                day_of_week=row['day_of_week'],
                start_time=row['start_time'],
                end_time=row['end_time'],
                is_available=row['is_available'],
                effective_from=row['effective_from'],
                effective_until=row['effective_until'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ) for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/availability", response_model=Availability)
async def create_availability(availability: AvailabilityCreate, business_id: str = Query(...)):
    """Create new availability record"""
    try:
        availability_id = str(uuid.uuid4())
        now = datetime.utcnow()
        query = """
            INSERT INTO availability (id, business_id, employee_id, day_of_week, start_time, end_time, 
                                   is_available, effective_from, effective_until, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, business_id, employee_id, day_of_week, 
                     start_time::text, end_time::text, is_available,
                     effective_from, effective_until, created_at, updated_at
        """
        row = await db.fetch_one(
            query, 
            availability_id, business_id, availability.employee_id, availability.day_of_week,
            availability.start_time, availability.end_time, availability.is_available,
            availability.effective_from, availability.effective_until, now, now
        )
        return Availability(
            id=str(row['id']),
            business_id=str(row['business_id']),
            employee_id=str(row['employee_id']),
            day_of_week=row['day_of_week'],
            start_time=row['start_time'],
            end_time=row['end_time'],
            is_available=row['is_available'],
            effective_from=row['effective_from'],
            effective_until=row['effective_until'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/availability/{availability_id}", response_model=Availability)
async def update_availability(availability_id: str, availability: AvailabilityUpdate):
    """Update availability record"""
    try:
        # Build dynamic update query
        update_fields = []
        values = []
        param_count = 1
        
        if availability.day_of_week is not None:
            update_fields.append(f"day_of_week = ${param_count}")
            values.append(availability.day_of_week)
            param_count += 1
            
        if availability.start_time is not None:
            update_fields.append(f"start_time = ${param_count}")
            values.append(availability.start_time)
            param_count += 1
            
        if availability.end_time is not None:
            update_fields.append(f"end_time = ${param_count}")
            values.append(availability.end_time)
            param_count += 1
            
        if availability.is_available is not None:
            update_fields.append(f"is_available = ${param_count}")
            values.append(availability.is_available)
            param_count += 1
            
        if availability.effective_from is not None:
            update_fields.append(f"effective_from = ${param_count}")
            values.append(availability.effective_from)
            param_count += 1
            
        if availability.effective_until is not None:
            update_fields.append(f"effective_until = ${param_count}")
            values.append(availability.effective_until)
            param_count += 1
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        update_fields.append(f"updated_at = ${param_count}")
        values.append(datetime.utcnow())
        param_count += 1
        
        values.append(availability_id)  # for WHERE clause
        
        query = f"""
            UPDATE availability 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, business_id, employee_id, day_of_week, 
                     start_time::text, end_time::text, is_available,
                     effective_from, effective_until, created_at, updated_at
        """
        
        row = await db.fetch_one(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="Availability record not found")
            
        return Availability(
            id=str(row['id']),
            business_id=str(row['business_id']),
            employee_id=str(row['employee_id']),
            day_of_week=row['day_of_week'],
            start_time=row['start_time'],
            end_time=row['end_time'],
            is_available=row['is_available'],
            effective_from=row['effective_from'],
            effective_until=row['effective_until'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/availability/{availability_id}")
async def delete_availability(availability_id: str):
    """Delete availability record"""
    try:
        query = "DELETE FROM availability WHERE id = $1 RETURNING id"
        row = await db.fetch_one(query, availability_id)
        if not row:
            raise HTTPException(status_code=404, detail="Availability record not found")
        return {"message": "Availability record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Budget endpoints
@app.get("/budgets", response_model=List[Budget])
async def get_budgets(
    business_id: str = Query(..., description="Business ID to get budgets for"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page")
):
    """Get budget records for a specific business"""
    try:
        offset = (page - 1) * page_size
        query = """
            SELECT id, business_id, name, budget_type, amount, currency,
                   period_start, period_end, department, is_active,
                   created_at, updated_at
            FROM budgets 
            WHERE business_id = $1 
            ORDER BY period_start DESC
            LIMIT $2 OFFSET $3
        """
        rows = await db.fetch_all(query, business_id, page_size, offset)
        return [
            Budget(
                id=str(row['id']),
                business_id=str(row['business_id']),
                name=row['name'],
                budget_type=row['budget_type'],
                amount=float(row['amount']),
                currency=row['currency'],
                period_start=row['period_start'],
                period_end=row['period_end'],
                department=row['department'],
                is_active=row['is_active'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ) for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/budgets", response_model=Budget)
async def create_budget(budget: BudgetCreate, business_id: str = Query(...)):
    """Create new budget record"""
    try:
        budget_id = str(uuid.uuid4())
        now = datetime.utcnow()
        query = """
            INSERT INTO budgets (id, business_id, name, budget_type, amount, currency,
                               period_start, period_end, department, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, business_id, name, budget_type, amount, currency,
                     period_start, period_end, department, is_active, created_at, updated_at
        """
        row = await db.fetch_one(
            query, 
            budget_id, business_id, budget.name, budget.budget_type, budget.amount,
            budget.currency, budget.period_start, budget.period_end, budget.department,
            budget.is_active, now, now
        )
        return Budget(
            id=str(row['id']),
            business_id=str(row['business_id']),
            name=row['name'],
            budget_type=row['budget_type'],
            amount=float(row['amount']),
            currency=row['currency'],
            period_start=row['period_start'],
            period_end=row['period_end'],
            department=row['department'],
            is_active=row['is_active'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/budgets/{budget_id}", response_model=Budget)
async def update_budget(budget_id: str, budget: BudgetUpdate):
    """Update budget record"""
    try:
        # Build dynamic update query
        update_fields = []
        values = []
        param_count = 1
        
        if budget.name is not None:
            update_fields.append(f"name = ${param_count}")
            values.append(budget.name)
            param_count += 1
            
        if budget.budget_type is not None:
            update_fields.append(f"budget_type = ${param_count}")
            values.append(budget.budget_type)
            param_count += 1
            
        if budget.amount is not None:
            update_fields.append(f"amount = ${param_count}")
            values.append(budget.amount)
            param_count += 1
            
        if budget.currency is not None:
            update_fields.append(f"currency = ${param_count}")
            values.append(budget.currency)
            param_count += 1
            
        if budget.period_start is not None:
            update_fields.append(f"period_start = ${param_count}")
            values.append(budget.period_start)
            param_count += 1
            
        if budget.period_end is not None:
            update_fields.append(f"period_end = ${param_count}")
            values.append(budget.period_end)
            param_count += 1
            
        if budget.department is not None:
            update_fields.append(f"department = ${param_count}")
            values.append(budget.department)
            param_count += 1
            
        if budget.is_active is not None:
            update_fields.append(f"is_active = ${param_count}")
            values.append(budget.is_active)
            param_count += 1
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        update_fields.append(f"updated_at = ${param_count}")
        values.append(datetime.utcnow())
        param_count += 1
        
        values.append(budget_id)  # for WHERE clause
        
        query = f"""
            UPDATE budgets 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, business_id, name, budget_type, amount, currency,
                     period_start, period_end, department, is_active, created_at, updated_at
        """
        
        row = await db.fetch_one(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="Budget record not found")
            
        return Budget(
            id=str(row['id']),
            business_id=str(row['business_id']),
            name=row['name'],
            budget_type=row['budget_type'],
            amount=float(row['amount']),
            currency=row['currency'],
            period_start=row['period_start'],
            period_end=row['period_end'],
            department=row['department'],
            is_active=row['is_active'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str):
    """Delete budget record"""
    try:
        query = "DELETE FROM budgets WHERE id = $1 RETURNING id"
        row = await db.fetch_one(query, budget_id)
        if not row:
            raise HTTPException(status_code=404, detail="Budget record not found")
        return {"message": "Budget record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)