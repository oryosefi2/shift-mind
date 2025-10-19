import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.tsx'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                ברוכים הבאים ל-ShiftMind
              </h1>
              <p className="text-xl text-gray-600">
                פלטפורמה מתקדמת עם AI
              </p>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
