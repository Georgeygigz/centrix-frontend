import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // For demo purposes, let's show the dashboard
  // In a real app, this would be controlled by the auth context
  const showDashboard = true;

  return (
    <AuthProvider>
      {showDashboard ? <Dashboard /> : <Auth />}
    </AuthProvider>
  );
}

export default App;
