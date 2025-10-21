// Copilot: Seasonal Profiles CRUD page with MultiHourMultiplier component
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { seasonalProfilesApi, SeasonalProfile, CreateSeasonalProfileData, UpdateSeasonalProfileData } from '../api/calendar';
import { DataTable } from '../components/DataTable';
import { MultiHourMultiplier } from '../components/MultiHourMultiplier';
import { FormField } from '../components/FormField';

// Zod validation schema
const seasonalProfileSchema = z.object({
  name: z.string().min(1, 'שם פרופיל חובה'),
  profile_type: z.enum(['weekly', 'monthly', 'seasonal', 'holiday']),
  multiplier_data: z.record(z.string(), z.number().min(0).max(10)),
  is_active: z.boolean().optional(),
  priority: z.number().int().min(1).max(100).optional()
});

type FormData = z.infer<typeof seasonalProfileSchema>;

const profileTypeOptions = [
  { value: 'weekly', label: 'שבועי' },
  { value: 'monthly', label: 'חודשי' },
  { value: 'seasonal', label: 'עונתי' },
  { value: 'holiday', label: 'חגים' }
];

export const SeasonalProfiles: React.FC = () => {
  const { businessId, session, user, signIn } = useAuth();
  const { success, error } = useToast();
  const [profiles, setProfiles] = useState<SeasonalProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Debug: Check auth state
  console.log('businessId:', businessId, 'user:', user?.email);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(seasonalProfileSchema),
    defaultValues: {
      name: '',
      profile_type: 'weekly',
      multiplier_data: {},
      is_active: true,
      priority: 1
    }
  });

    const loadProfiles = useCallback(async () => {
    if (!businessId) {
      console.log('No businessId available, skipping load');
      setProfiles([]);
      return;
    }
    
    console.log('Loading profiles for businessId:', businessId);
    setLoading(true);
    try {
      const data = await seasonalProfilesApi.getAll(businessId);
      console.log('Loaded profiles:', data);
      setProfiles(Array.isArray(data) ? data : []); // Ensure array
    } catch (err) {
      console.error('שגיאה בטעינת פרופילים עונתיים:', err);
      error('שגיאה בטעינת נתונים');
      setProfiles([]); // Set empty array on error to prevent undefined issues
    } finally {
      setLoading(false);
    }
  }, [businessId, error]);

  useEffect(() => {
    loadProfiles();
  }, [businessId]);

  // Demo: Auto-login if no user
  useEffect(() => {
    if (!session && !user) {
      console.log('Auto-signing in for demo...');
      signIn('demo@example.com').catch(err => 
        console.error('Auto sign-in failed:', err)
      );
    }
  }, [session, user, signIn]);

  const onSubmit = async (data: FormData) => {
    if (!businessId) return;

    try {
      if (editingId) {
        // Update existing profile
        await seasonalProfilesApi.update(editingId, data as UpdateSeasonalProfileData);
        success('פרופיל עונתיות עודכן בהצלחה');
      } else {
        // Create new profile
        await seasonalProfilesApi.create(businessId, data as CreateSeasonalProfileData);
        success('פרופיל עונתיות נוצר בהצלחה');
      }
      
      await loadProfiles();
      resetForm();
    } catch (err) {
      error(editingId ? 'שגיאה בעדכון פרופיל עונתיות' : 'שגיאה ביצירת פרופיל עונתיות');
      console.error('Error saving seasonal profile:', err);
    }
  };

  const handleEdit = (profile: SeasonalProfile) => {
    reset({
      name: profile.name,
      profile_type: profile.profile_type as any,
      multiplier_data: profile.multiplier_data,
      is_active: profile.is_active,
      priority: profile.priority
    });
    setEditingId(profile.id);
    setShowForm(true);
  };

  const handleDelete = async (profile: SeasonalProfile) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פרופיל עונתיות זה?')) return;

    try {
      await seasonalProfilesApi.delete(profile.id);
      success('פרופיל עונתיות נמחק בהצלחה');
      await loadProfiles();
    } catch (err) {
      error('שגיאה במחיקת פרופיל עונתיות');
      console.error('Error deleting seasonal profile:', err);
    }
  };

  const resetForm = () => {
    reset({
      name: '',
      profile_type: 'weekly',
      multiplier_data: {},
      is_active: true,
      priority: 1
    });
    setEditingId(null);
    setShowForm(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'שם פרופיל',
      render: (_value: any, profile: SeasonalProfile) => (
        <div className="text-right">
          <div className="font-medium">{profile.name}</div>
          <div className="text-sm text-gray-500">
            {profileTypeOptions.find(opt => opt.value === profile.profile_type)?.label}
          </div>
        </div>
      )
    },
    {
      key: 'multiplier_preview',
      header: 'תצוגה מקדימה',
      render: (_value: any, profile: SeasonalProfile) => {
        if (!profile || !profile.multiplier_data) {
          return <div className="text-sm text-gray-400 text-right">לא זמין</div>;
        }
        
        const values = Object.values(profile.multiplier_data);
        
        if (values.length === 0) {
          return <div className="text-sm text-gray-400 text-right">לא הוגדרו מכפילים</div>;
        }
        
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return (
          <div className="text-sm text-right">
            <div>ממוצע: {avg.toFixed(2)}</div>
            <div className="text-gray-500">טווח: {min.toFixed(1)} - {max.toFixed(1)}</div>
          </div>
        );
      }
    },
    {
      key: 'priority',
      header: 'עדיפות',
      render: (_value: any, profile: SeasonalProfile) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          profile.priority <= 3 ? 'bg-red-100 text-red-800' :
          profile.priority <= 7 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {profile.priority}
        </span>
      )
    },
    {
      key: 'is_active',
      header: 'פעיל',
      render: (_value: any, profile: SeasonalProfile) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          profile.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {profile.is_active ? 'פעיל' : 'לא פעיל'}
        </span>
      )
    }
  ];

  if (!businessId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">נדרש לבחור עסק</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">פרופילי עונתיות</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          פרופיל חדש
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'עריכת פרופיל עונתיות' : 'פרופיל עונתיות חדש'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="שם פרופיל"
                error={errors.name?.message}
                required
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="הזן שם פרופיל"
                    />
                  )}
                />
              </FormField>

              <FormField
                label="סוג פרופיל"
                error={errors.profile_type?.message}
                required
              >
                <Controller
                  name="profile_type"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {profileTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </FormField>

              <FormField
                label="עדיפות"
                error={errors.priority?.message}
              >
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                />
              </FormField>

              <div className="flex items-center">
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>פרופיל פעיל</span>
                    </label>
                  )}
                />
              </div>
            </div>

            {/* Multiplier Data */}
            <FormField
              label="מכפילי ביקוש לפי שעות"
              error={errors.multiplier_data?.message?.toString()}
            >
              <Controller
                name="multiplier_data"
                control={control}
                render={({ field }) => (
                  <MultiHourMultiplier
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </FormField>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'שומר...' : editingId ? 'עדכן פרופיל' : 'צור פרופיל'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md">
        <DataTable
          data={profiles}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="אין פרופילי עונתיות"
        />
      </div>
    </div>
  );
};
