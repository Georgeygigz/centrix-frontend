import { useRBAC } from '../context/RBACContext';

// Custom hook for permission-based operations
export const usePermissions = () => {
  const rbac = useRBAC();

  return {
    // Basic permission checks
    canCreateSchool: () => rbac.hasPermission('create_school'),
    canViewAllSchools: () => rbac.hasPermission('view_all_schools'),
    canViewOwnSchool: () => rbac.hasPermission('view_own_school'),
    canRegisterUsers: () => rbac.hasPermission('register_users'),
    canAssignRootSuperAdmin: () => rbac.hasPermission('assign_root_super_admin'),
    canAssignAdmin: () => rbac.hasPermission('assign_admin'),
    canManageStudents: () => rbac.hasPermission('student_crud'),
    canViewStudents: () => rbac.hasPermission('view_students'),
    canViewAllUsers: () => rbac.hasPermission('view_all_users'),
    canViewSchoolUsers: () => rbac.hasPermission('view_school_users'),
    canManageUsers: () => rbac.hasPermission('manage_users'),
    canAccessReports: () => rbac.hasPermission('access_reports'),
    canAccessSettings: () => rbac.hasPermission('access_settings'),
    canAccessCustomerSupport: () => rbac.hasPermission('access_customer_support'),
    canAccessAdminPanel: () => rbac.hasPermission('access_admin_panel'),

    // Role-based checks
    isRoot: () => rbac.userRole === 'root',
    isSuperAdmin: () => rbac.userRole === 'super_admin',
    isAdmin: () => rbac.userRole === 'admin',
    isUser: () => rbac.userRole === 'user',
    isAtLeastAdmin: () => ['root', 'super_admin', 'admin'].includes(rbac.userRole),
    isAtLeastSuperAdmin: () => ['root', 'super_admin'].includes(rbac.userRole),

    // Student management permissions
    canCreateStudent: () => rbac.hasPermission('student_crud'),
    canUpdateStudent: () => rbac.hasPermission('student_crud'),
    canDeleteStudent: () => rbac.hasPermission('student_crud'),
    canBulkManageStudents: () => rbac.hasPermission('student_crud'),

    // User management permissions
    canCreateUser: () => rbac.hasPermission('manage_users'),
    canUpdateUser: () => rbac.hasPermission('manage_users'),
    canDeleteUser: () => rbac.hasPermission('manage_users'),
    canAssignRoles: () => rbac.hasAnyPermission(['assign_root_super_admin', 'assign_admin']),

    // Generic permission checks
    hasPermission: rbac.hasPermission,
    hasAnyPermission: rbac.hasAnyPermission,
    hasAllPermissions: rbac.hasAllPermissions,
    canAccess: rbac.canAccess,
    getRequiredRole: rbac.getRequiredRole,

    // Current user info
    userRole: rbac.userRole,
  };
};

// Hook for checking specific feature access
export const useFeatureAccess = () => {
  const permissions = usePermissions();

  return {
    // Feature access checks
    canAccessStudentsModule: () => permissions.canViewStudents(),
    canAccessUsersModule: () => permissions.canViewSchoolUsers() || permissions.canViewAllUsers(),
    canAccessReportsModule: () => permissions.canAccessReports(),
    canAccessSettingsModule: () => permissions.canAccessSettings(),
    canAccessCustomerSupportModule: () => permissions.canAccessCustomerSupport(),
    canAccessAdminPanelModule: () => permissions.canAccessAdminPanel(),
    
    // School management
    canManageSchools: () => permissions.canCreateSchool() || permissions.canViewAllSchools(),
    
    // Data management
    canExportData: () => permissions.isAtLeastAdmin(),
    canImportData: () => permissions.isAtLeastAdmin(),
    canViewAnalytics: () => permissions.canAccessReports(),
    
    // System administration
    canAccessSystemSettings: () => permissions.isAtLeastSuperAdmin(),
    canManageSystemUsers: () => permissions.canManageUsers(),
  };
};

// Hook for role-based UI rendering
export const useRoleBasedUI = () => {
  const permissions = usePermissions();

  return {
    // Show/hide UI elements based on role
    showAdminFeatures: () => permissions.isAtLeastAdmin(),
    showSuperAdminFeatures: () => permissions.isAtLeastSuperAdmin(),
    showRootFeatures: () => permissions.isRoot(),
    
    // Navigation visibility
    showUsersNavigation: () => permissions.canViewSchoolUsers() || permissions.canViewAllUsers(),
    showReportsNavigation: () => permissions.canAccessReports(),
    showSettingsNavigation: () => permissions.canAccessSettings(),
    showCustomerSupportNavigation: () => permissions.canAccessCustomerSupport(),
    showAdminPanelNavigation: () => permissions.canAccessAdminPanel(),
    
    // Action button visibility
    showCreateStudentButton: () => permissions.canCreateStudent(),
    showEditStudentButton: () => permissions.canUpdateStudent(),
    showDeleteStudentButton: () => permissions.canDeleteStudent(),
    showBulkActions: () => permissions.canBulkManageStudents(),
    
    // Form field visibility
    showAdvancedFields: () => permissions.isAtLeastAdmin(),
    showSystemFields: () => permissions.isAtLeastSuperAdmin(),
    
    // Permission checking
    hasPermission: permissions.hasPermission,
  };
};
