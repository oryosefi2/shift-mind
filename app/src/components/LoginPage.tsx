import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signIn, user } = useAuth();

  // If user is already authenticated, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('אנא הזן כתובת אימייל');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await signIn(email);

    if (error) {
      setMessage('שגיאה בהתחברות. אנא נסה שוב.');
    } else {
      setMessage('התחברות בוצעה בהצלחה!');
    }

    setLoading(false);
  };

  const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'simple';

  const handleDemoLogin = async () => {
    setLoading(true);
    setMessage('');
    
    const { error } = await signIn('demo@shiftmind.com');
    
    if (error) {
      setMessage('שגיאה בכניסה לדמו. אנא נסה שוב.');
    } else {
      setMessage('התחברות בוצעה בהצלחה!');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600 font-['Assistant']">
              ShiftMind 🧠
            </h1>
          </div>
        </div>
      </div>

      {/* Login Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-3xl font-bold text-gray-800 font-['Assistant']">
                התחברות למערכת
              </h2>
              <p className="mt-2 text-gray-600">
                מערכת ניהול משמרות חכמה עם בינה מלאכותית
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  כתובת אימייל
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {loading ? 'שולח קישור...' : 'שלח קישור התחברות'}
              </button>

              {/* Demo Login Option */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">או</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold border-2 transition-colors ${
                  loading
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'border-blue-500 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {loading ? 'מתחבר...' : 'כניסה עם משתמש demo'}
              </button>

              {message && (
                <div className={`text-center p-3 rounded-xl font-medium ${
                  message.includes('שגיאה') 
                    ? 'text-red-600 bg-red-50 border border-red-200' 
                    : 'text-green-600 bg-green-50 border border-green-200'
                }`}>
                  {message}
                </div>
              )}
            </form>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-['Assistant']">
              © ShiftMind 2025 • מערכת ניהול משמרות מתקדמת
            </p>
            {authProvider === 'simple' && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-xl">
                מצב פיתוח: אימות מקומי פעיל
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};