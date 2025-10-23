import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { LoginPage } from "./components/LoginPage";
import { ToastProvider } from "./components/Toast";
import BusinessSettings from "./pages/BusinessSettings";
import Employees from "./pages/Employees";
import Availability from "./pages/Availability";
import Budgets from "./pages/Budgets";
import HomePage from "./pages/HomePage";
import ScheduleBoard from "./pages/ScheduleBoard";
import SeasonalProfiles from "./pages/SeasonalProfiles";
import AIForecast from "./pages/AIForecast";
import Automations from "./pages/Automations";
import ImportPage from "./pages/ImportPage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/" 
              element={
                <AuthGuard>
                  <HomePage />
                </AuthGuard>
              }
            />
            <Route 
              path="/schedule" 
              element={
                <AuthGuard>
                  <ScheduleBoard />
                </AuthGuard>
              }
            />
            <Route 
              path="/employees" 
              element={
                <AuthGuard>
                  <Employees />
                </AuthGuard>
              }
            />
            <Route 
              path="/availability" 
              element={
                <AuthGuard>
                  <Availability />
                </AuthGuard>
              }
            />
            <Route 
              path="/budgets" 
              element={
                <AuthGuard>
                  <Budgets />
                </AuthGuard>
              }
            />
            <Route 
              path="/employees/new" 
              element={
                <AuthGuard>
                  <Employees />
                </AuthGuard>
              }
            />
            <Route 
              path="/settings/business" 
              element={
                <AuthGuard>
                  <BusinessSettings />
                </AuthGuard>
              }
            />
            <Route 
              path="/settings/seasonal" 
              element={
                <AuthGuard>
                  <SeasonalProfiles />
                </AuthGuard>
              }
            />
            <Route 
              path="/ai-forecast" 
              element={
                <AuthGuard>
                  <AIForecast />
                </AuthGuard>
              }
            />
            <Route 
              path="/automations" 
              element={
                <AuthGuard>
                  <Automations />
                </AuthGuard>
              }
            />
            <Route 
              path="/import" 
              element={
                <AuthGuard>
                  <ImportPage />
                </AuthGuard>
              }
            />
            <Route 
              path="*" 
              element={
                <AuthGuard>
                  <HomePage />
                </AuthGuard>
              } 
            />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
