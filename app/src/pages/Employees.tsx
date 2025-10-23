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

// Schema validation
const employeeSchema = z.object({
  first_name: z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
  last_name: z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  phone: z.string().optional(),
  hourly_rate: z.number().min(0, 'שכר שעתי חייב להיות גדול או שווה ל-0').nullable().optional(),
  role: z.enum(['employee', 'manager']),
  skills: z.array(z.string()).optional(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const businessId = (user as any)?.user_metadata?.business_id || 'demo-business';

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: 'employee',
      skills: [],
    },
  });

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, [businessId]);

  const loadEmployees = async () => {
    if (!businessId) {
      console.log('No businessId available');
      return;
    }
    
    console.log('Loading employees for business:', businessId);
    setLoading(true);
    try {
      const response = await employeeApi.list({ businessId });
      console.log('Employees response:', response);
      
      let employeesList = response.employees || [];
      
      // If no employees and this is demo business, add sample data
      if (employeesList.length === 0 && businessId.includes('demo')) {
        console.log('Adding demo employees');
        employeesList = [
          {
            id: 'emp-1',
            business_id: businessId,
            first_name: 'שרה',
            last_name: 'כהן',
            email: 'sarah@example.com',
            phone: '050-1234567',
            hourly_rate: 45,
            role: 'manager' as const,
            status: 'active' as const,
            skills: ['ניהול', 'שירות לקוחות'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'emp-2',
            business_id: businessId,
            first_name: 'דוד',
            last_name: 'לוי',
            email: 'david@example.com',
            phone: '052-9876543',
            hourly_rate: 38,
            role: 'employee' as const,
            status: 'active' as const,
            skills: ['מכירות', 'תפעול'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'emp-3',
            business_id: businessId,
            first_name: 'מיכל',
            last_name: 'אברהם',
            email: 'michal@example.com',
            phone: '054-5555555',
            hourly_rate: 35,
            role: 'employee' as const,
            status: 'active' as const,
            skills: ['קופה', 'ניקיון'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
      
      setEmployees(employeesList);
    } catch (err) {
      console.error('Error loading employees:', err);
      
      // If API fails and this is demo business, show demo data
      if (businessId.includes('demo')) {
        console.log('API failed, using demo employees');
        setEmployees([
          {
            id: 'emp-1',
            business_id: businessId,
            first_name: 'שרה',
            last_name: 'כהן',
            email: 'sarah@example.com',
            phone: '050-1234567',
            hourly_rate: 45,
            role: 'manager' as const,
            status: 'active' as const,
            skills: ['ניהול', 'שירות לקוחות'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'emp-2',
            business_id: businessId,
            first_name: 'דוד',
            last_name: 'לוי',
            email: 'david@example.com',
            phone: '052-9876543',
            hourly_rate: 38,
            role: 'employee' as const,
            status: 'active' as const,
            skills: ['מכירות', 'תפעול'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'emp-3',
            business_id: businessId,
            first_name: 'מיכל',
            last_name: 'אברהם',
            email: 'michal@example.com',
            phone: '054-5555555',
            hourly_rate: 35,
            role: 'employee' as const,
            status: 'active' as const,
            skills: ['קופה', 'ניקיון'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } else {
        error('שגיאה בטעינת העובדים');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: EmployeeForm) => {
    if (!businessId) return;

    setFormLoading(true);
    try {
      if (editingEmployee) {
        // Update employee
        const updatePayload: EmployeeUpdatePayload = {
          ...data,
          phone: data.phone || undefined,
          hourly_rate: data.hourly_rate || undefined,
        };
        await employeeApi.update(editingEmployee.id, updatePayload);
        success('העובד עודכן בהצלחה');
      } else {
        // Create employee
        const createPayload: EmployeeCreatePayload = {
          ...data,
          phone: data.phone || undefined,
          hourly_rate: data.hourly_rate || undefined,
        };
        await employeeApi.create(businessId, createPayload);
        success('העובד נוסף בהצלחה');
      }
      
      loadEmployees();
      handleCloseModal();
    } catch (err) {
      error(editingEmployee ? 'שגיאה בעדכון העובד' : 'שגיאה בהוספת העובד');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (employee: Employee) => {
    if (!businessId) return;
    
    if (confirm(`האם אתה בטוח שברצונך למחוק את ${employee.first_name} ${employee.last_name}?`)) {
      try {
        await employeeApi.remove(employee.id);
        success('העובד נמחק בהצלחה');
        loadEmployees();
      } catch (err) {
        error('שגיאה במחיקת העובד');
      }
    }
  };

  // Handle edit
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    reset({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      hourly_rate: employee.hourly_rate,
      role: employee.role,
      skills: employee.skills || [],
    });
    setModalOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingEmployee(null);
    reset({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      hourly_rate: null,
      role: 'employee',
      skills: [],
    });
    setModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEmployee(null);
    reset();
  };

  // Table columns
  const columns = [
    {
      key: 'first_name' as keyof Employee,
      label: 'שם פרטי',
    },
    {
      key: 'last_name' as keyof Employee,
      label: 'שם משפחה',
    },
    {
      key: 'email' as keyof Employee,
      label: 'אימייל',
    },
    {
      key: 'hourly_rate' as keyof Employee,
      label: 'שכר שעתי',
      render: (value: number | null) => value ? `₪${value}` : '-',
    },
    {
      key: 'role' as keyof Employee,
      label: 'תפקיד',
      render: (value: string) => value === 'manager' ? 'מנהל' : 'עובד',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">טוען עובדים...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <PageHeader
        title="ניהול עובדים"
        description="ניהול פרטי העובדים, תפקידים ושכר שעתי"
        onAddNew={handleAddNew}
        addButtonText="הוסף עובד חדש"
      />

      {/* Quick Import Button */}
      <div className="mb-6">
        <a 
          href="/import"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
        >
          <span className="text-lg">📊</span>
          יבוא עובדים מקובץ CSV/Excel
        </a>
      </div>

      <DataCard
        data={employees}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="חיפוש עובדים לפי שם או אימייל..."
      />

      {/* Employee Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingEmployee ? 'עריכת עובד' : 'הוספת עובד חדש'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם פרטי *
              </label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="שם פרטי"
              />
              {errors.first_name && (
                <p className="text-red-600 text-sm mt-1">{errors.first_name.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם משפחה *
              </label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="שם משפחה"
              />
              {errors.last_name && (
                <p className="text-red-600 text-sm mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אימייל *
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                טלפון
              </label>
              <input
                {...register('phone')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="050-1234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שכר שעתי (₪)
              </label>
              <input
                {...register('hourly_rate', { 
                  setValueAs: (v) => v === '' ? null : parseFloat(v) 
                })}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              {errors.hourly_rate && (
                <p className="text-red-600 text-sm mt-1">{errors.hourly_rate.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תפקיד *
              </label>
              <select
                {...register('role')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="employee">עובד</option>
                <option value="manager">מנהל</option>
              </select>
            </div>
          </div>

          {/* Skills JSON */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              כישורים (JSON)
            </label>
            <textarea
              value={JSON.stringify(watch('skills') || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setValue('skills', Array.isArray(parsed) ? parsed : []);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={4}
              placeholder='["כישור 1", "כישור 2"]'
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {formLoading 
                ? 'שומר...' 
                : editingEmployee ? 'עדכן' : 'הוסף'
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Employees;
