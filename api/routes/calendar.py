# Copilot: CRUD endpoints; all queries filtered by business_id.
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Optional
from datetime import datetime
from datetime import date as date_type
import uuid
import json
from pydantic import BaseModel, Field
from decimal import Decimal

from db import db

router = APIRouter()

# Pydantic Models
class SeasonalProfileCreate(BaseModel):
    name: str
    profile_type: str = Field(..., pattern="^(weekly|monthly|seasonal|holiday)$")
    multiplier_data: Dict  # 24-hour array as {"00": 1.0, "01": 1.2, ...}
    is_active: bool = True
    priority: int = 1

class SeasonalProfileUpdate(BaseModel):
    name: Optional[str] = None
    profile_type: Optional[str] = Field(None, pattern="^(weekly|monthly|seasonal|holiday)$")
    multiplier_data: Optional[Dict] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None

class SeasonalProfile(BaseModel):
    id: str
    business_id: str
    name: str
    profile_type: str
    multiplier_data: Dict
    is_active: bool
    priority: int
    created_at: datetime
    updated_at: datetime

class CalendarOverrideCreate(BaseModel):
    date: date_type
    override_type: str = Field(..., pattern="^(holiday|closure|special_hours|high_demand)$")
    multiplier: Optional[float] = None
    custom_hours: Optional[Dict] = None
    description: str
    is_active: bool = True

class CalendarOverrideUpdate(BaseModel):
    date: Optional[date_type] = None
    override_type: Optional[str] = Field(None, pattern="^(holiday|closure|special_hours|high_demand)$")
    multiplier: Optional[float] = None
    custom_hours: Optional[Dict] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class CalendarOverride(BaseModel):
    id: str
    business_id: str
    date: date_type
    override_type: str
    multiplier: Optional[float]
    custom_hours: Optional[Dict]
    description: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

class BusinessEventCreate(BaseModel):
    name: str
    event_type: str
    start_date: datetime
    end_date: datetime
    expected_impact: Optional[float] = None
    description: Optional[str] = None
    location: Optional[str] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[Dict] = None

class BusinessEventUpdate(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    expected_impact: Optional[float] = None
    description: Optional[str] = None
    location: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[Dict] = None

class BusinessEvent(BaseModel):
    id: str
    business_id: str
    name: str
    event_type: str
    start_date: datetime
    end_date: datetime
    expected_impact: Optional[float]
    description: Optional[str]
    location: Optional[str]
    is_recurring: bool
    recurrence_pattern: Optional[Dict]
    created_at: datetime
    updated_at: datetime

# Seasonal Profiles Endpoints
@router.get("/seasonal-profiles", response_model=List[SeasonalProfile])
async def get_seasonal_profiles(
    business_id: str = Query(..., description="Business ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page")
):
    """Get seasonal profiles for a business"""
    try:
        offset = (page - 1) * page_size
        query = """
            SELECT id, business_id, name, profile_type, multiplier_data, 
                   is_active, priority, created_at, updated_at
            FROM seasonal_profiles 
            WHERE business_id = $1 
            ORDER BY priority ASC, name ASC
            LIMIT $2 OFFSET $3
        """
        rows = await db.fetch_all(query, business_id, page_size, offset)
        
        return [
            SeasonalProfile(
                id=str(row['id']),
                business_id=str(row['business_id']),
                name=row['name'],
                profile_type=row['profile_type'],
                multiplier_data=row['multiplier_data'] if isinstance(row['multiplier_data'], dict) else json.loads(row['multiplier_data']),
                is_active=row['is_active'],
                priority=row['priority'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ) for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בטעינת פרופילי עונתיות: {str(e)}")

@router.post("/seasonal-profiles", response_model=SeasonalProfile)
async def create_seasonal_profile(
    profile: SeasonalProfileCreate,
    business_id: str = Query(..., description="Business ID")
):
    """Create new seasonal profile"""
    try:
        profile_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        query = """
            INSERT INTO seasonal_profiles (id, business_id, name, profile_type, multiplier_data, 
                                         is_active, priority, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, business_id, name, profile_type, multiplier_data, 
                     is_active, priority, created_at, updated_at
        """
        
        row = await db.fetch_one(
            query,
            profile_id, business_id, profile.name, profile.profile_type,
            json.dumps(profile.multiplier_data), profile.is_active, profile.priority, now, now
        )
        
        return SeasonalProfile(
            id=str(row['id']),
            business_id=str(row['business_id']),
            name=row['name'],
            profile_type=row['profile_type'],
            multiplier_data=row['multiplier_data'] if isinstance(row['multiplier_data'], dict) else json.loads(row['multiplier_data']),
            is_active=row['is_active'],
            priority=row['priority'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה ביצירת פרופיל עונתיות: {str(e)}")

@router.put("/seasonal-profiles/{profile_id}", response_model=SeasonalProfile)
async def update_seasonal_profile(
    profile_id: str,
    profile: SeasonalProfileUpdate
):
    """Update seasonal profile"""
    try:
        # Build dynamic update query
        update_fields = []
        values = []
        param_count = 1
        
        if profile.name is not None:
            update_fields.append(f"name = ${param_count}")
            values.append(profile.name)
            param_count += 1
            
        if profile.profile_type is not None:
            update_fields.append(f"profile_type = ${param_count}")
            values.append(profile.profile_type)
            param_count += 1
            
        if profile.multiplier_data is not None:
            update_fields.append(f"multiplier_data = ${param_count}")
            values.append(json.dumps(profile.multiplier_data))
            param_count += 1
            
        if profile.is_active is not None:
            update_fields.append(f"is_active = ${param_count}")
            values.append(profile.is_active)
            param_count += 1
            
        if profile.priority is not None:
            update_fields.append(f"priority = ${param_count}")
            values.append(profile.priority)
            param_count += 1
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="אין שדות לעדכון")
            
        update_fields.append(f"updated_at = ${param_count}")
        values.append(datetime.utcnow())
        param_count += 1
        
        values.append(profile_id)  # for WHERE clause
        
        query = f"""
            UPDATE seasonal_profiles 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, business_id, name, profile_type, multiplier_data, 
                     is_active, priority, created_at, updated_at
        """
        
        row = await db.fetch_one(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="פרופיל עונתיות לא נמצא")
            
        return SeasonalProfile(
            id=str(row['id']),
            business_id=str(row['business_id']),
            name=row['name'],
            profile_type=row['profile_type'],
            multiplier_data=row['multiplier_data'] if isinstance(row['multiplier_data'], dict) else json.loads(row['multiplier_data']),
            is_active=row['is_active'],
            priority=row['priority'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בעדכון פרופיל עונתיות: {str(e)}")

@router.delete("/seasonal-profiles/{profile_id}")
async def delete_seasonal_profile(profile_id: str):
    """Delete seasonal profile"""
    try:
        query = "DELETE FROM seasonal_profiles WHERE id = $1 RETURNING id"
        row = await db.fetch_one(query, profile_id)
        if not row:
            raise HTTPException(status_code=404, detail="פרופיל עונתיות לא נמצא")
        return {"message": "פרופיל עונתיות נמחק בהצלחה"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה במחיקת פרופיל עונתיות: {str(e)}")

# Calendar Overrides Endpoints
@router.get("/calendar-overrides", response_model=List[CalendarOverride])
async def get_calendar_overrides(
    business_id: str = Query(..., description="Business ID"),
    start_date: Optional[date_type] = Query(None, description="Start date filter"),
    end_date: Optional[date_type] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page")
):
    """Get calendar overrides for a business"""
    try:
        offset = (page - 1) * page_size
        
        # Build query with optional date filters
        where_clauses = ["business_id = $1"]
        params = [business_id]
        param_count = 2
        
        if start_date:
            where_clauses.append(f"date >= ${param_count}")
            params.append(start_date)
            param_count += 1
            
        if end_date:
            where_clauses.append(f"date <= ${param_count}")
            params.append(end_date)
            param_count += 1
        
        params.extend([page_size, offset])
        
        query = f"""
            SELECT id, business_id, date, override_type, multiplier, custom_hours,
                   description, is_active, created_at, updated_at
            FROM calendar_overrides 
            WHERE {' AND '.join(where_clauses)}
            ORDER BY date DESC
            LIMIT ${param_count} OFFSET ${param_count + 1}
        """
        
        rows = await db.fetch_all(query, *params)
        
        return [
            CalendarOverride(
                id=str(row['id']),
                business_id=str(row['business_id']),
                date=row['date'],
                override_type=row['override_type'],
                multiplier=float(row['multiplier']) if row['multiplier'] else None,
                custom_hours=row['custom_hours'],
                description=row['description'],
                is_active=row['is_active'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ) for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בטעינת עקיפות לוח שנה: {str(e)}")

@router.post("/calendar-overrides", response_model=CalendarOverride)
async def create_calendar_override(
    override: CalendarOverrideCreate,
    business_id: str = Query(..., description="Business ID")
):
    """Create new calendar override"""
    try:
        override_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        query = """
            INSERT INTO calendar_overrides (id, business_id, date, override_type, multiplier,
                                          custom_hours, description, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, business_id, date, override_type, multiplier, custom_hours,
                     description, is_active, created_at, updated_at
        """
        
        row = await db.fetch_one(
            query,
            override_id, business_id, override.date, override.override_type,
            override.multiplier, override.custom_hours, override.description,
            override.is_active, now, now
        )
        
        return CalendarOverride(
            id=str(row['id']),
            business_id=str(row['business_id']),
            date=row['date'],
            override_type=row['override_type'],
            multiplier=float(row['multiplier']) if row['multiplier'] else None,
            custom_hours=row['custom_hours'],
            description=row['description'],
            is_active=row['is_active'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה ביצירת עקיפת לוח שנה: {str(e)}")

@router.put("/calendar-overrides/{override_id}", response_model=CalendarOverride)
async def update_calendar_override(
    override_id: str,
    override: CalendarOverrideUpdate
):
    """Update calendar override"""
    try:
        # Build dynamic update query
        update_fields = []
        values = []
        param_count = 1
        
        if override.date is not None:
            update_fields.append(f"date = ${param_count}")
            values.append(override.date)
            param_count += 1
            
        if override.override_type is not None:
            update_fields.append(f"override_type = ${param_count}")
            values.append(override.override_type)
            param_count += 1
            
        if override.multiplier is not None:
            update_fields.append(f"multiplier = ${param_count}")
            values.append(override.multiplier)
            param_count += 1
            
        if override.custom_hours is not None:
            update_fields.append(f"custom_hours = ${param_count}")
            values.append(override.custom_hours)
            param_count += 1
            
        if override.description is not None:
            update_fields.append(f"description = ${param_count}")
            values.append(override.description)
            param_count += 1
            
        if override.is_active is not None:
            update_fields.append(f"is_active = ${param_count}")
            values.append(override.is_active)
            param_count += 1
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="אין שדות לעדכון")
            
        update_fields.append(f"updated_at = ${param_count}")
        values.append(datetime.utcnow())
        param_count += 1
        
        values.append(override_id)  # for WHERE clause
        
        query = f"""
            UPDATE calendar_overrides 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, business_id, date, override_type, multiplier, custom_hours,
                     description, is_active, created_at, updated_at
        """
        
        row = await db.fetch_one(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="עקיפת לוח שנה לא נמצאה")
            
        return CalendarOverride(
            id=str(row['id']),
            business_id=str(row['business_id']),
            date=row['date'],
            override_type=row['override_type'],
            multiplier=float(row['multiplier']) if row['multiplier'] else None,
            custom_hours=row['custom_hours'],
            description=row['description'],
            is_active=row['is_active'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בעדכון עקיפת לוח שנה: {str(e)}")

@router.delete("/calendar-overrides/{override_id}")
async def delete_calendar_override(override_id: str):
    """Delete calendar override"""
    try:
        query = "DELETE FROM calendar_overrides WHERE id = $1 RETURNING id"
        row = await db.fetch_one(query, override_id)
        if not row:
            raise HTTPException(status_code=404, detail="עקיפת לוח שנה לא נמצאה")
        return {"message": "עקיפת לוח שנה נמחקה בהצלחה"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה במחיקת עקיפת לוח שנה: {str(e)}")

# Business Events Endpoints  
@router.get("/business-events", response_model=List[BusinessEvent])
async def get_business_events(
    business_id: str = Query(..., description="Business ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page")
):
    """Get business events for a business"""
    try:
        offset = (page - 1) * page_size
        
        # Build query with optional date filters
        where_clauses = ["business_id = $1"]
        params = [business_id]
        param_count = 2
        
        if start_date:
            where_clauses.append(f"end_date >= ${param_count}")
            params.append(start_date)
            param_count += 1
            
        if end_date:
            where_clauses.append(f"start_date <= ${param_count}")
            params.append(end_date)
            param_count += 1
        
        params.extend([page_size, offset])
        
        query = f"""
            SELECT id, business_id, name, event_type, start_date, end_date,
                   expected_impact, description, location, is_recurring,
                   recurrence_pattern, created_at, updated_at
            FROM business_events 
            WHERE {' AND '.join(where_clauses)}
            ORDER BY start_date DESC
            LIMIT ${param_count} OFFSET ${param_count + 1}
        """
        
        rows = await db.fetch_all(query, *params)
        
        return [
            BusinessEvent(
                id=str(row['id']),
                business_id=str(row['business_id']),
                name=row['name'],
                event_type=row['event_type'],
                start_date=row['start_date'],
                end_date=row['end_date'],
                expected_impact=float(row['expected_impact']) if row['expected_impact'] else None,
                description=row['description'],
                location=row['location'],
                is_recurring=row['is_recurring'],
                recurrence_pattern=row['recurrence_pattern'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ) for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בטעינת אירועי עסק: {str(e)}")

@router.post("/business-events", response_model=BusinessEvent)
async def create_business_event(
    event: BusinessEventCreate,
    business_id: str = Query(..., description="Business ID")
):
    """Create new business event"""
    try:
        event_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        query = """
            INSERT INTO business_events (id, business_id, name, event_type, start_date, end_date,
                                       expected_impact, description, location, is_recurring,
                                       recurrence_pattern, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, business_id, name, event_type, start_date, end_date,
                     expected_impact, description, location, is_recurring,
                     recurrence_pattern, created_at, updated_at
        """
        
        row = await db.fetch_one(
            query,
            event_id, business_id, event.name, event.event_type, event.start_date,
            event.end_date, event.expected_impact, event.description, event.location,
            event.is_recurring, event.recurrence_pattern, now, now
        )
        
        return BusinessEvent(
            id=str(row['id']),
            business_id=str(row['business_id']),
            name=row['name'],
            event_type=row['event_type'],
            start_date=row['start_date'],
            end_date=row['end_date'],
            expected_impact=float(row['expected_impact']) if row['expected_impact'] else None,
            description=row['description'],
            location=row['location'],
            is_recurring=row['is_recurring'],
            recurrence_pattern=row['recurrence_pattern'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה ביצירת אירוע עסק: {str(e)}")

@router.put("/business-events/{event_id}", response_model=BusinessEvent)
async def update_business_event(
    event_id: str,
    event: BusinessEventUpdate
):
    """Update business event"""
    try:
        # Build dynamic update query
        update_fields = []
        values = []
        param_count = 1
        
        if event.name is not None:
            update_fields.append(f"name = ${param_count}")
            values.append(event.name)
            param_count += 1
            
        if event.event_type is not None:
            update_fields.append(f"event_type = ${param_count}")
            values.append(event.event_type)
            param_count += 1
            
        if event.start_date is not None:
            update_fields.append(f"start_date = ${param_count}")
            values.append(event.start_date)
            param_count += 1
            
        if event.end_date is not None:
            update_fields.append(f"end_date = ${param_count}")
            values.append(event.end_date)
            param_count += 1
            
        if event.expected_impact is not None:
            update_fields.append(f"expected_impact = ${param_count}")
            values.append(event.expected_impact)
            param_count += 1
            
        if event.description is not None:
            update_fields.append(f"description = ${param_count}")
            values.append(event.description)
            param_count += 1
            
        if event.location is not None:
            update_fields.append(f"location = ${param_count}")
            values.append(event.location)
            param_count += 1
            
        if event.is_recurring is not None:
            update_fields.append(f"is_recurring = ${param_count}")
            values.append(event.is_recurring)
            param_count += 1
            
        if event.recurrence_pattern is not None:
            update_fields.append(f"recurrence_pattern = ${param_count}")
            values.append(event.recurrence_pattern)
            param_count += 1
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="אין שדות לעדכון")
            
        update_fields.append(f"updated_at = ${param_count}")
        values.append(datetime.utcnow())
        param_count += 1
        
        values.append(event_id)  # for WHERE clause
        
        query = f"""
            UPDATE business_events 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, business_id, name, event_type, start_date, end_date,
                     expected_impact, description, location, is_recurring,
                     recurrence_pattern, created_at, updated_at
        """
        
        row = await db.fetch_one(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="אירוע עסק לא נמצא")
            
        return BusinessEvent(
            id=str(row['id']),
            business_id=str(row['business_id']),
            name=row['name'],
            event_type=row['event_type'],
            start_date=row['start_date'],
            end_date=row['end_date'],
            expected_impact=float(row['expected_impact']) if row['expected_impact'] else None,
            description=row['description'],
            location=row['location'],
            is_recurring=row['is_recurring'],
            recurrence_pattern=row['recurrence_pattern'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בעדכון אירוע עסק: {str(e)}")

@router.delete("/business-events/{event_id}")
async def delete_business_event(event_id: str):
    """Delete business event"""
    try:
        query = "DELETE FROM business_events WHERE id = $1 RETURNING id"
        row = await db.fetch_one(query, event_id)
        if not row:
            raise HTTPException(status_code=404, detail="אירוע עסק לא נמצא")
        return {"message": "אירוע עסק נמחק בהצלחה"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה במחיקת אירוע עסק: {str(e)}")
