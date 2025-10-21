// Copilot: form in Hebrew RTL to load and update current business settings.
// Fields: timezone (select), week_start (select 0-6 with Hebrew names), open_hours (JsonField).
// Load initial by businessId from AuthContext, show Save/Cancel, toast on success.

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { businessApi, Business } from '../api/businesses';
import { FormField } from '../components/FormField';
import { JsonField } from '../components/JsonField';
import { useToast } from '../components/Toast';

const timezones = [
  { value: 'Asia/Jerusalem', label: 'ירושלים (GMT+2)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'Europe/London', label: 'לונדון (GMT+0)' },
  { value: 'America/New_York', label: 'ניו יורק (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'לוס אנג\'לס (GMT-8)' },
];

const weekStartOptions = [
  { value: 0, label: 'ראשון' },
  { value: 1, label: 'שני' },
  { value: 2, label: 'שלישי' },
  { value: 3, label: 'רביעי' },
  { value: 4, label: 'חמישי' },
  { value: 5, label: 'שישי' },
  { value: 6, label: 'שבת' },
];

const businessSettingsSchema = z.object({
  timezone: z.string().min(1, 'אזור זמן הוא שדה חובה'),
  week_start: z.number().min(0).max(6),
  open_hours: z.any().optional(),
  name: z.string().min(1, 'שם העסק הוא שדה חובה'),
  industry: z.string().optional(),
});

type BusinessSettingsForm = z.infer<typeof businessSettingsSchema>;

export default function BusinessSettings() {
  const { businessId } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<BusinessSettingsForm>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      timezone: 'Asia/Jerusalem',
      week_start: 0,
      open_hours: {},
    },
  });

  const openHours = watch('open_hours');

  useEffect(() => {
    if (businessId) {
      loadBusiness();
    }
  }, [businessId]);

  const loadBusiness = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      const data = await businessApi.getBusiness(businessId);
      setBusiness(data);
      
      // Reset form with loaded data
      reset({
        timezone: data.timezone || 'Asia/Jerusalem',
        week_start: data.settings?.week_start ?? 0,
        open_hours: data.settings?.open_hours || {},
        name: data.name,
        industry: data.industry || '',
      });
    } catch (err) {
      error('שגיאה בטעינת נתוני העסק');
      console.error('Error loading business:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BusinessSettingsForm) => {
    if (!businessId) return;

    setLoading(true);
    try {
      await businessApi.updateBusiness(businessId, {
        timezone: data.timezone,
        name: data.name,
        industry: data.industry,
        settings: {
          ...business?.settings,
          week_start: data.week_start,
          open_hours: data.open_hours,
        },
      });
      
      success('הגדרות העסק נשמרו בהצלחה');
      await loadBusiness(); // Reload to get updated data
    } catch (err) {
      error('שגיאה בשמירת הגדרות העסק');
      console.error('Error updating business:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (business) {
      reset({
        timezone: business.timezone || 'Asia/Jerusalem',
        week_start: business.settings?.week_start ?? 0,
        open_hours: business.settings?.open_hours || {},
        name: business.name,
        industry: business.industry || '',
      });
    }
  };

  if (loading && !business) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-right">
          הגדרות עסק
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label="שם העסק"
            error={errors.name?.message}
            required
          >
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </FormField>

          <FormField
            label="תחום עסקי"
            error={errors.industry?.message}
          >
            <input
              {...register('industry')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
              placeholder="למשל: בית קפה, מסעדה, חנות..."
            />
          </FormField>

          <FormField
            label="אזור זמן"
            error={errors.timezone?.message}
            required
          >
            <select
              {...register('timezone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="יום תחילת השבוע"
            error={errors.week_start?.message}
            helperText="בחר איזה יום מתחיל השבוע עבור התזמונים"
          >
            <select
              {...register('week_start', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            >
              {weekStartOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <JsonField
            label="שעות פתיחה"
            value={openHours}
            onChange={(value) => setValue('open_hours', value, { shouldDirty: true })}
            helperText="הגדר שעות פתיחה לכל יום בשבוע (0=ראשון, 6=שבת). למשל: {&quot;0&quot;: [{&quot;start&quot;: &quot;09:00&quot;, &quot;end&quot;: &quot;17:00&quot;}]}"
            rows={6}
          />

          <div className="flex space-x-4 justify-end" dir="rtl">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading || !isDirty}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
