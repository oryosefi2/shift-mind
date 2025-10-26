import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './ui/Modal';
import { ProgressBar } from './ui/ProgressBar';
import { FormField } from './FormField';
import { useToast } from './Toast';
import { businessApi } from '../api/businesses';
import { budgetApi } from '../api/budgets';

const setupSchema = z.object({
  name: z.string().min(1, 'שם העסק הוא שדה חובה'),
  industry: z.string().optional(),
  timezone: z.string().min(1, 'אזור זמן הוא שדה חובה'),
  open_hours: z.object({
    start: z.string().min(1, 'שעת פתיחה חובה'),
    end: z.string().min(1, 'שעת סגירה חובה'),
  }),
  weekly_budget: z.number().min(0, 'תקציב חייב להיות חיובי'),
  avg_employees_per_hour: z.number().min(1, 'מספר עובדים חובה').max(10),
});

type BusinessSetupForm = z.infer<typeof setupSchema>;

interface BusinessSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  businessId: string;
}

export function BusinessSetupWizard({ isOpen, onClose, onComplete, businessId }: BusinessSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const steps = [
    'פרטי העסק',
    'שעות פעילות',
    'תקציב ועובדים',
    'סיום הגדרה',
  ];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BusinessSetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: '',
      industry: 'retail',
      timezone: 'Asia/Jerusalem',
      open_hours: {
        start: '07:00',
        end: '23:00',
      },
      weekly_budget: 5000,
      avg_employees_per_hour: 2,
    },
  });

  const formData = watch();

  const onSubmit = async (data: BusinessSetupForm) => {
    setLoading(true);
    try {
      // בדיקה אם העסק קיים
      try {
        await businessApi.getBusiness(businessId);
      } catch (err: any) {
        if (err.status === 404) {
          error('העסק לא נמצא במערכת. אנא התנתק והתחבר מחדש.');
          setLoading(false);
          return;
        }
      }

      // עדכון הגדרות העסק
      await businessApi.updateBusiness(businessId, {
        name: data.name,
        industry: data.industry,
        timezone: data.timezone,
        settings: {
          open_hours: data.open_hours,
          avg_employees_per_hour: data.avg_employees_per_hour,
        },
      });

      // יצירת תקציב שבועי ברירת מחדל
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      await budgetApi.create(businessId, {
        name: 'תקציב שבועי ראשוני',
        budget_type: 'weekly',
        amount: data.weekly_budget,
        currency: 'ILS',
        period_start: startOfWeek.toISOString().split('T')[0],
        period_end: endOfWeek.toISOString().split('T')[0],
        department: 'general',
      });

      success('העסק הוגדר בהצלחה! כעת ניתן להתחיל לעבוד');
      onComplete();
    } catch (err) {
      error('שגיאה בהגדרת העסק');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-gray-900">ברוכים הבאים ל-ShiftMind!</h3>
              <p className="text-gray-600 mt-2">בואו נגדיר את העסק שלכם</p>
            </div>

            <FormField
              label="שם העסק"
              error={errors.name?.message}
              required
            >
              <input
                {...register('name')}
                type="text"
                placeholder="בית קפה שלי"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="תחום עיסוק">
              <select
                {...register('industry')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="retail">קמעונאות</option>
                <option value="restaurant">מסעדה/בית קפה</option>
                <option value="healthcare">בריאות</option>
                <option value="services">שירותים</option>
                <option value="other">אחר</option>
              </select>
            </FormField>

            <FormField label="אזור זמן">
              <select
                {...register('timezone')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Asia/Jerusalem">ישראל (GMT+2)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="Europe/London">לונדון (GMT+0)</option>
                <option value="America/New_York">ניו יורק (GMT-5)</option>
              </select>
            </FormField>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🕐</div>
              <h3 className="text-xl font-bold text-gray-900">שעות פעילות העסק</h3>
              <p className="text-gray-600 mt-2">מתי העסק שלכם פתוח?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="שעת פתיחה"
                error={errors.open_hours?.start?.message}
                required
              >
                <input
                  {...register('open_hours.start')}
                  type="time"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>

              <FormField
                label="שעת סגירה"
                error={errors.open_hours?.end?.message}
                required
              >
                <input
                  {...register('open_hours.end')}
                  type="time"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-blue-700">
                <span>💡</span>
                <span className="font-medium">טיפ:</span>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                ניתן לשנות את השעות בהמשך בהגדרות העסק
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900">תקציב ועובדים</h3>
              <p className="text-gray-600 mt-2">הגדרות כלכליות בסיסיות</p>
            </div>

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
                placeholder="5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField
              label="מספר עובדים ממוצע לשעה"
              error={errors.avg_employees_per_hour?.message}
              required
            >
              <select
                {...register('avg_employees_per_hour', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 עובד</option>
                <option value={2}>2 עובדים</option>
                <option value={3}>3 עובדים</option>
                <option value={4}>4 עובדים</option>
                <option value={5}>5+ עובדים</option>
              </select>
            </FormField>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-700 font-medium mb-2">תצוגה מקדימה:</div>
              <div className="space-y-2 text-sm text-green-600">
                <div>• תקציב יומי: ₪{Math.round(formData.weekly_budget / 7).toLocaleString()}</div>
                <div>• תקציב שעתי משוער: ₪{Math.round(formData.weekly_budget / (7 * 16)).toLocaleString()}</div>
                <div>• עלות עובד לשעה (משוער): ₪{Math.round((formData.weekly_budget / (7 * 16)) / formData.avg_employees_per_hour).toLocaleString()}</div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900">הכל מוכן!</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 text-right">
              <h4 className="font-bold text-gray-900 mb-4">סיכום ההגדרות:</h4>
              <div className="space-y-2 text-gray-700">
                <div><strong>עסק:</strong> {formData.name}</div>
                <div><strong>שעות פעילות:</strong> {formData.open_hours.start} - {formData.open_hours.end}</div>
                <div><strong>תקציב שבועי:</strong> ₪{formData.weekly_budget?.toLocaleString()}</div>
                <div><strong>עובדים לשעה:</strong> {formData.avg_employees_per_hour}</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-bold text-blue-900 mb-2">הצעדים הבאים:</h5>
              <ol className="text-blue-700 text-sm space-y-1 text-right list-decimal list-inside">
                <li>הוספת עובדים למערכת</li>
                <li>הגדרת זמינות לכל עובד</li>
                <li>יצירת סידור שבועי ראשון</li>
              </ol>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="הגדרת עסק חדש" maxWidth="max-w-3xl">
      <div className="p-6" dir="rtl">
        {/* Progress Bar */}
        <div className="mb-6">
          <ProgressBar
            steps={steps}
            currentStep={currentStep}
          />
        </div>

        {/* Step Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              חזור
            </button>

            <div className="flex gap-3">
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  הבא
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'שומר...' : 'סיים הגדרה'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
