import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { ImportWizard } from '../components/ImportWizard';

function ImportPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);

  const handleImportComplete = (data: any[]) => {
    setImportedData(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <PageHeader
        title="יבוא נתונים"
        description="ייבא נתוני משמרות מקבצי CSV או Excel"
        onAddNew={() => setWizardOpen(true)}
        addButtonText="התחל יבוא חדש"
      />

      {/* Import History */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">היסטוריית יבואים</h2>
        
        {importedData.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <span className="text-lg">✅</span>
              יבוא אחרון הושלם בהצלחה
            </div>
            <p className="text-green-600 text-sm">
              יובאו {importedData.length} רשומות • {new Date().toLocaleDateString('he-IL')}
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>עדיין לא בוצעו יבואים</p>
            <p className="text-sm mt-2">לחץ על "התחל יבוא חדש" כדי להתחיל</p>
          </div>
        )}
      </div>

      <ImportWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={handleImportComplete}
      />
    </div>
  );
}

export default ImportPage;
