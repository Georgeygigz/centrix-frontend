import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/rbac';

interface PermissionGateProps {
  children: ReactNode;
  permissions?: Permission[];
  roles?: ('root' | 'super_admin' | 'admin' | 'user')[];
  fallback?: ReactNode;
  errorMessage?: string;
  showError?: boolean;
  mode?: 'any' | 'all';
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  roles = [],
  fallback = null,
  errorMessage = 'You do not have permission to access this feature.',
  showError = false,
  mode = 'any'
}) => {
  const userPermissions = usePermissions();

  // Check if user has required role
  const hasRequiredRole = () => {
    if (roles.length === 0) return true;
    return roles.includes(userPermissions.userRole);
  };

  // Check if user has required permissions
  const hasRequiredPermissions = () => {
    if (permissions.length === 0) return true;
    
    if (mode === 'all') {
      return userPermissions.hasAllPermissions(permissions);
    }
    
    return userPermissions.hasAnyPermission(permissions);
  };

  // Determine access
  const hasAccess = hasRequiredRole() && hasRequiredPermissions();

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show error message if requested
  if (showError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Access Denied
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{errorMessage}</p>
              {permissions.length > 0 && (
                <p className="mt-1">
                  Required permissions: {permissions.join(', ')}
                </p>
              )}
              {roles.length > 0 && (
                <p className="mt-1">
                  Required roles: {roles.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Don't render anything
  return null;
};

export default PermissionGate;
