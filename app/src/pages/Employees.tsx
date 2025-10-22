import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { employeeApi, Employee, EmployeeCreatePayload, EmployeeUpdatePayload } from '../api/employees';
import { useToast } from '../components/Toast';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { Modal } from '../components/ui/Modal';

const employeeSchema = z.object({
  first_name: z.string()
    .min(2, 'שם פרטי חייב להכיל לפחות 2 תווים')
    .max(50, 'שם פרטי לא יכול להכיל יותר מ-50 תווים'),
  last_name: z.string()
    .min(2, 'שם משפחה חייב להכיל לפחות 2 תווים')
    .max(50, 'שם משפחה לא יכול להכיל יותר מ-50 תווים'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  phone: z.string().optional(),
  hire_date: z.string().optional(),
  hourly_rate: z.number()
    .min(0, 'שכר שעתי חייב להיות גדול או שווה ל-0')
    .nullable()
    .optional(),
  role: z.enum(['employee', 'manager']).refine((val) => ['employee', 'manager'].includes(val), {
    message: 'תפקיד חייב להיות עובד או מנהל'
  }),
  skills: z.array(z.string()).optional(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess: () => void;
}

function EmployeeModal({ isOpen, onClose, employee, onSuccess }: EmployeeModalProps) {
  const { businessId } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: 'employee',
      skills: [],
    },
  });

  const skills = watch('skills');

  useEffect(() => {
    if (employee) {
      reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        hire_date: employee.hire_date || '',
        hourly_rate: employee.hourly_rate || null,
        role: employee.role,
        skills: employee.skills || [],
      });
    } else {
      reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        hire_date: '',
        hourly_rate: null,
        role: 'employee',
        skills: [],
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data: EmployeeForm) => {
    if (!businessId) return;

    setLoading(true);
    try {
      if (employee) {
        const updatePayload: EmployeeUpdatePayload = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || undefined,
          hire_date: data.hire_date || undefined,
          hourly_rate: data.hourly_rate || undefined,
          role: data.role,
          skills: data.skills || [],
        };
        await employeeApi.update(employee.id, updatePayload);
        success('עובד עודכן בהצלחה');
      } else {
        const createPayload: EmployeeCreatePayload = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || undefined,
          hire_date: data.hire_date || undefined,
          hourly_rate: data.hourly_rate || undefined,
          role: data.role,
          skills: data.skills || [],
        };
        await employeeApi.create(businessId, createPayload);
        success('עובד נוסף בהצלחה');
      }      onSuccess();
      onClose();
    } catch (err) {
      error(employee ? 'שגיאה בעדכון העובד' : 'שגיאה בהוספת העובד');
      console.error('Error saving employee:', err);
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
              {employee ? 'עריכת עובד' : 'הוספת עובד חדש'}
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="שם פרטי"
              error={errors.first_name?.message}
              required
            >
              <input
                {...register('first_name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              />
            </FormField>

            <FormField
              label="שם משפחה"
              error={errors.last_name?.message}
              required
            >
              <input
                {...register('last_name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              />
            </FormField>

            <FormField
              label="אימייל"
              error={errors.email?.message}
              required
            >
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              />
            </FormField>

            <FormField
              label="טלפון"
              error={errors.phone?.message}
            >
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              />
            </FormField>

            <FormField
              label="תאריך תחילת עבודה"
              error={errors.hire_date?.message}
            >
              <input
                {...register('hire_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </FormField>

            <FormField
              label="שכר שעתי"
              error={errors.hourly_rate?.message}
            >
              <input
                {...register('hourly_rate', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              />
            </FormField>

            <FormField
              label="תפקיד"
              error={errors.role?.message}
              required
            >
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              >
                <option value="employee">עובד</option>
                <option value="manager">מנהל</option>
              </select>
            </FormField>

            <JsonField
              label="כישורים"
              value={skills}
              onChange={(value) => setValue('skills', value)}
              helperText="רשימת כישורים בפורמט JSON, למשל: [&quot;קופה&quot;, &quot;מכירות&quot;, &quot;שירות לקוחות&quot;]"
              rows={3}
            />

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

export default function Employees() {
  const { businessId } = useAuth();
  const { success, error } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (businessId) {
      loadEmployees();
    }
  }, [businessId]);

  const loadEmployees = async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      const response = await employeeApi.list({
        businessId,
        page: 1,
        page_size: 100, // Get all employees for now
      });
      setEmployees(response.employees);
    } catch (err) {
      error('שגיאה בטעינת רשימת העובדים');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }

    try {
      await employeeApi.remove(employee.id);
      success('העובד נמחק בהצלחה');
      await loadEmployees();
    } catch (err) {
      error('שגיאה במחיקת העובד');
      console.error('Error deleting employee:', err);
    }
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadEmployees();
  };

  const columns: Column<Employee>[] = [
    {
      key: 'first_name',
      header: 'שם פרטי',
      sortable: true,
    },
    {
      key: 'last_name',
      header: 'שם משפחה',
      sortable: true,
    },
    {
      key: 'email',
      header: 'אימייל',
      sortable: true,
    },
    {
      key: 'hourly_rate',
      header: 'שכר שעתי',
      sortable: true,
      render: (value) => value ? `₪${value}` : '-',
    },
    {
      key: 'role',
      header: 'תפקיד',
      sortable: true,
      render: (value) => value === 'manager' ? 'מנהל' : 'עובד',
    },
    {
      key: 'status',
      header: 'סטטוס',
      sortable: true,
      render: (value) => {
        const statusMap = {
          active: 'פעיל',
          inactive: 'לא פעיל',
          terminated: 'הופסק',
        };
        return statusMap[value as keyof typeof statusMap] || value;
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          הוסף עובד חדש
        </button>
        <h1 className="text-2xl font-bold text-gray-900">עובדים</h1>
      </div>

      <DataTable
        data={employees}
        columns={columns}
        searchPlaceholder="חיפוש לפי שם או אימייל..."
        emptyMessage="אין עובדים להצגה. הוסף עובד חדש כדי להתחיל."
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        searchFields={['first_name', 'last_name', 'email']}
      />

      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={selectedEmployee}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
