import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Auth from './pages/Auth';

function App() {
  return (
    <AuthProvider>
      <Auth />
    </AuthProvider>
  );
}

export default App;
