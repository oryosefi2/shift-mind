import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
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

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            התחברות למערכת
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {authProvider === 'simple' 
              ? 'הזן את כתובת האימייל שלך להתחברות (דמו)'
              : 'הזן את כתובת האימייל שלך להתחברות'
            }
          </p>
          {authProvider === 'simple' && (
            <div className="mt-2 text-center text-xs text-blue-600 bg-blue-50 p-2 rounded">
              מצב פיתוח: אימות מקומי ללא בדיקת סיסמה
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </div>

          {message && (
            <div className={`text-center p-2 rounded ${
              message.includes('שגיאה') 
                ? 'text-red-600 bg-red-50' 
                : 'text-green-600 bg-green-50'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            מערכת ניהול משמרות - שיפטמיינד | Auth Provider: {authProvider}
          </p>
        </div>
      </div>
    </div>
  );
};