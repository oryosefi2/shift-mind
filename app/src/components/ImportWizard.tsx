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
  const [importMode, setImportMode] = useState<'append' | 'replace' | 'update'>('append');
  
  const { success, error } = useToast();

  const steps = [
    'העלאת קובץ',
    'זיהוי עמודות',
    'מיפוי שדות',
    'תצוגה מקדימה',
    'אפשרויות יבוא',
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
      // Mock import process with different behaviors based on import mode
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let message = '';
      switch (importMode) {
        case 'append':
          message = `✅ ${previewData.length} עובדים חדשים נוספו למערכת`;
          break;
        case 'update':
          message = `🔄 ${previewData.length} עובדים עודכנו/נוספו למערכת`;
          break;
        case 'replace':
          message = `⚠️ כל העובדים הוחלפו ב-${previewData.length} עובדים חדשים`;
          break;
      }
      
      success(message);
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
    setImportMode('append');
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
                className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors"
              >
                המשך לאפשרויות יבוא
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Import Options */}
        {currentStep === 4 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">אפשרויות יבוא</h3>
            <p className="text-gray-600 mb-6">
              בחר איך להתנהג כאשר עובד כבר קיים במערכת
            </p>
            
            <div className="space-y-4">
              {/* Append Mode */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  importMode === 'append' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setImportMode('append')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    importMode === 'append' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {importMode === 'append' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">➕ הוסף עובדים חדשים</h4>
                    <p className="text-gray-600 text-sm">
                      יוסיף רק עובדים חדשים ולא ישנה עובדים קיימים
                    </p>
                  </div>
                </div>
              </div>

              {/* Update Mode */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  importMode === 'update' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setImportMode('update')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    importMode === 'update' ? 'border-orange-500' : 'border-gray-300'
                  }`}>
                    {importMode === 'update' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">🔄 עדכן עובדים קיימים</h4>
                    <p className="text-gray-600 text-sm">
                      יעדכן נתונים של עובדים קיימים ויוסיף חדשים (מומלץ)
                    </p>
                  </div>
                </div>
              </div>

              {/* Replace Mode */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  importMode === 'replace' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setImportMode('replace')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    importMode === 'replace' ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    {importMode === 'replace' && <div className="w-3 h-3 rounded-full bg-red-500"></div>}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">⚠️ החלף את כל העובדים</h4>
                    <p className="text-gray-600 text-sm">
                      ימחק את כל העובדים הקיימים ויחליף בעובדים מהקובץ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {importMode === 'replace' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                  <span className="text-xl">⚠️</span>
                  זהירות! פעולה בלתי הפיכה
                </div>
                <p className="text-red-600 text-sm">
                  בחירה באפשרות זו תמחק לצמיתות את כל העובדים הקיימים במערכת.
                  וודא שיש לך גיבוי לפני המשך.
                </p>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(3)}
                className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors"
              >
                חזור לתצוגה מקדימה
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className={`px-6 py-2 rounded-xl transition-colors text-white font-semibold ${
                  importMode === 'replace' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : importMode === 'update'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {importMode === 'replace' ? 'החלף עובדים' : 
                 importMode === 'update' ? 'עדכן עובדים' : 
                 'הוסף עובדים'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Import */}
        {currentStep === 5 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {loading ? '⏳' : '🎉'}
            </div>
            <h3 className="text-xl font-semibold mb-4">
              {loading ? 'מייבא נתונים...' : 'מוכן לייבוא'}
            </h3>
            <p className="text-gray-600 mb-6">
              {loading 
                ? `מבצע ${importMode === 'replace' ? 'החלפה' : importMode === 'update' ? 'עדכון' : 'הוספה'} של נתונים למערכת...`
                : `מוכן ל${importMode === 'replace' ? 'החליף' : importMode === 'update' ? 'עדכן' : 'הוסיף'} ${previewData.length} עובדים במערכת`
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
