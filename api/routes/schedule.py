# Copilot: validate inputs; persist draft to schedules + shifts; return alerts.
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
import re
import uuid
from pydantic import BaseModel

from services.scheduler import ScheduleGenerator, Employee, AvailabilitySlot, Shift, Alert
from db import db

router = APIRouter()

class ScheduleRequest(BaseModel):
    weekly_budget: float
    min_staff_per_hour: int = 1
    forecast_data: Optional[Dict] = None

class ScheduleResponse(BaseModel):
    schedule_id: str
    week_start: date
    total_cost: float
    budget_utilization: float
    shifts: List[Dict]
    alerts: List[Dict]
    status: str  # 'draft', 'approved', 'published'

class ShiftDict(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    date: str
    start_time: str
    end_time: str
    break_minutes: int
    hourly_rate: float
    total_cost: float

class AlertDict(BaseModel):
    type: str
    severity: str
    message: str
    details: Dict

def parse_week_string(week_str: str) -> date:
    """Parse week string like '2025-W43' to Monday date"""
    match = re.match(r'(\d{4})-W(\d{1,2})', week_str)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid week format. Use YYYY-WNN (e.g., 2025-W43)")
    
    year, week = int(match.group(1)), int(match.group(2))
    
    # Get Monday of the specified week
    jan_1 = date(year, 1, 1)
    week_1_monday = jan_1 - timedelta(days=jan_1.weekday())
    target_monday = week_1_monday + timedelta(weeks=week - 1)
    
    return target_monday

async def get_employees_data(business_id: str) -> List[Employee]:
    """Fetch employees from database"""
    query = """
        SELECT id, first_name, last_name, hourly_rate 
        FROM employees 
        WHERE business_id = $1 AND hourly_rate IS NOT NULL
        ORDER BY hourly_rate ASC
    """
    rows = await db.fetch_all(query, business_id)
    
    employees = []
    for row in rows:
        employees.append(Employee(
            id=str(row['id']),
            first_name=row['first_name'],
            last_name=row['last_name'],
            hourly_rate=float(row['hourly_rate']),
            skills=[]  # Default empty skills for now
        ))
    
    return employees

async def get_availability_data(business_id: str) -> List[AvailabilitySlot]:
    """Fetch availability from database"""
    query = """
        SELECT employee_id, day_of_week, start_time::text, end_time::text, is_available
        FROM availability 
        WHERE business_id = $1 AND is_available = true
        ORDER BY employee_id, day_of_week, start_time
    """
    rows = await db.fetch_all(query, business_id)
    
    availability = []
    for row in rows:
        from datetime import time
        
        # Parse time strings
        start_time = datetime.strptime(row['start_time'], '%H:%M:%S').time()
        end_time = datetime.strptime(row['end_time'], '%H:%M:%S').time()
        
        availability.append(AvailabilitySlot(
            employee_id=str(row['employee_id']),
            day_of_week=row['day_of_week'],
            start_time=start_time,
            end_time=end_time,
            is_available=row['is_available']
        ))
    
    return availability

async def save_schedule_to_db(business_id: str, week_start: date, shifts: List[Shift], 
                            total_cost: float, weekly_budget: float) -> str:
    """Save schedule draft to database"""
    
    # Create schedule record
    schedule_id = str(uuid.uuid4())
    total_hours = sum(len(range(int(shift.start_time.hour), int(shift.end_time.hour))) for shift in shifts)
    
    schedule_query = """
        INSERT INTO schedules (id, business_id, name, week_start_date, status, total_hours, total_cost, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    """
    
    now = datetime.utcnow()
    schedule_name = f"סידור שבוע {week_start.strftime('%d/%m/%Y')}"
    
    await db.fetch_one(
        schedule_query,
        schedule_id, business_id, schedule_name, week_start, 'draft', 
        total_hours, total_cost, now, now
    )
    
    # Create shift records
    for shift in shifts:
        shift_query = """
            INSERT INTO shifts (id, business_id, schedule_id, employee_id, date, start_time, end_time, 
                              break_minutes, hourly_rate, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        """
        await db.fetch_one(
            shift_query,
            shift.id, business_id, schedule_id, shift.employee_id, shift.date,
            shift.start_time, shift.end_time, shift.break_minutes,
            shift.hourly_rate, 'scheduled', now, now
        )
    
    return schedule_id

@router.post("/schedule/{week}/generate", response_model=ScheduleResponse)
async def generate_schedule(
    week: str,
    request: ScheduleRequest,
    business_id: str = Query(..., description="Business ID")
):
    """
    Generate weekly schedule draft using greedy algorithm
    
    Args:
        week: Week in format YYYY-WNN (e.g., 2025-W43)
        request: Schedule generation parameters
        business_id: Business identifier
        
    Returns:
        Generated schedule with shifts and alerts
    """
    try:
        # Parse and validate week
        week_start = parse_week_string(week)
        
        # Fetch data from database
        employees = await get_employees_data(business_id)
        availability = await get_availability_data(business_id)
        
        if not employees:
            raise HTTPException(status_code=400, detail="אין עובדים עם שכר מוגדר בעסק זה")
        
        if not availability:
            raise HTTPException(status_code=400, detail="לא הוגדרה זמינות לעובדים")
        
        # Initialize scheduler
        generator = ScheduleGenerator(
            weekly_budget=request.weekly_budget,
            min_staff_per_hour=request.min_staff_per_hour
        )
        
        # Generate schedule
        shifts, alerts = generator.generate_schedule(
            employees=employees,
            availability=availability,
            forecast_data=request.forecast_data
        )
        
        # Save to database
        schedule_id = await save_schedule_to_db(
            business_id=business_id,
            week_start=week_start,
            shifts=shifts,
            total_cost=generator.current_cost,
            weekly_budget=request.weekly_budget
        )
        
        # Prepare response
        employee_dict = {emp.id: f"{emp.first_name} {emp.last_name}" for emp in employees}
        
        shift_dicts = []
        for shift in shifts:
            shift_dicts.append({
                'id': shift.id,
                'employee_id': shift.employee_id,
                'employee_name': employee_dict.get(shift.employee_id, 'לא ידוע'),
                'date': shift.date.isoformat(),
                'start_time': shift.start_time.strftime('%H:%M'),
                'end_time': shift.end_time.strftime('%H:%M'),
                'break_minutes': shift.break_minutes,
                'hourly_rate': shift.hourly_rate,
                'total_cost': shift.total_cost
            })
        
        alert_dicts = []
        for alert in alerts:
            alert_dicts.append({
                'type': alert.type,
                'severity': alert.severity,
                'message': alert.message,
                'details': alert.details
            })
        
        budget_utilization = (generator.current_cost / request.weekly_budget) * 100 if request.weekly_budget > 0 else 0
        
        return ScheduleResponse(
            schedule_id=schedule_id,
            week_start=week_start,
            total_cost=generator.current_cost,
            budget_utilization=budget_utilization,
            shifts=shift_dicts,
            alerts=alert_dicts,
            status='draft'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה ביצירת סידור: {str(e)}")

@router.get("/schedule/{week}", response_model=ScheduleResponse)
async def get_schedule(
    week: str,
    business_id: str = Query(..., description="Business ID")
):
    """Get existing schedule for a week"""
    try:
        week_start = parse_week_string(week)
        
        # Fetch schedule from database
        schedule_query = """
            SELECT id, name, status, total_cost, total_hours, created_at
            FROM schedules 
            WHERE business_id = $1 AND week_start_date = $2
            ORDER BY created_at DESC
            LIMIT 1
        """
        
        schedule_row = await db.fetch_one(schedule_query, business_id, week_start)
        if not schedule_row:
            raise HTTPException(status_code=404, detail="לא נמצא סידור לשבוע זה")
        
        schedule_id = str(schedule_row['id'])
        
        # Fetch shifts
        shifts_query = """
            SELECT s.*, e.first_name, e.last_name
            FROM shifts s
            JOIN employees e ON s.employee_id = e.id
            WHERE s.schedule_id = $1
            ORDER BY s.date, s.start_time
        """
        
        shifts_rows = await db.fetch_all(shifts_query, schedule_id)
        
        shift_dicts = []
        for row in shifts_rows:
            # Calculate shift cost (since it's not stored directly)
            start_time = row['start_time']
            end_time = row['end_time']
            hours_worked = (datetime.combine(date.today(), end_time) - 
                          datetime.combine(date.today(), start_time)).total_seconds() / 3600
            break_minutes = row['break_minutes'] or 0
            actual_work_hours = hours_worked - (break_minutes / 60)
            total_cost = actual_work_hours * float(row['hourly_rate']) if row['hourly_rate'] else 0
            
            shift_dicts.append({
                'id': str(row['id']),
                'employee_id': str(row['employee_id']),
                'employee_name': f"{row['first_name']} {row['last_name']}",
                'date': row['date'].isoformat(),
                'start_time': start_time.strftime('%H:%M'),
                'end_time': end_time.strftime('%H:%M'),
                'break_minutes': break_minutes,
                'hourly_rate': float(row['hourly_rate']) if row['hourly_rate'] else 0,
                'total_cost': total_cost
            })
        
        budget_utilization = 0  # Will be calculated from actual shifts if needed
        
        return ScheduleResponse(
            schedule_id=schedule_id,
            week_start=week_start,
            total_cost=float(schedule_row['total_cost']),
            budget_utilization=budget_utilization,
            shifts=shift_dicts,
            alerts=[],  # Could fetch alerts from a separate table if needed
            status=schedule_row['status']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בשליפת סידור: {str(e)}")
