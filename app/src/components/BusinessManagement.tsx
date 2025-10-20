import { useState, useEffect } from 'react';

interface Business {
  id: string;
  name: string;
  industry: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = 'http://localhost:8084';

export function BusinessManagement() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    industry: '',
    timezone: 'Asia/Jerusalem'
  });

  // Load businesses from API
  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/businesses`);
      const data = await response.json();
      setBusinesses(data);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBusiness),
      });
      
      if (response.ok) {
        const createdBusiness = await response.json();
        setBusinesses([...businesses, createdBusiness]);
        setNewBusiness({ name: '', industry: '', timezone: 'Asia/Jerusalem' });
        setIsCreating(false);
      } else {
        console.error('Failed to create business');
      }
    } catch (error) {
      console.error('Error creating business:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול עסקים</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          + עסק חדש
        </button>
      </div>

      {/* יצירת עסק חדש */}
      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h2 className="text-lg font-semibold mb-4">יצירת עסק חדש</h2>
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                שם העסק
              </label>
              <input
                type="text"
                id="name"
                required
                value={newBusiness.name}
                onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="הכנס שם עסק..."
              />
            </div>
            
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                תחום עיסוק
              </label>
              <select
                id="industry"
                value={newBusiness.industry}
                onChange={(e) => setNewBusiness({ ...newBusiness, industry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר תחום...</option>
                <option value="retail">קמעונאות</option>
                <option value="restaurant">מסעדה</option>
                <option value="healthcare">בריאות</option>
                <option value="services">שירותים</option>
                <option value="manufacturing">ייצור</option>
                <option value="other">אחר</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                אזור זמן
              </label>
              <select
                id="timezone"
                value={newBusiness.timezone}
                onChange={(e) => setNewBusiness({ ...newBusiness, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Jerusalem">ישראל (Asia/Jerusalem)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">ניו יורק</option>
                <option value="Europe/London">לונדון</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                יצירה
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* רשימת עסקים */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>טוען עסקים...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>אין עסקים עדיין. צור עסק חדש כדי להתחיל!</p>
          </div>
        ) : (
          businesses.map((business) => (
            <div key={business.id} className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">{business.name}</h3>
              <p className="text-gray-600 text-sm mb-1">
                <span className="font-medium">תחום:</span> {business.industry || 'לא צוין'}
              </p>
              <p className="text-gray-600 text-sm mb-3">
                <span className="font-medium">אזור זמן:</span> {business.timezone}
              </p>
              <div className="flex gap-2">
                <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                  עריכה
                </button>
                <button className="text-green-500 hover:text-green-700 text-sm font-medium">
                  ניהול צוות
                </button>
                <button className="text-purple-500 hover:text-purple-700 text-sm font-medium">
                  משמרות
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
