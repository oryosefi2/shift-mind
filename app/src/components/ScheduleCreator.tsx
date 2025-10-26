import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './ui/Modal';
import { FormField } from './FormField';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';

const scheduleSchema = z.object({
  week_date: z.string().min(1, 'תאריך השבוע חובה'),
  weekly_budget: z.number().min(0, 'תקציב חייב להיות חיובי'),
  min_staff_per_hour: z.number().min(1, 'מספר עובדים חובה').max(10),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

interface ScheduleCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

export function ScheduleCreator({ isOpen, onClose, businessId }: ScheduleCreatorProps) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      week_date: getCurrentWeekStart(),
      weekly_budget: 5000,
      min_staff_per_hour: 2,
    },
  });

  const formData = watch();

  function getCurrentWeekStart(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    return sunday.toISOString().split('T')[0];
  }

  function getNextWeekStart(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() - dayOfWeek + 7);
    return nextSunday.toISOString().split('T')[0];
  }

  function formatWeekString(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    
    return `${date.getDate()}/${date.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
  }

  const onSubmit = async (data: ScheduleForm) => {
    setLoading(true);
    try {
      // יצירת סידור באמצעות API
      const weekString = formatWeekString(data.week_date);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8084'}/api/schedule/${weekString}/generate?business_id=${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekly_budget: data.weekly_budget,
          min_staff_per_hour: data.min_staff_per_hour,
          forecast_data: null, // לא משתמשים בחיזוי בגרסה הבסיסית
        }),
      });

      if (!response.ok) {
        throw new Error('שגיאה ביצירת הסידור');
      }

      const result = await response.json();
      
      success(`הסידור נוצר בהצלחה! ${result.shifts?.length || 0} משמרות נוצרו`);
      onClose();
      reset();
      
      // מעבר ללוח הסידור
      navigate('/schedule');
    } catch (err) {
      error('שגיאה ביצירת הסידור. אנא ודא שיש עובדים עם זמינות מוגדרת');
    } finally {
      setLoading(false);
    }
  };

  const estimatedCost = formData.weekly_budget;
  const dailyBudget = Math.round(estimatedCost / 7);
  const hourlyBudget = Math.round(dailyBudget / 16); // 16 שעות פעילות ממוצעות

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="צור סידור שבועי חכם">
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-4">🗓️</div>
          <h3 className="text-xl font-bold text-gray-900">יצירת סידור שבועי</h3>
          <p className="text-gray-600 mt-2">המערכת תיצור סידור אופטימלי לפי התקציב והזמינות</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Week Selection */}
          <FormField
            label="שבוע לסידור"
            error={errors.week_date?.message}
            required
          >
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('week_date')}
                  type="radio"
                  value={getCurrentWeekStart()}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">השבוע הנוכחי</div>
                  <div className="text-sm text-gray-600">{formatDate(getCurrentWeekStart())}</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('week_date')}
                  type="radio"
                  value={getNextWeekStart()}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">השבוע הבא</div>
                  <div className="text-sm text-gray-600">{formatDate(getNextWeekStart())}</div>
                </div>
              </label>
            </div>
          </FormField>

          {/* Weekly Budget */}
          <FormField
            label="תקציב שבועי (₪)"
            error={errors.weekly_budget?.message}
            required
          >
            <input
              {...register('weekly_budget', { valueAsNumber: true })}
              type="number"
              min="0"
              step="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="5000"
            />
            <div className="mt-2 text-sm text-gray-600">
              יומי: ₪{dailyBudget.toLocaleString()} | שעתי משוער: ₪{hourlyBudget.toLocaleString()}
            </div>
          </FormField>

          {/* Min Staff Per Hour */}
          <FormField
            label="מינימום עובדים לשעה"
            error={errors.min_staff_per_hour?.message}
            required
          >
            <select
              {...register('min_staff_per_hour', { valueAsNumber: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>עובד 1</option>
              <option value={2}>2 עובדים</option>
              <option value={3}>3 עובדים</option>
              <option value={4}>4 עובדים</option>
              <option value={5}>5+ עובדים</option>
            </select>
          </FormField>

          {/* Preview Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-3">תצוגה מקדימה:</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div>📅 שבוע: {formatDate(formData.week_date)}</div>
              <div>💰 תקציב: ₪{formData.weekly_budget?.toLocaleString()}</div>
              <div>👥 מינימום עובדים: {formData.min_staff_per_hour} לשעה</div>
              <div>🎯 עלות משוערת לשעה: ₪{(hourlyBudget * formData.min_staff_per_hour).toLocaleString()}</div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-lg">⚠️</span>
              <div>
                <div className="font-medium text-amber-800">חשוב לדעת:</div>
                <ul className="text-sm text-amber-700 mt-1 space-y-1 list-disc list-inside">
                  <li>יש לוודא שקיימים עובדים עם זמינות מוגדרת</li>
                  <li>הסידור ייצר לפי האלגוריתם הגרידי הבסיסי</li>
                  <li>ניתן לערוך את הסידור לאחר היצירה</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  יוצר סידור...
                </div>
              ) : (
                '🚀 צור סידור חכם'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
