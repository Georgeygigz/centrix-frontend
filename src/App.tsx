import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { RBACProvider } from './context/RBACContext';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <Dashboard /> : <Auth />;
}


function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <TenantProvider>
          <AppContent />
        </TenantProvider>
      </RBACProvider>
    </AuthProvider>
  );
}

export default App;
