import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Dashboard /> : <Auth />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
