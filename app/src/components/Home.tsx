import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, signOut, businessId: authBusinessId } = useAuth();
  const [businessName, setBusinessName] = useState<string>('');
  const [businessId, setBusinessId] = useState<string>(authBusinessId || user?.business_id || '11111111-1111-1111-1111-111111111111');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Sync auth businessId with local state
  useEffect(() => {
    if (authBusinessId) {
      setBusinessId(authBusinessId);
    }
  }, [authBusinessId]);

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ברוכים הבאים ל-ShiftMind
          </h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            התנתק
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">תפריט ראשי</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/settings/business"
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium text-gray-900">הגדרות עסק</div>
                <div className="text-sm text-gray-500">ניהול הגדרות כלליות</div>
              </div>
            </Link>

            <Link
              to="/employees"
              className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="font-medium text-gray-900">עובדים</div>
                <div className="text-sm text-gray-500">ניהול רשימת עובדים</div>
              </div>
            </Link>

            <Link
              to="/availability"
              className="p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📅</div>
                <div className="font-medium text-gray-900">זמינות</div>
                <div className="text-sm text-gray-500">הגדרת זמינות עובדים</div>
              </div>
            </Link>

            <Link
              to="/budgets"
              className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-medium text-gray-900">תקציבים</div>
                <div className="text-sm text-gray-500">ניהול תקציבי עבודה</div>
              </div>
            </Link>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">פרטי משתמש</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">אימייל: </span>
              <span className="text-blue-700">{user?.email || 'לא זמין'}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">מזהה עסק: </span>
              <span className="text-blue-700 font-mono">{authBusinessId || user?.business_id || businessId}</span>
            </div>
          </div>
        </div>
        
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
