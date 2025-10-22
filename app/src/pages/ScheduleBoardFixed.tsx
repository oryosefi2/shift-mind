import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';

interface Employee {
  id: string;
  name: string;
  hourlyRate: number;
  role: string;
  color: string;
  avatar: string;
}

interface Shift {
  id: string;
  employeeId: string;
  day: number;
  startHour: number;
  endHour: number;
  cost?: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

interface DragState {
  isDragging: boolean;
  draggedShift: Shift | null;
  dragOffset: { x: number; y: number };
}

function ScheduleBoard() {
  const { success, error, warning } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);

  const [employees] = useState<Employee[]>([
    {
      id: '1',
      name: 'שרה כהן',
      hourlyRate: 45,
      role: 'מנהלת צוות',
      color: '#3b82f6',
      avatar: '👩‍💼'
    },
    {
      id: '2',
      name: 'דוד לוי',
      hourlyRate: 38,
      role: 'עובד בכיר',
      color: '#10b981',
      avatar: '👨‍💻'
    },
    {
      id: '3',
      name: 'מיכל אברהם',
      hourlyRate: 35,
      role: 'עובדת',
      color: '#f59e0b',
      avatar: '👩‍🔬'
    },
    {
      id: '4',
      name: 'יוסי דהן',
      hourlyRate: 42,
      role: 'מנהל תפעול',
      color: '#8b5cf6',
      avatar: '👨‍💼'
    }
  ]);

  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: '1',
      employeeId: '1',
      day: 0,
      startHour: 8,
      endHour: 16,
      cost: 360
    },
    {
      id: '2',
      employeeId: '2',
      day: 1,
      startHour: 9,
      endHour: 17,
      cost: 304
    }
  ]);

  const [weeklyBudget] = useState(15000);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedShift: null,
    dragOffset: { x: 0, y: 0 }
  });
  const [isManagementToolsOpen, setIsManagementToolsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'warning',
      message: 'חסרה כיסוי לשעות 22:00-06:00 ביום רביעי',
      timestamp: '2025-10-22T14:30:00Z'
    },
    {
      id: '2',
      type: 'error',
      message: 'חריגה מתקציב שבועי ב-15%',
      timestamp: '2025-10-22T10:15:00Z'
    },
    {
      id: '3',
      type: 'info',
      message: 'נדרש אישור מנהל לשעות נוספות',
      timestamp: '2025-10-22T09:00:00Z'
    }
  ]);

  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200/60 bg-red-50/40';
      case 'warning':
        return 'border-orange-200/60 bg-orange-50/40';
      default:
        return 'border-blue-200/60 bg-blue-50/40';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const renderShift = useCallback((shift: Shift) => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    if (!employee) return null;

    const height = (shift.endHour - shift.startHour) * 40;
    const top = shift.startHour * 40;

    return (
      <div
        key={shift.id}
        className="absolute left-1 right-1 rounded-lg border-2 border-white shadow-sm cursor-move hover:shadow-md transition-shadow duration-200 flex flex-col justify-center items-center text-xs font-medium text-white px-2"
        style={{
          backgroundColor: employee.color,
          height: `${height}px`,
          top: `${top}px`,
          minHeight: '32px',
        }}
      >
        <div className="text-center">
          <div>{employee.avatar}</div>
          <div className="truncate">{employee.name}</div>
          <div className="text-xs opacity-90">
            {String(shift.startHour).padStart(2, '0')}:00-{String(shift.endHour).padStart(2, '0')}:00
          </div>
        </div>
      </div>
    );
  }, [employees]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Mouse move handler
  }, []);

  const handleMouseUp = useCallback(() => {
    // Mouse up handler
  }, []);

  // Action handlers
  const createWeeklySchedule = () => {
    success('🎯 נוצר סידור שבועי בהצלחה');
  };

  const fitToBudget = () => {
    warning('🎯 התאמת המשמרות לתקציב...');
  };

  const smartRecommendations = () => {
    success('🧠 ההמלצות החכמות מוכנות');
  };

  const createPeakHoursSchedule = () => {
    success('🔥 נוצר סידור שעות עומס');
  };

  const analyzeAndPredict = () => {
    success('📊 ניתוח AI הושלם');
  };

  const autoBalance = () => {
    success('⚖️ איזון עומסים הושלם');
  };

  const duplicateWeek = () => {
    success('📋 השבוע שוכפל בהצלחה');
  };

  const optimizeSchedule = () => {
    success('⚡ אופטימיזציה הושלמה');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Main Layout Container */}
      <div className="flex">
        {/* Left Sidebar - Alerts Panel */}
        <AnimatePresence>
          {(isDesktop || isSidebarOpen) && (
            <motion.div
              initial={{ x: isDesktop ? 0 : -320, opacity: isDesktop ? 1 : 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${
                isDesktop ? 'relative' : 'fixed z-50'
              } w-80 h-screen bg-white shadow-lg border-l border-gray-200/60 overflow-y-auto`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200/60 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100/80 flex items-center justify-center">
                      <span className="text-gray-600">🔔</span>
                    </div>
                    <span className="font-medium text-gray-700">התראות ואזהרות</span>
                    <div className="w-5 h-5 rounded-full bg-orange-100/80 text-orange-600 text-xs flex items-center justify-center font-medium">
                      {alerts.length}
                    </div>
                  </div>
                  {!isDesktop && (
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 hover:bg-gray-200/60 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Alerts Content */}
              <div className="p-4">
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-sm">{getAlertIcon(alert.type)}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString('he-IL')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Quick Actions */}
                <div className="mt-6 pt-4 border-t border-gray-100/80 space-y-2">
                  <h5 className="font-medium text-gray-600 text-sm">פעולות מהירות</h5>
                  
                  <button
                    onClick={fitToBudget}
                    className="w-full px-3 py-2 bg-gray-100/80 text-gray-700 rounded-lg hover:bg-gray-200/60 transition-colors text-sm"
                  >
                    🎯 התאם לתקציב
                  </button>
                  
                  <button
                    onClick={smartRecommendations}
                    className="w-full px-3 py-2 bg-gray-100/80 text-gray-700 rounded-lg hover:bg-gray-200/60 transition-colors text-sm"
                  >
                    🧠 המלצות חכמות
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay for mobile sidebar */}
        {!isDesktop && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header with Stats */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">לוח סידור משמרות חכם</h1>
                  <p className="text-gray-600 mt-1">ניהול וסידור משמרות עם גרירה ושחרור, מעקב תקציב ובינה מלאכותית</p>
                </div>
                <div className="flex items-center gap-3">
                  {!isDesktop && (
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={createWeeklySchedule}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    🎯 צור סידור שבועי
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <span className="text-blue-600">👥</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">עובדים מתוזמנים</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {new Set(shifts.map(s => s.employeeId)).size} מתוך {employees.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <span className="text-green-600">💰</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">עלות שבועית</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ₪{shifts.reduce((sum, shift) => sum + (shift.cost || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <span className="text-orange-600">⚠️</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">התראות פעילות</p>
                      <p className="text-xl font-semibold text-gray-900">{alerts.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Tools - Collapsible Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 mb-6">
              <button
                onClick={() => setIsManagementToolsOpen(!isManagementToolsOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100/80 flex items-center justify-center">
                    <span className="text-gray-600">⚙️</span>
                  </div>
                  <span className="font-medium text-gray-700">כלי ניהול נוספים</span>
                </div>
                <div className={`transform transition-transform ${isManagementToolsOpen ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {isManagementToolsOpen && (
                <div className="px-4 pb-4 border-t border-gray-100/80 pt-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      onClick={createPeakHoursSchedule}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/60 transition-all duration-200 group"
                    >
                      <div className="text-lg text-gray-600">🔥</div>
                      <div className="text-right">
                        <div className="font-medium text-gray-700 text-sm">שעות עומס</div>
                        <div className="text-xs text-gray-500">כיסוי שעות עמוסות</div>
                      </div>
                    </button>

                    <button
                      onClick={analyzeAndPredict}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/60 transition-all duration-200 group"
                    >
                      <div className="text-lg text-gray-600">📊</div>
                      <div className="text-right">
                        <div className="font-medium text-gray-700 text-sm">ניתוח AI</div>
                        <div className="text-xs text-gray-500">תחזיות וסטטיסטיקות</div>
                      </div>
                    </button>

                    <button
                      onClick={autoBalance}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/60 transition-all duration-200 group"
                    >
                      <div className="text-lg text-gray-600">⚖️</div>
                      <div className="text-right">
                        <div className="font-medium text-gray-700 text-sm">איזון עומסים</div>
                        <div className="text-xs text-gray-500">חלוקה הוגנת</div>
                      </div>
                    </button>

                    <button
                      onClick={optimizeSchedule}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/60 transition-all duration-200 group"
                    >
                      <div className="text-lg text-gray-600">⚡</div>
                      <div className="text-right">
                        <div className="font-medium text-gray-700 text-sm">אופטימיזציה</div>
                        <div className="text-xs text-gray-500">הפחת עלויות</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Schedule Board - Centered and Narrower */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">לוח משמרות שבועי</h2>
                  
                  {/* Budget Display */}
                  <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">תקציב שבועי:</div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-gray-900">
                        ₪{shifts.reduce((sum, shift) => sum + (shift.cost || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">/ ₪{weeklyBudget.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Schedule Grid Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div
                    ref={gridRef}
                    className="relative"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Days Header */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                      {days.map((day, index) => (
                        <div key={day} className="p-4 text-center font-semibold text-gray-700 border-l border-gray-200">
                          {day}
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-7 relative min-h-[960px]">
                      {Array.from({ length: 7 }).map((_, dayIndex) => (
                        <div key={dayIndex} className="border-l border-gray-200 relative">
                          {/* Hour lines */}
                          {hours.map(hour => (
                            <div
                              key={hour}
                              className="border-b border-gray-100 h-10 relative"
                            >
                              {dayIndex === 0 && (
                                <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 w-10 text-left">
                                  {String(hour).padStart(2, '0')}:00
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Shifts for this day */}
                          <div className="absolute inset-0 top-0">
                            {shifts
                              .filter(shift => shift.day === dayIndex)
                              .map(shift => renderShift(shift))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Legend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 mt-6 max-w-6xl mx-auto">
              <h3 className="text-base font-medium text-gray-700 mb-3">עובדים במערכת</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {employees.map(employee => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-200/50 hover:bg-gray-50/60 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: employee.color }}
                    ></div>
                    <div>
                      <div className="font-medium text-sm text-gray-700">{employee.avatar} {employee.name}</div>
                      <div className="text-xs text-gray-500">₪{employee.hourlyRate}/שעה</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drag overlay */}
            {dragState.isDragging && (
              <div className="fixed inset-0 pointer-events-none z-50"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleBoard;
