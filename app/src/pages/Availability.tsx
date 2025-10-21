// Copilot: availability list + form (create/edit) in RTL.
// Employee select (load from employees by businessId), weekday select (0-6), TimeRangeField, is_available checkbox.
// Filters: by employee and day_of_week. Pagination. Zod validations and toasts.

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { availabilityApi, type Availability, AvailabilityCreatePayload, AvailabilityUpdatePayload } from '../api/availability';
import { employeeApi, Employee } from '../api/employees';
import { DataTable, Column } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { TimeRangeField } from '../components/TimeRangeField';
import { useToast } from '../components/Toast';

const weekDays = [
  { value: 0, label: 'ראשון' },
  { value: 1, label: 'שני' },
  { value: 2, label: 'שלישי' },
  { value: 3, label: 'רביעי' },
  { value: 4, label: 'חמישי' },
  { value: 5, label: 'שישי' },
  { value: 6, label: 'שבת' },
];

const availabilitySchema = z.object({
  employee_id: z.string().min(1, 'חובה לבחור עובד'),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().min(1, 'שעת התחלה חובה'),
  end_time: z.string().min(1, 'שעת סיום חובה'),
  is_available: z.boolean(),
  effective_from: z.string().optional(),
  effective_until: z.string().optional(),
}).refine((data) => data.start_time !== data.end_time, {
  message: 'שעת התחלה ושעת הסיום לא יכולות להיות זהות',
  path: ['end_time'],
});

type AvailabilityForm = z.infer<typeof availabilitySchema>;

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  availability?: Availability | null;
  onSuccess: () => void;
}

function AvailabilityModal({ isOpen, onClose, availability, onSuccess }: AvailabilityModalProps) {
  const { businessId } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      is_available: true,
      day_of_week: 0,
    },
  });

  const startTime = watch('start_time');
  const endTime = watch('end_time');

  useEffect(() => {
    if (businessId) {
      loadEmployees();
    }
  }, [businessId]);

  useEffect(() => {
    if (availability) {
      reset({
        employee_id: availability.employee_id,
        day_of_week: availability.day_of_week,
        start_time: availability.start_time,
        end_time: availability.end_time,
        is_available: availability.is_available,
        effective_from: availability.effective_from || '',
        effective_until: availability.effective_until || '',
      });
    } else {
      reset({
        employee_id: '',
        day_of_week: 0,
        start_time: '',
        end_time: '',
        is_available: true,
        effective_from: '',
        effective_until: '',
      });
    }
  }, [availability, reset]);

  const loadEmployees = async () => {
    if (!businessId) return;

    try {
      const response = await employeeApi.list({
        businessId,
        page: 1,
        page_size: 100,
        status: 'active',
      });
      setEmployees(response.employees);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const onSubmit = async (data: AvailabilityForm) => {
    if (!businessId) return;

    setLoading(true);
    try {
      if (availability) {
        const updatePayload: AvailabilityUpdatePayload = {
          employee_id: data.employee_id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          is_available: data.is_available,
          effective_from: data.effective_from || undefined,
          effective_until: data.effective_until || undefined,
        };
        await availabilityApi.update(availability.id, updatePayload);
        success('זמינות עודכנה בהצלחה');
      } else {
        const createPayload: AvailabilityCreatePayload = {
          employee_id: data.employee_id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          is_available: data.is_available,
          effective_from: data.effective_from || undefined,
          effective_until: data.effective_until || undefined,
        };
        await availabilityApi.create(businessId, createPayload);
        success('זמינות נוספה בהצלחה');
      }

      onSuccess();
      onClose();
    } catch (err) {
      error(availability ? 'שגיאה בעדכון הזמינות' : 'שגיאה בהוספת הזמינות');
      console.error('Error saving availability:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {availability ? 'עריכת זמינות' : 'הוספת זמינות חדשה'}
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="עובד"
              error={errors.employee_id?.message}
              required
            >
              <select
                {...register('employee_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              >
                <option value="">בחר עובד...</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="יום בשבוע"
              error={errors.day_of_week?.message}
              required
            >
              <select
                {...register('day_of_week', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              >
                {weekDays.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </FormField>

            <TimeRangeField
              label="טווח שעות"
              startTime={startTime || ''}
              endTime={endTime || ''}
              onStartTimeChange={(time) => setValue('start_time', time, { shouldValidate: true })}
              onEndTimeChange={(time) => setValue('end_time', time, { shouldValidate: true })}
              startError={errors.start_time?.message}
              endError={errors.end_time?.message}
              required
            />

            <FormField label="זמין לעבודה">
              <div className="flex items-center" dir="rtl">
                <input
                  {...register('is_available')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
                />
                <span className="text-sm text-gray-700">העובד זמין לעבודה בשעות אלו</span>
              </div>
            </FormField>

            <FormField
              label="תאריך תחילת תוקף"
              error={errors.effective_from?.message}
            >
              <input
                {...register('effective_from')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </FormField>

            <FormField
              label="תאריך סיום תוקף"
              error={errors.effective_until?.message}
            >
              <input
                {...register('effective_until')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </FormField>

            <div className="flex space-x-4 justify-end pt-4" dir="rtl">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Availability() {
  const { businessId } = useAuth();
  const { success, error } = useToast();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDay, setFilterDay] = useState<number | ''>('');

  useEffect(() => {
    if (businessId) {
      loadAvailability();
      loadEmployees();
    }
  }, [businessId, filterEmployee, filterDay]);

  const loadAvailability = async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      const response = await availabilityApi.list({
        businessId,
        employee_id: filterEmployee || undefined,
        day_of_week: filterDay !== '' ? filterDay : undefined,
        page: 1,
        page_size: 100,
      });
      setAvailability(response.availability);
    } catch (err) {
      error('שגיאה בטעינת רשימת הזמינות');
      console.error('Error loading availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!businessId) return;

    try {
      const response = await employeeApi.list({
        businessId,
        page: 1,
        page_size: 100,
        status: 'active',
      });
      setEmployees(response.employees);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleEdit = (availability: Availability) => {
    setSelectedAvailability(availability);
    setModalOpen(true);
  };

  const handleDelete = async (availability: Availability) => {
    const employee = employees.find(e => e.id === availability.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'העובד';
    const dayName = weekDays.find(d => d.value === availability.day_of_week)?.label || 'היום';
    
    if (!confirm(`האם אתה בטוח שברצונך למחוק את זמינות ${employeeName} ביום ${dayName}?`)) {
      return;
    }

    try {
      await availabilityApi.remove(availability.id);
      success('הזמינות נמחקה בהצלחה');
      await loadAvailability();
    } catch (err) {
      error('שגיאה במחיקת הזמינות');
      console.error('Error deleting availability:', err);
    }
  };

  const handleAddNew = () => {
    setSelectedAvailability(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadAvailability();
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : employeeId;
  };

  const getDayName = (dayOfWeek: number) => {
    return weekDays.find(d => d.value === dayOfWeek)?.label || dayOfWeek.toString();
  };

  const columns: Column<Availability>[] = [
    {
      key: 'employee_id',
      header: 'עובד',
      sortable: true,
      render: (value) => getEmployeeName(value),
    },
    {
      key: 'day_of_week',
      header: 'יום',
      sortable: true,
      render: (value) => getDayName(value),
    },
    {
      key: 'start_time',
      header: 'שעת התחלה',
      sortable: true,
    },
    {
      key: 'end_time',
      header: 'שעת סיום',
      sortable: true,
    },
    {
      key: 'is_available',
      header: 'זמין',
      sortable: true,
      render: (value) => value ? '✓ זמין' : '✗ לא זמין',
    },
    {
      key: 'effective_from',
      header: 'תוקף מתאריך',
      sortable: true,
      render: (value) => value || '-',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          הוסף זמינות חדשה
        </button>
        <h1 className="text-2xl font-bold text-gray-900">זמינות עובדים</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
              סינון לפי עובד
            </label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            >
              <option value="">כל העובדים</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
              סינון לפי יום
            </label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            >
              <option value="">כל הימים</option>
              {weekDays.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={availability}
        columns={columns}
        searchPlaceholder="חיפוש..."
        emptyMessage="אין זמינויות להצגה. הוסף זמינות חדשה כדי להתחיל."
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <AvailabilityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        availability={selectedAvailability}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
