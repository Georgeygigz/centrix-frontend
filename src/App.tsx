import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

function App() {
  return (
    <AuthProvider>
      <Dashboard />
      {/* <Auth /> */}
    </AuthProvider>
  );
}

export default App;
