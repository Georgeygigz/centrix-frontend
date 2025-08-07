import React, { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';

type AuthMode = 'login' | 'register';

const Auth: React.FC = () => {
  const [mode] = useState<AuthMode>('login');

  return (
    <div>
      {mode === 'login' ? (
        <LoginForm />
      ) : (
        <RegisterForm />
      )}
    </div>
  );
};

export default Auth; 