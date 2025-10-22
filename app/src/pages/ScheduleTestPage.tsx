import React, { useState } from 'react';
import { ScheduleBoard } from '../components/ScheduleBoard';
import { Shift, Employee } from '../hooks/useCostCalc';

const ScheduleTestPage: React.FC = () => {
  // Test data - more comprehensive than the original
  const [employees] = useState<Employee[]>([
    { id: '22222222-2222-2222-2222-222222222222', first_name: 'שרה', last_name: 'כהן', hourly_rate: 35.50 },
    { id: '33333333-3333-3333-3333-333333333333', first_name: 'יוסי', last_name: 'לוי', hourly_rate: 28.00 },
    { id: '44444444-4444-4444-4444-444444444444', first_name: 'דניאל', last_name: 'משה', hourly_rate: 32.00 }
  ]);

  const [shifts, setShifts] = useState<Shift[]>([
    // Sunday - 2025-10-19
    {
      id: 'shift-1',
      employee_id: '22222222-2222-2222-2222-222222222222',
      date: '2025-10-19',
      start_time: '08:00:00',
      end_time: '16:00:00',
      break_minutes: 60,
      hourly_rate: 35.50,
      status: 'scheduled'
    },
    // Monday - 2025-10-20  
    {
      id: 'shift-2',
      employee_id: '33333333-3333-3333-3333-333333333333',
      date: '2025-10-20',
      start_time: '14:00:00',
      end_time: '22:00:00',
      break_minutes: 30,
      hourly_rate: 28.00,
      status: 'scheduled'
    },
    // Tuesday - 2025-10-21
    {
      id: 'shift-3',
      employee_id: '44444444-4444-4444-4444-444444444444',
      date: '2025-10-21',
      start_time: '10:00:00',
      end_time: '18:00:00',
      break_minutes: 60,
      hourly_rate: 32.00,
      status: 'scheduled'
    },
    // Wednesday - 2025-10-22
    {
      id: 'shift-4',
      employee_id: '22222222-2222-2222-2222-222222222222',
      date: '2025-10-22',
      start_time: '06:00:00',
      end_time: '14:00:00',
      break_minutes: 30,
      hourly_rate: 35.50,
      status: 'scheduled'
    },
    {
      id: 'shift-5',
      employee_id: '33333333-3333-3333-3333-333333333333',
      date: '2025-10-22',
      start_time: '14:00:00',
      end_time: '22:00:00',
      break_minutes: 30,
      hourly_rate: 28.00,
      status: 'scheduled'
    },
    // Thursday - 2025-10-23
    {
      id: 'shift-6',
      employee_id: '44444444-4444-4444-4444-444444444444',
      date: '2025-10-23',
      start_time: '12:00:00',
      end_time: '20:00:00',
      break_minutes: 45,
      hourly_rate: 32.00,
      status: 'scheduled'
    },
    // Friday - 2025-10-24
    {
      id: 'shift-7',
      employee_id: '22222222-2222-2222-2222-222222222222',
      date: '2025-10-24',
      start_time: '08:00:00',
      end_time: '15:00:00',
      break_minutes: 30,
      hourly_rate: 35.50,
      status: 'scheduled'
    }
  ]);

  const [budget] = useState<number>(6000); // Generous budget for testing

  const handleShiftMove = (shiftId: string, newDate: string, newStartTime: string) => {
    console.log('🔄 DRAG & DROP TEST:', { shiftId, newDate, newStartTime });
    
    setShifts(prev => prev.map(shift => 
      shift.id === shiftId 
        ? { ...shift, date: newDate, start_time: newStartTime }
        : shift
    ));

    // Show success feedback
    alert(`✅ משמרת הועברה בהצלחה!\n📅 תאריך חדש: ${newDate}\n🕐 שעה חדשה: ${newStartTime}`);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header with test instructions */}
      <div className="bg-white border-b border-gray-200 p-6 mb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🧪 בדיקת לוח המשמרות</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">✋ איך לבדוק Drag & Drop:</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• לחץ והחזק על משמרת (הכרטיס הכחול)</li>
              <li>• גרור למיקום חדש בלוח</li>
              <li>• שחרר כדי להזיז</li>
              <li>• תקבל הודעה על ההעברה</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">📊 איך לבדוק חישוב עלויות:</h2>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• ראה עלויות בזמן אמת למעלה</li>
              <li>• גרור משמרת וראה עדכון מיידי</li>
              <li>• ניצול תקציב: צבע ירוק/כתום/אדום</li>
              <li>• פירוט לפי עובד ויום</li>
            </ul>
          </div>
        </div>
      </div>

      {/* The actual schedule board */}
      <div className="px-6">
        <ScheduleBoard
          shifts={shifts}
          employees={employees}
          budget={budget}
          onShiftMove={handleShiftMove}
        />
      </div>

      {/* Debug panel */}
      <div className="bg-white border-t border-gray-200 p-6 mt-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">🐛 נתוני Debug:</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <div>📈 סה"כ משמרות: {shifts.length}</div>
          <div>👥 סה"כ עובדים: {employees.length}</div>
          <div>💰 תקציב: ₪{budget.toLocaleString()}</div>
          <div>📅 שבוע נוכחי: 19-25 אוקטובר 2025</div>
        </div>
        
        <details className="mt-4">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
            📋 הצג נתוני משמרות גולמיים
          </summary>
          <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(shifts, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ScheduleTestPage;
