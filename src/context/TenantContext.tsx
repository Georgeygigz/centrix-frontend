import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface School {
  id: string;
  name: string;
  identifier?: string;
  // Add other school properties as needed
}

interface TenantContextType {
  currentSchool: School | null;
  setCurrentSchool: (school: School | null) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set current school from user's school information
    if (user && user.school_id && user.school_name) {
      const school: School = {
        id: user.school_id,
        name: user.school_name,
      };
      setCurrentSchool(school);
      sessionStorage.setItem('currentSchool', JSON.stringify(school));
    } else {
      // Try to get current school from session storage as fallback
      const storedSchool = sessionStorage.getItem('currentSchool');
      if (storedSchool) {
        try {
          setCurrentSchool(JSON.parse(storedSchool));
        } catch (error) {
          console.error('Error parsing stored school:', error);
        }
      }
    }
    setIsLoading(false);
  }, [user]);

  const handleSetCurrentSchool = (school: School | null) => {
    setCurrentSchool(school);
    if (school) {
      sessionStorage.setItem('currentSchool', JSON.stringify(school));
    } else {
      sessionStorage.removeItem('currentSchool');
    }
  };

  return (
    <TenantContext.Provider value={{
      currentSchool,
      setCurrentSchool: handleSetCurrentSchool,
      isLoading
    }}>
      {children}
    </TenantContext.Provider>
  );
};
