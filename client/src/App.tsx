import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import DetermineNexus from './pages/DetermineNexus';
import ComplianceSubmissions from './pages/ComplianceSubmissions';
import SubmissionResources from './pages/SubmissionResources';
import Navbar from './components/Navbar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      {isAuthenticated && <Navbar onLogout={handleLogout} />}
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? <Home /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/nexus"
          element={
            isAuthenticated ? <DetermineNexus /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/compliance"
          element={
            isAuthenticated ? <ComplianceSubmissions /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/resources"
          element={
            isAuthenticated ? <SubmissionResources /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
