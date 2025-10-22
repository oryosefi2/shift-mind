import { useState } from 'react';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/Toast';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any[]) => void;
}

export function ImportWizard({ isOpen, onClose, onComplete }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setUploadedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mappedFields, setMappedFields] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { success, error } = useToast();

  const steps = [
    'העלאת קובץ',
    'זיהוי עמודות',
    'מיפוי שדות',
    'תצוגה מקדימה',
    'יבוא נתונים'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Auto-detect columns (mock implementation)
      setTimeout(() => {
        setColumns(['תאריך', 'שעה', 'עובד', 'משמרת', 'הערות']);
        setCurrentStep(1);
      }, 1000);
    }
  };

  const handleFieldMapping = () => {
    // Generate preview data (mock)
    const mockData = Array.from({ length: 20 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      employee: `עובד ${i + 1}`,
      shift: `משמרת ${i % 3 + 1}`,
      hours: Math.floor(Math.random() * 8) + 4,
    }));
    setPreviewData(mockData);
    setCurrentStep(3);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      // Mock import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      success('✅ הנתונים נוספו בהצלחה');
      onComplete(previewData);
      onClose();
      resetWizard();
    } catch (err) {
      error('שגיאה בייבוא הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setColumns([]);
    setMappedFields({});
    setPreviewData([]);
  };

  const handleClose = () => {
    onClose();
    resetWizard();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="אשף יבוא נתונים" maxWidth="max-w-4xl">
      <ProgressBar steps={steps} currentStep={currentStep} />

      <div className="space-y-6">
        {/* Step 0: File Upload */}
        {currentStep === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-4">העלה קובץ נתונים</h3>
            <p className="text-gray-600 mb-6">
              בחר קובץ CSV או Excel עם נתוני המשמרות שלך
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">⬆️</div>
                <div className="text-blue-600 font-semibold">לחץ לבחירת קובץ</div>
                <div className="text-gray-500 text-sm mt-1">או גרור קובץ לכאן</div>
              </label>
            </div>
          </div>
        )}

        {/* Step 1: Column Detection */}
        {currentStep === 1 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">זיהוי עמודות אוטומטי</h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-xl">✅</span>
                זוהו {columns.length} עמודות בקובץ
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {columns.map((column, index) => (
                <div key={index} className="bg-gray-100 rounded-xl p-3 text-center font-medium">
                  {column}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors"
              >
                המשך למיפוי שדות
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Field Mapping */}
        {currentStep === 2 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">מיפוי שדות</h3>
            <p className="text-gray-600 mb-6">
              קשר בין העמודות בקובץ לשדות במערכת
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['תאריך', 'עובד', 'שעת התחלה', 'שעת סיום'].map((field) => (
                <div key={field} className="flex items-center gap-4">
                  <label className="w-24 font-medium">{field}:</label>
                  <select 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setMappedFields({...mappedFields, [field]: e.target.value})}
                  >
                    <option value="">בחר עמודה</option>
                    {columns.map((column) => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors"
              >
                חזור
              </button>
              <button
                onClick={handleFieldMapping}
                className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors"
              >
                צור תצוגה מקדימה
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">תצוגה מקדימה</h3>
            <p className="text-gray-600 mb-4">
              מציג 20 רשומות ראשונות מהקובץ
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-2 px-3">תאריך</th>
                    <th className="text-right py-2 px-3">עובד</th>
                    <th className="text-right py-2 px-3">משמרת</th>
                    <th className="text-right py-2 px-3">שעות</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3">{row.date}</td>
                      <td className="py-2 px-3">{row.employee}</td>
                      <td className="py-2 px-3">{row.shift}</td>
                      <td className="py-2 px-3">{row.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors"
              >
                חזור למיפוי
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-colors"
              >
                אשר ויבא
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Import */}
        {currentStep === 4 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {loading ? '⏳' : '🎉'}
            </div>
            <h3 className="text-xl font-semibold mb-4">
              {loading ? 'מייבא נתונים...' : 'מוכן לייבוא'}
            </h3>
            <p className="text-gray-600 mb-6">
              {loading 
                ? 'הנתונים מועברים למערכת, אנא המתן...'
                : `מוכן לייבא ${previewData.length} רשומות למערכת`
              }
            </p>
            
            {!loading && (
              <button
                onClick={handleImport}
                className="bg-blue-500 text-white px-8 py-3 rounded-xl hover:bg-blue-600 transition-colors text-lg font-semibold"
              >
                ייבא נתונים
              </button>
            )}
            
            {loading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
