// Copilot: budgets list + form (create/edit) in RTL.
// Fields: budget_type, amount, currency, period_start, period_end, department.
// Filters by period range; pagination; Zod validations; toasts.

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { budgetApi, type Budget, BudgetCreatePayload, BudgetUpdatePayload } from '../api/budgets';
import { DataTable, Column } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { useToast } from '../components/Toast';

const budgetTypes = [
  { value: 'weekly', label: 'שבועי' },
  { value: 'monthly', label: 'חודשי' },
  { value: 'quarterly', label: 'רבעוני' },
  { value: 'yearly', label: 'שנתי' },
];

const currencies = [
  { value: 'ILS', label: '₪ שקל' },
  { value: 'USD', label: '$ דולר' },
  { value: 'EUR', label: '€ יורו' },
];

const budgetSchema = z.object({
  name: z.string()
    .min(2, 'שם התקציב חייב להכיל לפחות 2 תווים')
    .max(100, 'שם התקציב לא יכול להכיל יותר מ-100 תווים'),
  budget_type: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  amount: z.number()
    .min(0, 'סכום התקציב חייב להיות גדול או שווה ל-0'),
  currency: z.string().min(1, 'חובה לבחור מטבע'),
  period_start: z.string().min(1, 'תאריך התחלה חובה'),
  period_end: z.string().min(1, 'תאריך סיום חובה'),
  department: z.string().optional(),
  is_active: z.boolean(),
}).refine((data) => new Date(data.period_start) < new Date(data.period_end), {
  message: 'תאריך התחלה חייב להיות לפני תאריך הסיום',
  path: ['period_end'],
});

type BudgetForm = z.infer<typeof budgetSchema>;

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: Budget | null;
  onSuccess: () => void;
}

function BudgetModal({ isOpen, onClose, budget, onSuccess }: BudgetModalProps) {
  const { businessId } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      currency: 'ILS',
      is_active: true,
      budget_type: 'monthly',
    },
  });

  useEffect(() => {
    if (budget) {
      reset({
        name: budget.name,
        budget_type: budget.budget_type,
        amount: budget.amount,
        currency: budget.currency,
        period_start: budget.period_start,
        period_end: budget.period_end,
        department: budget.department || '',
        is_active: budget.is_active,
      });
    } else {
      reset({
        name: '',
        budget_type: 'monthly',
        amount: 0,
        currency: 'ILS',
        period_start: '',
        period_end: '',
        department: '',
        is_active: true,
      });
    }
  }, [budget, reset]);

  const onSubmit = async (data: BudgetForm) => {
    if (!businessId) return;

    setLoading(true);
    try {
      if (budget) {
        const updatePayload: BudgetUpdatePayload = {
          name: data.name,
          budget_type: data.budget_type,
          amount: data.amount,
          currency: data.currency,
          period_start: data.period_start,
          period_end: data.period_end,
          department: data.department || undefined,
          is_active: data.is_active,
        };
        await budgetApi.update(budget.id, updatePayload);
        success('תקציב עודכן בהצלחה');
      } else {
        const createPayload: BudgetCreatePayload = {
          name: data.name,
          budget_type: data.budget_type,
          amount: data.amount,
          currency: data.currency,
          period_start: data.period_start,
          period_end: data.period_end,
          department: data.department || undefined,
          is_active: data.is_active,
        };
        await budgetApi.create(businessId, createPayload);
        success('תקציב נוסף בהצלחה');
      }

      onSuccess();
      onClose();
    } catch (err) {
      error(budget ? 'שגיאה בעדכון התקציב' : 'שגיאה בהוספת התקציב');
      console.error('Error saving budget:', err);
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
              {budget ? 'עריכת תקציב' : 'הוספת תקציב חדש'}
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="שם התקציב"
              error={errors.name?.message}
              required
            >
              <input
                {...register('name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
                placeholder="למשל: תקציב משמרות חודש ינואר"
              />
            </FormField>

            <FormField
              label="סוג תקציב"
              error={errors.budget_type?.message}
              required
            >
              <select
                {...register('budget_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              >
                {budgetTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="מטבע"
                error={errors.currency?.message}
                required
              >
                <select
                  {...register('currency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="rtl"
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="סכום"
                error={errors.amount?.message}
                required
              >
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="rtl"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="תאריך סיום"
                error={errors.period_end?.message}
                required
              >
                <input
                  {...register('period_end')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </FormField>

              <FormField
                label="תאריך התחלה"
                error={errors.period_start?.message}
                required
              >
                <input
                  {...register('period_start')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </FormField>
            </div>

            <FormField
              label="מחלקה"
              error={errors.department?.message}
            >
              <input
                {...register('department')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
                placeholder="למשל: מכירות, מטבח, שירות"
              />
            </FormField>

            <FormField label="תקציב פעיל">
              <div className="flex items-center" dir="rtl">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
                />
                <span className="text-sm text-gray-700">התקציב פעיל ובשימוש</span>
              </div>
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

export default function Budgets() {
  const { businessId } = useAuth();
  const { success, error } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | ''>('');

  useEffect(() => {
    if (businessId) {
      loadBudgets();
    }
  }, [businessId, filterType, filterActive]);

  const loadBudgets = async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      const response = await budgetApi.list({
        businessId,
        budget_type: filterType !== '' ? filterType as any : undefined,
        is_active: filterActive !== '' ? filterActive : undefined,
        page: 1,
        page_size: 100,
      });
      setBudgets(response.budgets);
    } catch (err) {
      error('שגיאה בטעינת רשימת התקציבים');
      console.error('Error loading budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setModalOpen(true);
  };

  const handleDelete = async (budget: Budget) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את תקציב "${budget.name}"?`)) {
      return;
    }

    try {
      await budgetApi.remove(budget.id);
      success('התקציב נמחק בהצלחה');
      await loadBudgets();
    } catch (err) {
      error('שגיאה במחיקת התקציב');
      console.error('Error deleting budget:', err);
    }
  };

  const handleAddNew = () => {
    setSelectedBudget(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadBudgets();
  };

  const formatAmount = (amount: number, currency: string) => {
    const currencySymbols: Record<string, string> = {
      ILS: '₪',
      USD: '$',
      EUR: '€',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getBudgetTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      weekly: 'שבועי',
      monthly: 'חודשי',
      quarterly: 'רבעוני',
      yearly: 'שנתי',
    };
    return typeMap[type] || type;
  };

  const columns: Column<Budget>[] = [
    {
      key: 'name',
      header: 'שם התקציב',
      sortable: true,
    },
    {
      key: 'budget_type',
      header: 'סוג',
      sortable: true,
      render: (value) => getBudgetTypeLabel(value),
    },
    {
      key: 'amount',
      header: 'סכום',
      sortable: true,
      render: (value, budget) => formatAmount(value, budget.currency),
    },
    {
      key: 'period_start',
      header: 'תאריך התחלה',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('he-IL'),
    },
    {
      key: 'period_end',
      header: 'תאריך סיום',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('he-IL'),
    },
    {
      key: 'department',
      header: 'מחלקה',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'is_active',
      header: 'סטטוס',
      sortable: true,
      render: (value) => value ? '✓ פעיל' : '✗ לא פעיל',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          הוסף תקציב חדש
        </button>
        <h1 className="text-2xl font-bold text-gray-900">תקציבים</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
              סינון לפי סוג תקציב
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            >
              <option value="">כל הסוגים</option>
              {budgetTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
              סינון לפי סטטוס
            </label>
            <select
              value={filterActive === '' ? '' : filterActive ? 'true' : 'false'}
              onChange={(e) => setFilterActive(e.target.value === '' ? '' : e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            >
              <option value="">כל הסטטוסים</option>
              <option value="true">פעיל</option>
              <option value="false">לא פעיל</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={budgets}
        columns={columns}
        searchPlaceholder="חיפוש לפי שם תקציב..."
        emptyMessage="אין תקציבים להצגה. הוסף תקציב חדש כדי להתחיל."
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        searchFields={['name', 'department']}
      />

      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        budget={selectedBudget}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
