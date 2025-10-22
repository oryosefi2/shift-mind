

function Navbar() {
  return (
    <nav className="bg-white shadow-lg border-b border-gray-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold text-blue-600 font-['Assistant']">
                ShiftMind 🧠
              </h1>
            </a>
          </div>
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-reverse space-x-6">
            <a 
              href="/settings/business" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="הגדרות עסק"
            >
              <span className="text-xl">⚙️</span>
              <span className="text-xs mt-1 hidden sm:block">הגדרות</span>
            </a>
            
            <a 
              href="/employees" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="עובדים"
            >
              <span className="text-xl">👩‍💼</span>
              <span className="text-xs mt-1 hidden sm:block">עובדים</span>
            </a>
            
            <a 
              href="/availability" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="זמינות"
            >
              <span className="text-xl">🕒</span>
              <span className="text-xs mt-1 hidden sm:block">זמינות</span>
            </a>
            
            <a 
              href="/budgets" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="תקציבים"
            >
              <span className="text-xl">💰</span>
              <span className="text-xs mt-1 hidden sm:block">תקציבים</span>
            </a>
            
            <a 
              href="/seasonal-profiles" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="פרופילים עונתיים"
            >
              <span className="text-xl">📈</span>
              <span className="text-xs mt-1 hidden sm:block">פרופילים</span>
            </a>

            <a 
              href="/ai-forecast" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="תחזית AI"
            >
              <span className="text-xl">🤖</span>
              <span className="text-xs mt-1 hidden sm:block">תחזית AI</span>
            </a>

            <a 
              href="/automations" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="אוטומציות"
            >
              <span className="text-xl">🔄</span>
              <span className="text-xs mt-1 hidden sm:block">אוטומציות</span>
            </a>

            <a 
              href="/import" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="יבוא נתונים"
            >
              <span className="text-xl">📂</span>
              <span className="text-xs mt-1 hidden sm:block">יבוא</span>
            </a>
            
            <a 
              href="/schedule-board" 
              className="flex flex-col items-center bg-blue-500 text-white px-3 py-2 rounded-xl hover:bg-blue-600 transition-colors"
              title="לוח משמרות"
            >
              <span className="text-xl">🗓️</span>
              <span className="text-xs mt-1">לוח משמרות</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
