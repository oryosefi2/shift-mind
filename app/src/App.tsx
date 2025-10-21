import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { LoginPage } from "./components/LoginPage";
import { Home } from "./components/Home";
import { ToastProvider } from "./components/Toast";
import BusinessSettings from "./pages/BusinessSettings";
import Employees from "./pages/Employees";
import Availability from "./pages/Availability";
import Budgets from "./pages/Budgets";
import { Schedule } from "./pages/Schedule";
import { SeasonalProfiles } from "./pages/SeasonalProfiles";

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
                  <Home />
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
              path="/schedule" 
              element={
                <AuthGuard>
                  <Schedule />
                </AuthGuard>
              } 
            />
            <Route 
              path="/seasonal-profiles" 
              element={
                <AuthGuard>
                  <SeasonalProfiles />
                </AuthGuard>
              } 
            />
            <Route 
              path="*" 
              element={
                <AuthGuard>
                  <Home />
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
