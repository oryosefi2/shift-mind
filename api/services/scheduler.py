# Copilot: demand_to_staff(), pick_employees_greedy(), merge_hours_to_shifts().
from typing import List, Dict, Tuple, Optional
from datetime import datetime, time, timedelta, date
from dataclasses import dataclass
import uuid

@dataclass
class Employee:
    id: str
    first_name: str
    last_name: str
    hourly_rate: float
    skills: List[str]

@dataclass
class AvailabilitySlot:
    employee_id: str
    day_of_week: int  # 0=Sunday, 6=Saturday
    start_time: time
    end_time: time
    is_available: bool

@dataclass
class Shift:
    id: str
    employee_id: str
    date: date
    start_time: time
    end_time: time
    break_minutes: int
    hourly_rate: float
    total_cost: float

@dataclass
class Alert:
    type: str  # 'budget_exceeded', 'insufficient_staff', 'no_availability'
    severity: str  # 'critical', 'warning', 'info'
    message: str
    details: Dict

class ScheduleGenerator:
    """Greedy schedule generator with budget constraints"""
    
    def __init__(self, weekly_budget: float, min_staff_per_hour: int = 1):
        self.weekly_budget = weekly_budget
        self.min_staff_per_hour = min_staff_per_hour
        self.current_cost = 0.0
        self.alerts = []
        self.forecast_cache = {}  # Cache for loaded forecasts
        
    def demand_to_staff(self, hour: int, day: int, forecast_data: Optional[Dict] = None) -> int:
        """
        Convert demand forecast to required staff count
        Simple logic: peak hours need more staff
        """
        # Peak hours: 12-14, 18-21 need 2 staff, others need 1
        peak_hours = list(range(12, 15)) + list(range(18, 22))
        
        if forecast_data:
            # Use forecast data if available
            demand_key = f"day_{day}_hour_{hour}"
            if demand_key in forecast_data:
                return max(1, int(forecast_data[demand_key] / 10))  # Simple conversion
                
        # Default demand pattern
        if hour in peak_hours:
            return max(2, self.min_staff_per_hour)
        elif 6 <= hour <= 23:  # Business hours
            return max(1, self.min_staff_per_hour)
        else:
            return 0  # Closed hours
    
    async def load_forecast(self, business_id: str, week: str) -> bool:
        """
        טוען תחזית ביקוש מה-cache לשבוע מסוים
        
        Args:
            business_id: מזהה עסק
            week: שבוע בפורמט YYYY-WW
            
        Returns:
            bool: האם הטעינה הצליחה
        """
        from db import db  # Import here to avoid circular imports
        
        cache_key = f"forecast_{business_id}_{week}_lb8"
        
        try:
            # שאילתא לטעינת תחזיות מה-cache
            query = """
            SELECT forecast_date, hour_of_day, forecasted_demand, confidence_score
            FROM forecast_cache
            WHERE business_id = %s AND cache_key = %s AND expires_at > NOW()
            ORDER BY forecast_date, hour_of_day
            """
            
            cursor = db.cursor()
            cursor.execute(query, (business_id, cache_key))
            results = cursor.fetchall()
            
            if not results:
                self.alerts.append(Alert(
                    type="missing_forecast",
                    severity="warning", 
                    message=f"לא נמצאה תחזית לשבוע {week}",
                    details={"week": week, "business_id": business_id}
                ))
                return False
            
            # המרת תוצאות לפורמט נוח
            self.forecast_cache[week] = {}
            
            for row in results:
                forecast_date, hour_of_day, forecasted_demand, confidence_score = row
                day_key = forecast_date.strftime("%Y-%m-%d")
                
                if day_key not in self.forecast_cache[week]:
                    self.forecast_cache[week][day_key] = {}
                
                self.forecast_cache[week][day_key][hour_of_day] = {
                    "demand": float(forecasted_demand),
                    "confidence": float(confidence_score)
                }
            
            forecast_count = len(results)
            avg_confidence = sum(float(row[3]) for row in results) / forecast_count if results else 0
            
            self.alerts.append(Alert(
                type="forecast_loaded",
                severity="info",
                message=f"תחזית נטענה בהצלחה לשבוע {week}",
                details={
                    "forecasts_count": forecast_count,
                    "average_confidence": round(avg_confidence, 3),
                    "week": week
                }
            ))
            
            return True
            
        except Exception as e:
            self.alerts.append(Alert(
                type="forecast_error",
                severity="warning",
                message=f"שגיאה בטעינת תחזית: {str(e)}",
                details={"week": week, "error": str(e)}
            ))
            return False
    
    def demand_to_staff_with_forecast(self, target_date: str, hour: int, settings: Optional[Dict] = None) -> int:
        """
        המרת ביקוש חזוי למספר עובדים נדרש
        
        Args:
            target_date: תאריך בפורמט YYYY-MM-DD
            hour: שעה (0-23)
            settings: הגדרות המרה מ-businesses.settings
            
        Returns:
            int: מספר עובדים נדרש
        """
        
        # ברירות מחדל להגדרות המרה
        default_settings = {
            "demand_per_staff": 15.0,  # יחידות ביקוש לעובד
            "min_staff_per_hour": 1,
            "max_staff_per_hour": 5,
            "confidence_threshold": 0.7  # סף ביטחון מינימלי
        }
        
        if settings:
            default_settings.update(settings)
        
        # חיפוש תחזית בcache
        week = None
        for cached_week, week_data in self.forecast_cache.items():
            if target_date in week_data:
                week = cached_week
                break
        
        if week and target_date in self.forecast_cache[week]:
            hour_data = self.forecast_cache[week][target_date].get(hour)
            
            if hour_data:
                demand = hour_data["demand"]
                confidence = hour_data["confidence"]
                
                # בדיקת סף ביטחון
                if confidence >= default_settings["confidence_threshold"]:
                    # המרה ליניארית של ביקוש לעובדים
                    required_staff = max(
                        default_settings["min_staff_per_hour"],
                        int(demand / default_settings["demand_per_staff"])
                    )
                    
                    # הגבלה למקסימום
                    required_staff = min(required_staff, default_settings["max_staff_per_hour"])
                    
                    return required_staff
                else:
                    # ביטחון נמוך - שימוש בfallback
                    self.alerts.append(Alert(
                        type="low_confidence_forecast",
                        severity="warning",
                        message=f"ביטחון נמוך בתחזית ({confidence:.2f}) עבור {target_date} שעה {hour}",
                        details={"date": target_date, "hour": hour, "confidence": confidence}
                    ))
        
        # Fallback: שימוש בלוגיקה הקודמת
        return self.demand_to_staff(hour, datetime.strptime(target_date, "%Y-%m-%d").weekday(), None)
    
    def pick_employees_greedy(self, 
                            available_employees: List[Employee],
                            availability_slots: List[AvailabilitySlot],
                            required_count: int,
                            target_day: int,
                            target_hour: int) -> List[Employee]:
        """
        Greedy employee selection: prefer lower cost, respect availability
        """
        suitable_employees = []
        
        for emp in available_employees:
            # Check if employee is available at this time
            for slot in availability_slots:
                if (slot.employee_id == emp.id and 
                    slot.day_of_week == target_day and
                    slot.is_available):
                    
                    # Check if target hour falls within availability window
                    target_time = time(target_hour, 0)
                    
                    # Handle overnight shifts
                    if slot.start_time <= slot.end_time:
                        # Normal shift (same day)
                        if slot.start_time <= target_time <= slot.end_time:
                            suitable_employees.append((emp, emp.hourly_rate))
                    else:
                        # Overnight shift (crosses midnight)
                        if target_time >= slot.start_time or target_time <= slot.end_time:
                            suitable_employees.append((emp, emp.hourly_rate))
                    break
        
        # Sort by hourly rate (greedy: cheapest first)
        suitable_employees.sort(key=lambda x: x[1])
        
        # Return required count, or all available if not enough
        selected_count = min(required_count, len(suitable_employees))
        if selected_count < required_count:
            self.alerts.append(Alert(
                type='insufficient_staff',
                severity='warning',
                message=f'רק {selected_count} עובדים זמינים מתוך {required_count} נדרשים',
                details={'day': target_day, 'hour': target_hour, 'available': selected_count, 'required': required_count}
            ))
        
        return [emp for emp, rate in suitable_employees[:selected_count]]
    
    def merge_hours_to_shifts(self, 
                            employee_assignments: Dict[str, List[Tuple[int, int]]], # employee_id -> [(day, hour), ...]
                            employees: List[Employee]) -> List[Shift]:
        """
        Merge contiguous hours into shifts, allow overnight shifts
        """
        shifts = []
        employee_dict = {emp.id: emp for emp in employees}
        
        for emp_id, hours in employee_assignments.items():
            if not hours:
                continue
                
            employee = employee_dict.get(emp_id)
            if not employee:
                continue
                
            # Group hours by day
            hours_by_day = {}
            for day, hour in hours:
                if day not in hours_by_day:
                    hours_by_day[day] = []
                hours_by_day[day].append(hour)
            
            # Process each day
            for day, day_hours in hours_by_day.items():
                day_hours.sort()
                
                # Create longer continuous shifts by filling gaps up to 3 hours
                if not day_hours:
                    continue
                    
                # Sort hours and create continuous ranges
                day_hours.sort()
                continuous_ranges = []
                current_range = [day_hours[0]]
                
                for hour in day_hours[1:]:
                    # If gap is 3 hours or less, extend current range
                    if hour <= current_range[-1] + 4:  # Allow gaps up to 3 hours
                        # Fill in the gap
                        for fill_hour in range(current_range[-1] + 1, hour + 1):
                            if fill_hour not in current_range:
                                current_range.append(fill_hour)
                    else:
                        # Gap too large, start new range
                        continuous_ranges.append(current_range)
                        current_range = [hour]
                
                # Add final range
                if current_range:
                    continuous_ranges.append(current_range)
                
                # Create shifts from continuous ranges
                for hours_range in continuous_ranges:
                    if len(hours_range) >= 1:  # Minimum shift length
                        shift = self._create_shift(emp_id, day, hours_range[0], hours_range, employee)
                        shifts.append(shift)
        
        return shifts
    
    def _create_shift(self, emp_id: str, day: int, start_hour: int, hours: List[int], employee: Employee) -> Shift:
        """Create a shift from list of hours"""
        shift_date = self._get_date_for_day(day)
        start_time = time(start_hour, 0)
        end_hour = hours[-1] + 1  # End of last hour
        
        # Handle overnight shifts
        if end_hour >= 24:
            end_time = time(end_hour - 24, 0)
        else:
            end_time = time(end_hour, 0)
        
        # Calculate shift details
        total_hours = len(hours)
        break_minutes = max(0, (total_hours - 4) * 15)  # 15min break per 4+ hours
        work_minutes = total_hours * 60 - break_minutes
        total_cost = (work_minutes / 60) * employee.hourly_rate
        
        # Check budget constraint
        if self.current_cost + total_cost > self.weekly_budget:
            self.alerts.append(Alert(
                type='budget_exceeded',
                severity='critical',
                message=f'תקציב חרג: ₪{self.current_cost + total_cost:.2f} מתוך ₪{self.weekly_budget:.2f}',
                details={'current_cost': self.current_cost, 'shift_cost': total_cost, 'budget': self.weekly_budget}
            ))
            # Still create the shift but mark as over budget
            
        self.current_cost += total_cost
        
        return Shift(
            id=str(uuid.uuid4()),
            employee_id=emp_id,
            date=shift_date,
            start_time=start_time,
            end_time=end_time,
            break_minutes=break_minutes,
            hourly_rate=employee.hourly_rate,
            total_cost=total_cost
        )
    
    def _get_date_for_day(self, day_of_week: int) -> date:
        """Convert day of week to actual date (for current week)"""
        today = date.today()
        days_since_sunday = (today.weekday() + 1) % 7  # Convert to Sunday=0
        sunday = today - timedelta(days=days_since_sunday)
        return sunday + timedelta(days=day_of_week)
    
    def generate_schedule(self,
                         employees: List[Employee],
                         availability: List[AvailabilitySlot],
                         forecast_data: Optional[Dict] = None) -> Tuple[List[Shift], List[Alert]]:
        """
        Main schedule generation logic
        Returns: (shifts, alerts)
        """
        self.current_cost = 0.0
        self.alerts = []
        employee_assignments = {emp.id: [] for emp in employees}
        
        # Generate schedule for each day and hour
        for day in range(7):  # Sunday to Saturday
            for hour in range(24):
                required_staff = self.demand_to_staff(hour, day, forecast_data)
                
                if required_staff == 0:
                    continue  # Skip closed hours
                
                # Get available employees for this slot
                selected_employees = self.pick_employees_greedy(
                    employees, availability, required_staff, day, hour
                )
                
                # Assign employees to this hour
                for emp in selected_employees:
                    employee_assignments[emp.id].append((day, hour))
        
        # Convert hour assignments to shifts
        shifts = self.merge_hours_to_shifts(employee_assignments, employees)
        
        return shifts, self.alerts
