import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AuthState, AuthUser, LoginCredentials, RegisterCredentials, LoginResponse } from '../types/auth';
import { apiService } from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Check for existing token on app load
  useEffect(() => {
    const token = apiService.getToken();
    if (token) {
      // You could validate the token here if needed
      // For now, we'll assume the token is valid
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        // Note: We don't have user data from token alone
        // You might want to fetch user profile separately
      }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response: LoginResponse = await apiService.login(credentials);
      
      // Store the token in session storage
      apiService.setToken(response.data.token);
      
      // Create user object from response
      const user: AuthUser = {
        id: response.data.email, // Using email as ID for now
        email: response.data.email,
        username: response.data.email.split('@')[0], // Extract username from email
        is_pin_set: response.data.is_pin_set,
      };
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed. Please try again.',
      }));
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // TODO: Implement registration API call
      // For now, we'll simulate a successful registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: AuthUser = {
        id: '1',
        email: credentials.email,
        username: credentials.name,
        is_pin_set: false,
      };
      
      setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Registration failed. Please try again.',
      }));
    }
  };

  const logout = () => {
    // Remove token from session storage
    apiService.removeToken();
    
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 