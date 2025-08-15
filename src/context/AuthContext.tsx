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
    isLoading: true, // Start with loading true to prevent flash
    error: null,
  });

  // Check for existing token on app load
  useEffect(() => {
    const token = apiService.getToken();
    
    if (token) {
      // Fetch user data when app loads with existing token
      const fetchUserData = async () => {
        try {
          const userInfo = await apiService.getCurrentUser();
          
          const user: AuthUser = {
            id: userInfo.data?.id || userInfo.id || 'unknown',
            email: userInfo.data?.email || userInfo.email || '',
            username: userInfo.data?.first_name || userInfo.data?.username || userInfo.username || 'user',
            is_pin_set: userInfo.data?.is_pin_set || userInfo.is_pin_set || false,
            school_id: userInfo.data?.school?.id || userInfo.school?.id || userInfo.school_id || '',
            school_name: userInfo.data?.school?.name || userInfo.school?.name || userInfo.school_name || '',
            role: userInfo.data?.role || userInfo.role || 'user',
          };
          
          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to fetch user data on app load:', error);
          // If we can't fetch user data, clear the token
          apiService.removeToken();
          setState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      };
      
      fetchUserData();
    } else {
      // No token found, set loading to false
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {

      
      // Use credentials as is (school is determined by backend from user)
      const loginData = {
        ...credentials,
      };

      const response: LoginResponse = await apiService.login(loginData);
      
      // Clear any existing tokens first
      sessionStorage.removeItem('authToken');
      
      // Store the token in session storage
      if (response.data && response.data.token) {
        sessionStorage.setItem('authToken', response.data.token);
      }
      
      // Fetch complete user information including school details
      const userInfo = await apiService.getCurrentUser();
      
      // Create user object from complete user info with proper null checks
      const user: AuthUser = {
        id: userInfo.data?.id || userInfo.id || 'unknown',
        email: userInfo.data?.email || userInfo.email || '',
        username: userInfo.data?.first_name || userInfo.data?.username || userInfo.username || 'user', // Use first_name from /me endpoint
        is_pin_set: userInfo.data?.is_pin_set || userInfo.is_pin_set || false,
        school_id: userInfo.data?.school?.id || userInfo.school?.id || userInfo.school_id || '',
        school_name: userInfo.data?.school?.name || userInfo.school?.name || userInfo.school_name || '',
        role: userInfo.data?.role || userInfo.role || 'user',
      };
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Login error in AuthContext:', error);
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
        school_id: '',
        school_name: '',
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