// Role types based on your backend implementation
export type UserRole = 'root' | 'super_admin' | 'admin' | 'user';

// Permission types for different operations
export type Permission = 
  | 'create_school'
  | 'view_all_schools'
  | 'view_own_school'
  | 'register_users'
  | 'assign_root_super_admin'
  | 'assign_admin'
  | 'student_crud'
  | 'view_students'
  | 'view_all_users'
  | 'view_school_users'
  | 'manage_users'
  | 'access_reports'
  | 'access_settings'
  | 'access_customer_support';

// Permission matrix defining what each role can do
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  root: [
    'create_school',
    'view_all_schools',
    'view_own_school',
    'register_users',
    'assign_root_super_admin',
    'assign_admin',
    'student_crud',
    'view_students',
    'view_all_users',
    'view_school_users',
    'manage_users',
    'access_reports',
    'access_settings',
    'access_customer_support'
  ],
  super_admin: [
    'view_own_school',
    'assign_admin',
    'student_crud',
    'view_students',
    'view_school_users',
    'manage_users',
    'access_reports',
    'access_settings',
    'access_customer_support'
  ],
  admin: [
    'view_own_school',
    'student_crud',
    'view_students',
    'access_reports',
    'access_settings'
  ],
  user: [
    'view_own_school',
    'view_students'
  ]
};

// Navigation items with role-based visibility
export interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  requiredPermissions?: Permission[];
  children?: NavigationItem[];
  hidden?: boolean;
}

// Permission check result
export interface PermissionCheck {
  hasPermission: boolean;
  requiredRole?: UserRole;
  userRole: UserRole;
}

// RBAC context type
export interface RBACContextType {
  userRole: UserRole;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccess: (requiredPermissions: Permission[]) => boolean;
  getRequiredRole: (permission: Permission) => UserRole | null;
}
