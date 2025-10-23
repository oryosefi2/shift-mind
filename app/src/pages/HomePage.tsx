import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userName = "מנהל המערכת"; // This could come from user context/auth
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Handle click outside to close menu
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header with User Profile Menu */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ShiftMind</h1>
            </div>
            
            {/* User Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-5 h-5 text-gray-600 flex items-center justify-center text-sm">👤</div>
                <span className="text-sm font-medium text-gray-700">{userName}</span>
                <div className={`w-4 h-4 text-gray-500 transition-transform flex items-center justify-center text-xs ${isUserMenuOpen ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/');
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right"
                    >
                      <div className="w-4 h-4 flex items-center justify-center text-sm">🏠</div>
                      מסך הבית
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings/business');
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right"
                    >
                      <div className="w-4 h-4 flex items-center justify-center text-sm">⚙️</div>
                      הגדרות עסק
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        try {
                          await signOut();
                          success('התנתקת בהצלחה');
                          navigate('/login');
                        } catch (err) {
                          console.error('Error signing out:', err);
                          error('שגיאה בהתנתקות');
                          // Even on error, redirect to login
                          navigate('/login');
                        }
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right"
                    >
                      <div className="w-4 h-4 flex items-center justify-center text-sm">🚪</div>
                      התנתקות
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Message */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className={`text-blue-800 font-medium transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            ברוך הבא, {userName}! 👋
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary CTA - Create Weekly Schedule */}
        <div className={`mb-8 transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <a
            href="/schedule"
            className="block bg-gradient-to-l from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-102 group"
          >
            <div className="text-center">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🗓️</div>
              <h2 className="text-2xl font-bold mb-3">צור סידור שבועי</h2>
              <p className="text-green-100 text-lg font-light">
                התחל לארגן את המשמרות השבועיות בלוח החכם
              </p>
            </div>
          </a>
        </div>

        {/* Main Feature Cards - 3x3 Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Employees Card */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-blue-600 text-xl">👥</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">עובדים</h3>
                <p className="text-sm text-gray-600">3 עובדים פעילים</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              ניהול צוות העובדים, הגדרת תפקידים ושכר לשעה
            </p>
            <a 
              href="/employees"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              ניהול עובדים ←
            </a>
          </div>

          {/* Availability Card */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-green-600 text-xl">⏰</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">זמינות</h3>
                <p className="text-sm text-gray-600">85% כיסוי זמינות</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              הגדרת זמינות עובדים לימי השבוע ושעות העבודה
            </p>
            <a 
              href="/availability"
              className="inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
            >
              הגדר זמינות ←
            </a>
          </div>

          {/* Budgets Card */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '300ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-orange-600 text-xl">💰</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">תקציבים</h3>
                <p className="text-sm text-gray-600">₪12,750 / ₪15,000</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              ניהול תקציב שכר ומעקב הוצאות שבועיות וחודשיות
            </p>
            <a 
              href="/budgets"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
            >
              ניהול תקציב ←
            </a>
          </div>

          {/* Business Settings Card */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '400ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-gray-600 text-xl">⚙️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">הגדרות עסק</h3>
                <p className="text-sm text-gray-600">עודכן לאחרונה היום</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              ניהול פרטי העסק, שעות פעילות ואזור זמן
            </p>
            <a 
              href="/settings/business"
              className="inline-flex items-center text-gray-600 hover:text-gray-700 font-medium text-sm transition-colors"
            >
              פתח הגדרות ←
            </a>
          </div>

          {/* Seasonal Profiles Card */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '500ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-purple-600 text-xl">🌸</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">פרופילים עונתיים</h3>
                <p className="text-sm text-gray-600">2 פרופילים פעילים</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              הגדרת דפוסי ביקוש עונתיים, חגים ואירועים מיוחדים
            </p>
            <a 
              href="/settings/seasonal"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
            >
              ניהול עונתיות ←
            </a>
          </div>

          {/* AI Forecast Card */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '600ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-cyan-600 text-xl">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">תחזיות AI</h3>
                <p className="text-sm text-gray-600">רמת ביטחון 94%</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              תחזיות ביקוש חכמות על בסיס בינה מלאכותית ונתונים היסטוריים
            </p>
            <a 
              href="/ai-forecast"
              className="inline-flex items-center text-cyan-600 hover:text-cyan-700 font-medium text-sm transition-colors"
            >
              צפה בתחזיות ←
            </a>
          </div>

          {/* Automations Card */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '700ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-indigo-600 text-xl">⚡</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">אוטומציות</h3>
                <p className="text-sm text-gray-600">3 משימות פעילות</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              ניהול משימות אוטומטיות, תזמון ומעקב אחר ביצוע
            </p>
            <a 
              href="/automations"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
            >
              ניהול אוטומציות ←
            </a>
          </div>

          {/* Import Data Card */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '800ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-emerald-600 text-xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">יבוא נתונים</h3>
                <p className="text-sm text-gray-600">5 יבואים השבוע</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              יבוא עובדים, זמינות וסידורי עבודה מקבצי CSV ו-Excel
            </p>
            <a 
              href="/import"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
            >
              התחל יבוא ←
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">© 2025 ShiftMind. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
