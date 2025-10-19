function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">ShiftMind</h1>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
              בית
            </a>
            <a href="/about" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
              אודות
            </a>
            <a href="/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
              צור קשר
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
