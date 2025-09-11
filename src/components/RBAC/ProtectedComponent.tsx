import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/rbac';

interface ProtectedComponentProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRole?: 'root' | 'super_admin' | 'admin' | 'user' | 'parent';
  fallback?: ReactNode;
  showFallback?: boolean;
  mode?: 'any' | 'all'; // 'any' = has any permission, 'all' = has all permissions
}

const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  fallback = null,
  showFallback = false,
  mode = 'any'
}) => {
  const permissions = usePermissions();

  // Check role requirement
  const hasRequiredRole = () => {
    if (!requiredRole) return true;
    
    const roleHierarchy = {
      'user': 1,
      'parent': 1,
      'admin': 2,
      'super_admin': 3,
      'root': 4
    };
    
    const userRoleLevel = roleHierarchy[permissions.userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  // Check permission requirements
  const hasRequiredPermissions = () => {
    if (requiredPermissions.length === 0) return true;
    
    if (mode === 'all') {
      return permissions.hasAllPermissions(requiredPermissions);
    }
    
    return permissions.hasAnyPermission(requiredPermissions);
  };

  // Determine if component should be rendered
  const shouldRender = hasRequiredRole() && hasRequiredPermissions();

  if (shouldRender) {
    return <>{children}</>;
  }

  // Show fallback if specified
  if (showFallback) {
    return <>{fallback}</>;
  }

  // Don't render anything if no fallback
  return null;
};

export default ProtectedComponent;
