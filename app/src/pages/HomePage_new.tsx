import { useEffect, useState } from 'react';

function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero Section - Enhanced Gradient */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-400 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 font-['Assistant'] transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            ברוכים הבאים ל-ShiftMind
          </h1>
          <p className={`text-lg md:text-xl text-blue-100 mb-8 font-light transition-all duration-1000 delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            מערכת ניהול משמרות חכמה עם בינה מלאכותית
          </p>
          <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block transition-all duration-1000 delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <p className="text-base">
              <span className="font-semibold">ID עסק:</span> demo-business-001
            </p>
            <p className="text-base mt-2">
              <span className="font-semibold">משתמש:</span> demo@shiftmind.com
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links Cards - Reordered */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center font-['Assistant']">
          קישורים מהירים
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Employees Card - First */}
          <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">👩‍💼</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 text-center">
              עובדים
            </h3>
            <p className="text-gray-500 mb-2 text-center text-sm font-light">
              ניהול צוות, תפקידים ושכר לשעה
            </p>
            <p className="text-xs text-blue-600 font-medium text-center mb-4">
              3 עובדים פעילים
            </p>
            <a 
              href="/employees" 
              className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center text-sm shadow-md hover:shadow-lg"
            >
              ניהול עובדים
            </a>
          </div>

          {/* Availability Card - Second */}
          <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '300ms' }}>
            <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">🕒</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 text-center">
              זמינות
            </h3>
            <p className="text-gray-500 mb-2 text-center text-sm font-light">
              הגדרת זמינות עובדים לימי השבוע
            </p>
            <p className="text-xs text-green-600 font-medium text-center mb-4">
              85% כיסוי זמינות
            </p>
            <a 
              href="/availability" 
              className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center text-sm shadow-md hover:shadow-lg"
            >
              הגדר זמינות
            </a>
          </div>

          {/* Budgets Card - Third */}
          <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '400ms' }}>
            <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">💰</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 text-center">
              תקציבים
            </h3>
            <p className="text-gray-500 mb-2 text-center text-sm font-light">
              ניהול תקציב שכר ומעקב הוצאות
            </p>
            <p className="text-xs text-orange-600 font-medium text-center mb-4">
              ₪12,750 / ₪15,000
            </p>
            <a 
              href="/budgets" 
              className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center text-sm shadow-md hover:shadow-lg"
            >
              ניהול תקציב
            </a>
          </div>

          {/* Settings Card - Fourth */}
          <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '500ms' }}>
            <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">⚙️</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 text-center">
              הגדרות
            </h3>
            <p className="text-gray-500 mb-2 text-center text-sm font-light">
              ניהול פרטי העסק, שעות פעילות ואזור זמן
            </p>
            <p className="text-xs text-gray-600 font-medium text-center mb-4">
              עודכן לאחרונה: היום
            </p>
            <a 
              href="/settings/business" 
              className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center text-sm shadow-md hover:shadow-lg"
            >
              פתח הגדרות
            </a>
          </div>
        </div>
      </div>

      {/* Main Feature - Schedule Board - Softer Green */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`bg-gradient-to-l from-green-400 to-green-500 rounded-2xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-102 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '600ms' }}>
            <div className="text-6xl mb-4 hover:scale-110 transition-transform duration-300">🗓️</div>
            <h2 className="text-3xl font-bold mb-4 font-['Assistant']">
              לוח משמרות אינטראקטיבי
            </h2>
            <p className="text-lg text-green-100 mb-6 font-light">
              גרור ושחרר משמרות • חישוב עלות בזמן אמת • מעקב תקציב חכם
            </p>
            <a 
              href="/schedule-board" 
              className="inline-block bg-white text-green-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gradient-to-r hover:from-white hover:to-green-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              📅 פתח לוח משמרות
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-['Assistant']">© ShiftMind 2025</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
