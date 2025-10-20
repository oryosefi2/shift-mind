import { useState, useEffect } from 'react';

interface Business {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  hourly_rate: number | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';

export function Home() {
  const [businessName, setBusinessName] = useState<string>('');
  const [businessId, setBusinessId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch business name on component mount
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/businesses`);
        if (!response.ok) {
          throw new Error('Failed to fetch businesses');
        }
        const businesses: Business[] = await response.json();
        if (businesses.length > 0) {
          setBusinessName(businesses[0].name);
        }
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setError('שגיאה בטעינת נתוני עסקים');
      }
    };

    fetchBusinesses();
  }, []);

  const fetchEmployees = async () => {
    if (!businessId.trim()) {
      setError('נא להזין מזהה עסק');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/employees?business_id=${businessId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const employeesData: Employee[] = await response.json();
      setEmployees(employeesData);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('שגיאה בטעינת נתוני עובדים');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          ברוכים הבאים ל-ShiftMind
        </h1>
        
        {/* Business Name Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">שם העסק:</h2>
          <p className="text-lg text-blue-600 font-medium">
            {businessName || 'טוען...'}
          </p>
        </div>

        {/* Employee Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">ניהול עובדים</h2>
          
          <div className="mb-4 flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="businessId" className="block text-sm font-medium text-gray-700 mb-2">
                מזהה עסק:
              </label>
              <input
                id="businessId"
                type="text"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="הזן מזהה עסק"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchEmployees}
              disabled={loading}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'טוען...' : 'טען עובדים'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Employees Table */}
          {employees.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      שם פרטי
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      שם משפחה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      אימייל
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      שכר שעתי
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.hourly_rate ? `₪${employee.hourly_rate}` : 'לא מוגדר'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {employees.length === 0 && !loading && !error && (
            <div className="text-center py-8 text-gray-500">
              לחץ על "טען עובדים" כדי לראות רשימת עובדים
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
