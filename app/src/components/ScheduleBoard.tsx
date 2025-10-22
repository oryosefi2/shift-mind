// Copilot: dnd-kit; RTL; sticky headers; hour grid
import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Shift, Employee, useCostCalc } from '../hooks/useCostCalc';

interface ScheduleBoardProps {
  shifts: Shift[];
  employees: Employee[];
  budget?: number;
  onShiftMove?: (shiftId: string, newDate: string, newStartTime: string) => void;
  onShiftUpdate?: (shift: Shift) => void;
  weekStart?: Date; // If not provided, will use current week
}

interface ShiftItem {
  shift: Shift;
  employee: Employee;
}

// Helper functions
const formatTime = (time: string): string => {
  return time.slice(0, 5); // HH:MM format
};

const getWeekDays = (startDate: Date): Date[] => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatDayHeader = (date: Date): string => {
  const days = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];
  return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
};

const generateHours = (): string[] => {
  const hours = [];
  for (let i = 6; i < 24; i++) { // 06:00 to 23:00
    hours.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return hours;
};

// Draggable Shift Component
const DraggableShift: React.FC<{ 
  shift: Shift; 
  employee: Employee;
  isOverlay?: boolean;
}> = ({ shift, employee, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shift.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const duration = useMemo(() => {
    const start = new Date(`1970-01-01T${shift.start_time}`);
    const end = new Date(`1970-01-01T${shift.end_time}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const durationMs = end.getTime() - start.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    const breakHours = shift.break_minutes / 60;
    return Math.max(0, hours - breakHours);
  }, [shift]);

  const cost = duration * shift.hourly_rate;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-blue-100 border border-blue-300 rounded-md p-2 m-1 cursor-grab
        shadow-sm hover:shadow-md transition-shadow
        ${isDragging ? 'rotate-2' : ''}
        ${isOverlay ? 'rotate-2 shadow-lg bg-blue-200' : ''}
        min-h-[60px] text-sm
      `}
    >
      <div className="font-semibold text-blue-800 mb-1">
        {employee.first_name} {employee.last_name}
      </div>
      <div className="text-xs text-gray-600">
        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
      </div>
      <div className="text-xs text-gray-500">
        {duration.toFixed(1)}ש | ₪{cost.toFixed(0)}
      </div>
      {shift.break_minutes > 0 && (
        <div className="text-xs text-orange-600">
          הפסקה: {shift.break_minutes}ד
        </div>
      )}
    </div>
  );
};

// Droppable Day Column
const DayColumn: React.FC<{
  date: Date;
  shifts: ShiftItem[];
  hours: string[];
}> = ({ date, shifts, hours }) => {
  const dateStr = formatDate(date);
  
  return (
    <div className="flex-1 min-w-[200px] border-r border-gray-200">
      {/* Day Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-3 text-center font-semibold text-gray-700 z-10">
        {formatDayHeader(date)}
      </div>
      
      {/* Hours Grid */}
      <div className="relative">
        {hours.map((hour) => (
          <div
            key={hour}
            className="h-16 border-b border-gray-100 relative"
            data-hour={hour}
            data-date={dateStr}
          >
            {/* Hour label - only on first column */}
            <div className="absolute left-2 top-2 text-xs text-gray-400">
              {hour}
            </div>
          </div>
        ))}
        
        {/* Shifts positioned absolutely */}
        <div className="absolute top-0 left-0 right-0">
          {shifts.map(({ shift, employee }) => (
            <DraggableShift
              key={shift.id}
              shift={shift}
              employee={employee}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Budget Display Component
const BudgetDisplay: React.FC<{
  budget: {
    total: number;
    used: number;
    remaining: number;
    usagePercentage: number;
    status: 'normal' | 'warning' | 'over';
  };
}> = ({ budget }) => {
  const getStatusColor = () => {
    switch (budget.status) {
      case 'over': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">תקציב ועלויות</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            ₪{budget.used.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">עלות נוכחית</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            ₪{budget.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">תקציב כולל</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${getStatusColor().split(' ')[0]}`}>
            ₪{budget.remaining.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">יתרה</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${getStatusColor().split(' ')[0]}`}>
            {budget.usagePercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">ניצול תקציב</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>ניצול תקציב</span>
          <span>{budget.usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              budget.status === 'over' ? 'bg-red-500' :
              budget.status === 'warning' ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, budget.usagePercentage)}%` }}
          />
        </div>
        {budget.status === 'over' && (
          <div className="text-red-600 text-sm mt-1">
            חריגה מהתקציב: ₪{Math.abs(budget.remaining).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

// Main ScheduleBoard Component
export const ScheduleBoard: React.FC<ScheduleBoardProps> = ({
  shifts,
  employees,
  budget = 0,
  onShiftMove,
  weekStart
}) => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    if (weekStart) return weekStart;
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    return sunday;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const hours = useMemo(() => generateHours(), []);

  // Filter shifts for current week
  const weekShifts = useMemo(() => {
    const weekStart = formatDate(weekDays[0]);
    const weekEnd = formatDate(weekDays[6]);
    
    return shifts.filter(shift => {
      return shift.date >= weekStart && shift.date <= weekEnd;
    });
  }, [shifts, weekDays]);

  // Create shift items with employee data
  const shiftItems = useMemo(() => {
    return weekShifts.map(shift => {
      const employee = employees.find(emp => emp.id === shift.employee_id);
      return { shift, employee: employee || { id: '', first_name: 'לא ידוע', last_name: '', hourly_rate: 0 } };
    });
  }, [weekShifts, employees]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, ShiftItem[]> = {};
    weekDays.forEach(day => {
      const dateStr = formatDate(day);
      grouped[dateStr] = shiftItems.filter(item => item.shift.date === dateStr);
    });
    return grouped;
  }, [shiftItems, weekDays]);

  // Use cost calculation hook
  const costData = useCostCalc({ shifts: weekShifts, employees, budget });

  const handleDragStart = (event: DragStartEvent) => {
    const shift = shifts.find(s => s.id === event.active.id);
    setActiveShift(shift || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveShift(null);

    if (!over) return;

    const shiftId = active.id as string;
    const shift = shifts.find(s => s.id === shiftId);
    
    if (!shift) return;

    // Parse drop target (could be date, hour, or another shift)
    const overData = over.data?.current;
    
    if (overData?.type === 'day-column') {
      const newDate = overData.date;
      if (newDate !== shift.date) {
        onShiftMove?.(shiftId, newDate, shift.start_time);
      }
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newStart);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">לוח משמרות</h2>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              ← שבוע קודם
            </button>
            
            <div className="text-lg font-semibold">
              {weekDays[0].toLocaleDateString('he-IL')} - {weekDays[6].toLocaleDateString('he-IL')}
            </div>
            
            <button
              onClick={() => navigateWeek('next')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              שבוע הבא →
            </button>
          </div>
        </div>

        {/* Budget Display */}
        <BudgetDisplay budget={costData.budget} />
      </div>

      {/* Schedule Grid */}
      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex min-h-full">
            {/* Hour Labels Column */}
            <div className="w-20 border-r border-gray-200 bg-gray-50 sticky right-0 z-20">
              <div className="h-[73px] border-b border-gray-200 bg-white"></div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-gray-100 flex items-center justify-center text-sm font-medium text-gray-600"
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex flex-1">
              {weekDays.map((day) => (
                <SortableContext
                  key={formatDate(day)}
                  id={formatDate(day)}
                  items={shiftsByDate[formatDate(day)]?.map(item => item.shift.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <DayColumn
                    date={day}
                    shifts={shiftsByDate[formatDate(day)] || []}
                    hours={hours}
                  />
                </SortableContext>
              ))}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeShift ? (
              <DraggableShift
                shift={activeShift}
                employee={employees.find(e => e.id === activeShift.employee_id) || { id: '', first_name: 'לא ידוע', last_name: '', hourly_rate: 0 }}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
