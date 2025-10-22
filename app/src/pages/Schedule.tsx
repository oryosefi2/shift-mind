// Copilot: weekly board (read-only MVP), total cost, budget bar, alerts panel (RTL).
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

interface Shift {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  hourly_rate: number;
  total_cost: number;
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  details: any;
}

interface ScheduleData {
  schedule_id: string;
  week_start: string;
  total_cost: number;
  budget_utilization: number;
  shifts: Shift[];
  alerts: Alert[];
  status: string;
}

const DAYS_OF_WEEK = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';

export function Schedule() {
  const { businessId } = useAuth();
  const { success, error: showError, warning } = useToast();
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState('');
  const [weeklyBudget, setWeeklyBudget] = useState(5000);
  const [minStaffPerHour, setMinStaffPerHour] = useState(1);
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Initialize current week
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    setCurrentWeek(`${year}-W${week.toString().padStart(2, '0')}`);
  }, []);

  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  const generateSchedule = async () => {
    if (!businessId || !currentWeek) {
      showError('אין מזהה עסק או שבוע נבחר');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedule/${currentWeek}/generate?business_id=${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekly_budget: weeklyBudget,
          min_staff_per_hour: minStaffPerHour,
          forecast_data: null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setScheduleData(data);
      success('סידור נוצר בהצלחה!');
      
      if (data.alerts && data.alerts.length > 0) {
        data.alerts.forEach((alert: Alert) => {
          if (alert.severity === 'critical') {
            showError(alert.message);
          } else {
            warning(alert.message);
          }
        });
      }
      
    } catch (error) {
      console.error('Error generating schedule:', error);
      showError(`שגיאה ביצירת סידור: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    if (!businessId || !currentWeek) {
      showError('נדרש מזהה עסק ושבוע לחישוב תחזית');
      return;
    }

    setForecastLoading(true);
    
    try {
      // המרה מפורמט 2025-W43 ל-2025-43
      const formattedWeek = currentWeek.replace('W', '');
      
      const response = await fetch(
        `${API_BASE_URL}/api/forecast/${formattedWeek}/generate?business_id=${businessId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lookback_weeks: 8
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          setForecastData(result.data);
          success(`תחזית נוצרה בהצלחה לשבוע ${currentWeek}: ${result.data.forecast_summary.total_forecasts} רשומות`);
        } else {
          throw new Error(result.error?.message || 'שגיאה ביצירת תחזית');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || `שגיאה ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('Error generating forecast:', error);
      showError(`שגיאה ביצירת תחזית: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    } finally {
      setForecastLoading(false);
    }
  };

  const loadExistingSchedule = async () => {
    if (!businessId || !currentWeek) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/schedule/${currentWeek}?business_id=${businessId}`);
      
      if (response.ok) {
        const data = await response.json();
        setScheduleData(data);
      }
    } catch (error) {
      console.log('No existing schedule found for this week');
    }
  };

  useEffect(() => {
    if (currentWeek && businessId) {
      loadExistingSchedule();
    }
  }, [currentWeek, businessId]);

  const getShiftsForDay = (dayIndex: number): Shift[] => {
    if (!scheduleData) return [];
    
    const weekStart = new Date(scheduleData.week_start);
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    return scheduleData.shifts.filter(shift => shift.date === targetDateStr);
  };

  const renderShiftCard = (shift: Shift) => (
    <div key={shift.id} className="bg-blue-50 border border-blue-200 rounded p-2 mb-1 text-xs">
      <div className="font-medium text-blue-900">{shift.employee_name}</div>
      <div className="text-blue-700">
        {shift.start_time} - {shift.end_time}
      </div>
      <div className="text-blue-600">
        ₪{shift.total_cost.toFixed(2)}
        {shift.break_minutes > 0 && (
          <span className="text-gray-500"> (הפסקה: {shift.break_minutes}ד׳)</span>
        )}
      </div>
    </div>
  );

  const budgetColor = scheduleData 
    ? scheduleData.budget_utilization > 100 
      ? 'bg-red-500' 
      : scheduleData.budget_utilization > 80 
        ? 'bg-yellow-500' 
        : 'bg-green-500'
    : 'bg-gray-300';

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">תזמון משמרות</h1>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">יצירת סידור שבועי</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שבוע
              </label>
              <input
                type="text"
                value={currentWeek}
                onChange={(e) => setCurrentWeek(e.target.value)}
                placeholder="2025-W43"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תקציב שבועי (₪)
              </label>
              <input
                type="number"
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מינימום עובדים בשעה
              </label>
              <input
                type="number"
                min="1"
                value={minStaffPerHour}
                onChange={(e) => setMinStaffPerHour(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              {/* כפתור יצירת תחזית */}
              <button
                onClick={generateForecast}
                disabled={forecastLoading}
                className={`w-full px-4 py-2 mb-2 rounded-md font-medium transition-colors ${
                  forecastLoading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {forecastLoading ? 'מחשב תחזית...' : 'צור תחזית ביקוש'}
              </button>
              
              {/* כפתור יצירת סידור */}
              <button
                onClick={generateSchedule}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : forecastData 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                {loading 
                  ? 'מייצר סידור...' 
                  : forecastData 
                    ? 'צור סידור עבודה מבוסס תחזית' 
                    : 'צור סידור עבודה בסיסי'
                }
              </button>
            </div>
          </div>
          
          {/* הודעה מעודדת ליצירת תחזית */}
          {!forecastData && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <span className="text-yellow-600 text-lg mr-2">💡</span>
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    מומלץ ליצור תחזית ביקוש תחילה
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    התחזית תעזור ליצור סידור עבודה מיטבי המבוסס על צרכי הביקוש הצפויים
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* אזור מידע על תחזית */}
          {forecastData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-md font-medium text-green-800 mb-2">📊 תחזית ביקוש</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-green-600">שבוע:</span>
                  <div className="font-medium">{forecastData.forecast_summary?.target_week}</div>
                </div>
                <div>
                  <span className="text-green-600">תחזיות:</span>
                  <div className="font-medium">{forecastData.forecast_summary?.total_forecasts}</div>
                </div>
                <div>
                  <span className="text-green-600">ביטחון ממוצע:</span>
                  <div className="font-medium">{(forecastData.forecast_summary?.average_confidence * 100)?.toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-green-600">ביקוש שבועי:</span>
                  <div className="font-medium">{forecastData.forecast_summary?.summary?.total_weekly_demand?.toFixed(0)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {scheduleData && (
          <>
            {/* Budget Bar */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">סטטוס תקציב</h3>
              <div className="flex items-center justify-between mb-2">
                <span>עלות כוללת: ₪{scheduleData.total_cost.toFixed(2)}</span>
                <span>תקציב: ₪{weeklyBudget.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${budgetColor}`}
                  style={{ width: `${Math.min(scheduleData.budget_utilization, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                ניצול תקציב: {scheduleData.budget_utilization.toFixed(1)}%
              </div>
            </div>

            {/* Alerts Panel */}
            {scheduleData.alerts && scheduleData.alerts.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">התראות</h3>
                <div className="space-y-2">
                  {scheduleData.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 border border-red-200 text-red-800'
                          : alert.severity === 'warning'
                          ? 'bg-yellow-100 border border-yellow-200 text-yellow-800'
                          : 'bg-blue-100 border border-blue-200 text-blue-800'
                      }`}
                    >
                      <div className="font-medium">{alert.type}</div>
                      <div>{alert.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Schedule Board */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                סידור שבוע {scheduleData.week_start}
              </h3>
              
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((dayName, dayIndex) => (
                  <div key={dayIndex} className="min-h-96">
                    <div className="bg-gray-100 p-2 text-center font-medium rounded-t">
                      {dayName}
                    </div>
                    <div className="border border-gray-200 border-t-0 rounded-b p-2 min-h-80">
                      {getShiftsForDay(dayIndex).map(renderShiftCard)}
                      {getShiftsForDay(dayIndex).length === 0 && (
                        <div className="text-gray-500 text-sm text-center mt-8">
                          אין משמרות
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                סטטוס: {scheduleData.status === 'draft' ? 'טיוטה' : scheduleData.status}
                • סה"כ משמרות: {scheduleData.shifts.length}
              </div>
            </div>
          </>
        )}

        {!scheduleData && !loading && (
          <div className="text-center py-8 text-gray-500">
            בחר שבוע וצור סידור חדש
          </div>
        )}
      </div>
    </div>
  );
}
