import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { ScheduleBoard } from '../components/ScheduleBoard';
import { Shift, Employee } from '../hooks/useCostCalc';

const SchedulePage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [budget] = useState<number>(6500); // Default budget
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Mock employees data - Rich demo data
        const mockEmployees: Employee[] = [
          { id: '22222222-2222-2222-2222-222222222222', first_name: 'שרה', last_name: 'כהן', hourly_rate: 35.50 },
          { id: '33333333-3333-3333-3333-333333333333', first_name: 'יוסי', last_name: 'לוי', hourly_rate: 28.00 },
          { id: '44444444-4444-4444-4444-444444444444', first_name: 'דניאל', last_name: 'משה', hourly_rate: 32.00 },
          { id: '55555555-5555-5555-5555-555555555555', first_name: 'מיכל', last_name: 'אברהם', hourly_rate: 30.00 }
        ];

        // Mock shifts data for current week - Rich demo data
        const mockShifts: Shift[] = [
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
          {
            id: 'shift-3',
            employee_id: '55555555-5555-5555-5555-555555555555',
            date: '2025-10-20',
            start_time: '06:00:00',
            end_time: '14:00:00',
            break_minutes: 30,
            hourly_rate: 30.00,
            status: 'scheduled'
          },
          // Tuesday - 2025-10-21
          {
            id: 'shift-4',
            employee_id: '44444444-4444-4444-4444-444444444444',
            date: '2025-10-21',
            start_time: '10:00:00',
            end_time: '18:00:00',
            break_minutes: 60,
            hourly_rate: 32.00,
            status: 'scheduled'
          },
          {
            id: 'shift-5',
            employee_id: '22222222-2222-2222-2222-222222222222',
            date: '2025-10-21',
            start_time: '18:00:00',
            end_time: '23:00:00',
            break_minutes: 30,
            hourly_rate: 35.50,
            status: 'scheduled'
          },
          // Wednesday - 2025-10-22
          {
            id: 'shift-6',
            employee_id: '33333333-3333-3333-3333-333333333333',
            date: '2025-10-22',
            start_time: '08:00:00',
            end_time: '16:00:00',
            break_minutes: 45,
            hourly_rate: 28.00,
            status: 'scheduled'
          },
          {
            id: 'shift-7',
            employee_id: '55555555-5555-5555-5555-555555555555',
            date: '2025-10-22',
            start_time: '16:00:00',
            end_time: '23:00:00',
            break_minutes: 30,
            hourly_rate: 30.00,
            status: 'scheduled'
          },
          // Thursday - 2025-10-23
          {
            id: 'shift-8',
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
            id: 'shift-9',
            employee_id: '22222222-2222-2222-2222-222222222222',
            date: '2025-10-24',
            start_time: '08:00:00',
            end_time: '15:00:00',
            break_minutes: 30,
            hourly_rate: 35.50,
            status: 'scheduled'
          },
          {
            id: 'shift-10',
            employee_id: '33333333-3333-3333-3333-333333333333',
            date: '2025-10-24',
            start_time: '15:00:00',
            end_time: '21:00:00',
            break_minutes: 30,
            hourly_rate: 28.00,
            status: 'scheduled'
          }
        ];

        setEmployees(mockEmployees);
        setShifts(mockShifts);
        
      } catch (err) {
        setError('שגיאה בטעינת הנתונים');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleShiftMove = (shiftId: string, newDate: string, newStartTime: string) => {
    const shiftToMove = shifts.find(s => s.id === shiftId);
    const employeeName = shiftToMove ? 
      employees.find(e => e.id === shiftToMove.employee_id)?.first_name + ' ' + 
      employees.find(e => e.id === shiftToMove.employee_id)?.last_name : 'לא ידוע';

    setShifts(prev => prev.map(shift => 
      shift.id === shiftId 
        ? { ...shift, date: newDate, start_time: newStartTime }
        : shift
    ));
    
    // Show success message
    console.log('✅ Shift moved successfully:', { 
      shiftId, 
      employeeName, 
      newDate, 
      newStartTime,
      formattedDate: new Date(newDate).toLocaleDateString('he-IL')
    });
    
    // You could add a toast notification here in the future
    // For now, console log is sufficient for demo
  };

  const handleShiftUpdate = (updatedShift: Shift) => {
    setShifts(prev => prev.map(shift => 
      shift.id === updatedShift.id ? updatedShift : shift
    ));
    
    // TODO: Send update to API
    console.log('Updating shift:', updatedShift);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            נסה שנית
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full">
        <ScheduleBoard
          shifts={shifts}
          employees={employees}
          budget={budget}
          onShiftMove={handleShiftMove}
          onShiftUpdate={handleShiftUpdate}
        />
      </div>
    </Layout>
  );
};

export default SchedulePage;
