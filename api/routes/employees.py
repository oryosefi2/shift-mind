# Employee API routes
"""
Employee Routes Module

API endpoints לניהול עובדים.
מספק CRUD לעובדים עם filtering לפי business_id.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from pydantic import BaseModel
from db import db

router = APIRouter()

class Employee(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    hourly_rate: float

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    hourly_rate: float

@router.get("/employees", response_model=List[Employee])
async def get_employees(business_id: str = Query(..., description="Business ID to get employees for")):
    """Get employees for a specific business"""
    try:
        return await db.get_employees(business_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/employees", response_model=Employee)
async def create_employee(
    employee: EmployeeCreate,
    business_id: str = Query(..., description="Business ID to create employee for")
):
    """Create a new employee for a business"""
    try:
        return await db.create_employee(business_id, employee.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(
    employee_id: str,
    employee: EmployeeCreate,
    business_id: str = Query(..., description="Business ID for authorization")
):
    """Update an employee"""
    try:
        return await db.update_employee(employee_id, business_id, employee.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/employees/{employee_id}")
async def delete_employee(
    employee_id: str,
    business_id: str = Query(..., description="Business ID for authorization")
):
    """Delete an employee"""
    try:
        await db.delete_employee(employee_id, business_id)
        return {"message": "Employee deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
