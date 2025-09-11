import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  RBACContextType
} from '../types/rbac';

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Get user role from auth context, default to 'user' if not available
  const userRole: UserRole = useMemo(() => {
    if (!user?.role) return 'user';
    
    // Ensure the role is valid
    const validRoles: UserRole[] = ['root', 'super_admin', 'admin', 'user', 'parent'];
    return validRoles.includes(user.role as UserRole) ? user.role as UserRole : 'user';
  }, [user?.role]);

  // Check if user has a specific permission
  const hasPermission = (permission: Permission): boolean => {
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    return userPermissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Check if user can access a feature based on required permissions
  const canAccess = (requiredPermissions: Permission[]): boolean => {
    if (requiredPermissions.length === 0) return true;
    return hasAnyPermission(requiredPermissions);
  };

  // Get the minimum role required for a specific permission
  const getRequiredRole = (permission: Permission): UserRole | null => {
    const roles: UserRole[] = ['root', 'super_admin', 'admin', 'user', 'parent'];
    
    for (const role of roles) {
      if (ROLE_PERMISSIONS[role].includes(permission)) {
        return role;
      }
    }
    
    return null;
  };

  // Get detailed permission check information (for future use)
  // const getPermissionCheck = (permission: Permission): PermissionCheck => {
  //   const hasPermissionResult = hasPermission(permission);
  //   const requiredRole = getRequiredRole(permission);
  //   
  //   return {
  //     hasPermission: hasPermissionResult,
  //     requiredRole: requiredRole || undefined,
  //     userRole
  //   };
  // };

  const value: RBACContextType = {
    userRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    getRequiredRole,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};
