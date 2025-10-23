import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { Modal } from '../components/ui/Modal';
import { Slider } from '../components/ui/Slider';
import { Sparkline } from '../components/ui/Sparkline';
import { useToast } from '../components/Toast';

interface SeasonalProfile {
  id: string;
  name: string;
  type: 'weekly' | 'holiday';
  priority: number;
  multipliers: number[];
  created_at: string;
}

function SeasonalProfiles() {
  const [profiles, setProfiles] = useState<SeasonalProfile[]>([
    {
      id: '1',
      name: 'פרופיל שגרתי',
      type: 'weekly',
      priority: 1,
      multipliers: Array.from({ length: 24 }, () => 1.0),
      created_at: '2025-01-01'
    }
  ]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SeasonalProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'weekly' as 'weekly' | 'holiday',
    priority: 1,
    multipliers: Array.from({ length: 24 }, () => 1.0)
  });

  const { success } = useToast();

  const handleAddNew = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      type: 'weekly',
      priority: 1,
      multipliers: Array.from({ length: 24 }, () => 1.0)
    });
    setModalOpen(true);
  };

  const handleEdit = (profile: SeasonalProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      type: profile.type,
      priority: profile.priority,
      multipliers: [...profile.multipliers]
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const newProfile: SeasonalProfile = {
      id: editingProfile?.id || Math.random().toString(),
      ...formData,
      created_at: editingProfile?.created_at || new Date().toISOString()
    };

    if (editingProfile) {
      setProfiles(profiles.map(p => p.id === editingProfile.id ? newProfile : p));
      success('פרופיל עונתי עודכן בהצלחה');
    } else {
      setProfiles([...profiles, newProfile]);
      success('פרופיל עונתי נוסף בהצלחה');
    }

    setModalOpen(false);
  };

  const handleDelete = (profile: SeasonalProfile) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את "${profile.name}"?`)) {
      setProfiles(profiles.filter(p => p.id !== profile.id));
      success('פרופיל עונתי נמחק בהצלחה');
    }
  };

  const handleMultiplierChange = (hour: number, value: number) => {
    const newMultipliers = [...formData.multipliers];
    newMultipliers[hour] = value;
    setFormData({ ...formData, multipliers: newMultipliers });
  };

  const resetToUniform = () => {
    setFormData({ ...formData, multipliers: Array.from({ length: 24 }, () => 1.0) });
  };

  const getSliderColor = (value: number): 'blue' | 'orange' | 'green' => {
    if (value < 0.8) return 'blue';
    if (value > 1.5) return 'orange';
    return 'green';
  };

  const columns = [
    {
      key: 'name' as keyof SeasonalProfile,
      label: 'שם הפרופיל',
    },
    {
      key: 'type' as keyof SeasonalProfile,
      label: 'סוג',
      render: (value: string) => value === 'weekly' ? 'שבועי' : 'חג/אירוע',
    },
    {
      key: 'priority' as keyof SeasonalProfile,
      label: 'עדיפות',
    },
    {
      key: 'multipliers' as keyof SeasonalProfile,
      label: 'טווח מכפילים',
      render: (multipliers: number[]) => {
        const min = Math.min(...multipliers).toFixed(1);
        const max = Math.max(...multipliers).toFixed(1);
        return `${min} - ${max}`;
      }
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <PageHeader
        title="פרופילים עונתיים ואירועים"
        description="ניהול דפוסי ביקוש עונתיים וימי חג מיוחדים"
        onAddNew={handleAddNew}
        addButtonText="פרופיל חדש"
      />

      <DataCard
        data={profiles}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="חיפוש פרופילים..."
      />

      {/* Profile Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProfile ? 'עריכת פרופיל עונתי' : 'פרופיל עונתי חדש'}
        maxWidth="max-w-6xl"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם הפרופיל *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="למשל: פרופיל חגים"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג פרופיל *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'weekly' | 'holiday' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="weekly">שבועי</option>
                <option value="holiday">חג/אירוע</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                עדיפות *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">תצוגה מקדימה חיה</h3>
              <button
                onClick={resetToUniform}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                החזר לערך אחיד (1.0)
              </button>
            </div>
            <Sparkline data={formData.multipliers} color="#3b82f6" />
          </div>

          {/* Hour Sliders */}
          <div>
            <h3 className="text-lg font-semibold mb-4">מכפילי ביקוש לפי שעות (00-23)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {formData.multipliers.map((multiplier, hour) => (
                <Slider
                  key={hour}
                  label={`${String(hour).padStart(2, '0')}:00`}
                  value={multiplier}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onChange={(value) => handleMultiplierChange(hour, value)}
                  color={getSliderColor(multiplier)}
                />
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {editingProfile ? 'עדכן פרופיל' : 'שמור פרופיל'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SeasonalProfiles;
