import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { LoginPage } from "./components/LoginPage";
import { Home } from "./components/Home";

function App() {
  return (
    <AuthProvider>
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
            path="*" 
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
