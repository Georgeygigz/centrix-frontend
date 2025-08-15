# Role-Based Access Control (RBAC) Implementation

## 🎯 Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for the Centrix Frontend application. The system provides fine-grained permission control based on user roles and ensures secure access to different features and components.

## 🏗️ Architecture

### Core Components

1. **RBAC Types** (`src/types/rbac.ts`)
   - Defines role types, permissions, and interfaces
   - Contains permission matrix for each role

2. **RBAC Context** (`src/context/RBACContext.tsx`)
   - Provides RBAC functionality throughout the app
   - Manages user role and permission checks

3. **Permission Hooks** (`src/hooks/usePermissions.ts`)
   - Custom hooks for easy permission checking
   - Feature access and UI visibility helpers

4. **Protected Components** (`src/components/RBAC/`)
   - Reusable components for permission-based rendering
   - `ProtectedComponent` and `PermissionGate`

## 👥 Role Hierarchy

### 1. Root User 👑
- **Highest level of access**
- Can perform all operations in the system
- **Unique permissions:**
  - Create schools
  - View all schools
  - Register users
  - Assign root and super admin rights

### 2. Super Admin 🏫
- **School-level administrator**
- Can manage their school and assign admin rights
- **Key permissions:**
  - View own school
  - Assign admin rights
  - Manage users within their school
  - Full student CRUD operations

### 3. Admin 👨‍💼
- **School administrator**
- Can manage students and access reports
- **Permissions:**
  - View own school
  - Full student CRUD operations
  - Access reports and settings

### 4. User 👤
- **Basic user**
- Limited access for viewing data
- **Permissions:**
  - View own school
  - View students (read-only)

## 🔐 Permission Matrix

| Permission | Root | Super Admin | Admin | User |
|------------|------|-------------|-------|------|
| `create_school` | ✅ | ❌ | ❌ | ❌ |
| `view_all_schools` | ✅ | ❌ | ❌ | ❌ |
| `view_own_school` | ✅ | ✅ | ✅ | ✅ |
| `register_users` | ✅ | ❌ | ❌ | ❌ |
| `assign_root_super_admin` | ✅ | ❌ | ❌ | ❌ |
| `assign_admin` | ✅ | ✅ | ❌ | ❌ |
| `student_crud` | ✅ | ✅ | ✅ | ❌ |
| `view_students` | ✅ | ✅ | ✅ | ✅ |
| `view_all_users` | ✅ | ❌ | ❌ | ❌ |
| `view_school_users` | ✅ | ✅ | ❌ | ❌ |
| `manage_users` | ✅ | ✅ | ❌ | ❌ |
| `access_reports` | ✅ | ✅ | ✅ | ❌ |
| `access_settings` | ✅ | ✅ | ✅ | ❌ |
| `access_customer_support` | ✅ | ✅ | ❌ | ❌ |

## 🛠️ Usage Guide

### 1. Basic Permission Checking

```tsx
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const permissions = usePermissions();

  return (
    <div>
      {permissions.canCreateSchool() && (
        <button>Create School</button>
      )}
      
      {permissions.isAtLeastAdmin() && (
        <div>Admin-only content</div>
      )}
    </div>
  );
};
```

### 2. Using Protected Components

```tsx
import { ProtectedComponent } from '../components/RBAC';

const MyComponent = () => {
  return (
    <ProtectedComponent 
      requiredPermissions={['student_crud']}
      fallback={<div>Access denied</div>}
      showFallback={true}
    >
      <div>Student management panel</div>
    </ProtectedComponent>
  );
};
```

### 3. Using Permission Gates

```tsx
import { PermissionGate } from '../components/RBAC';

const MyComponent = () => {
  return (
    <PermissionGate 
      permissions={['create_school']}
      roles={['root']}
      showError={true}
      errorMessage="Only Root users can create schools"
    >
      <div>School creation form</div>
    </PermissionGate>
  );
};
```

### 4. Feature Access Checking

```tsx
import { useFeatureAccess } from '../hooks/usePermissions';

const MyComponent = () => {
  const features = useFeatureAccess();

  return (
    <div>
      {features.canAccessStudentsModule() && (
        <Link to="/students">Students</Link>
      )}
      
      {features.canManageSchools() && (
        <Link to="/schools">Schools</Link>
      )}
    </div>
  );
};
```

### 5. Role-Based UI Rendering

```tsx
import { useRoleBasedUI } from '../hooks/usePermissions';

const MyComponent = () => {
  const ui = useRoleBasedUI();

  return (
    <div>
      {ui.showAdminFeatures() && (
        <div>Admin features</div>
      )}
      
      {ui.showCreateStudentButton() && (
        <button>Add Student</button>
      )}
    </div>
  );
};
```

## 🔧 Available Hooks

### `usePermissions()`
Provides basic permission checking functions:

```tsx
const permissions = usePermissions();

// Basic permission checks
permissions.canCreateSchool()
permissions.canViewStudents()
permissions.canManageUsers()

// Role checks
permissions.isRoot()
permissions.isSuperAdmin()
permissions.isAdmin()
permissions.isUser()
permissions.isAtLeastAdmin()
permissions.isAtLeastSuperAdmin()

// Generic checks
permissions.hasPermission('create_school')
permissions.hasAnyPermission(['create_school', 'view_schools'])
permissions.hasAllPermissions(['student_crud', 'view_students'])
```

### `useFeatureAccess()`
Provides feature-level access checking:

```tsx
const features = useFeatureAccess();

features.canAccessStudentsModule()
features.canAccessUsersModule()
features.canAccessReportsModule()
features.canManageSchools()
features.canExportData()
features.canImportData()
```

### `useRoleBasedUI()`
Provides UI visibility helpers:

```tsx
const ui = useRoleBasedUI();

ui.showAdminFeatures()
ui.showSuperAdminFeatures()
ui.showCreateStudentButton()
ui.showUsersNavigation()
ui.showReportsNavigation()
```

## 🎨 Available Components

### `ProtectedComponent`
A flexible component for conditional rendering based on permissions:

```tsx
<ProtectedComponent 
  requiredPermissions={['student_crud']}
  requiredRole="admin"
  fallback={<div>Access denied</div>}
  showFallback={true}
  mode="any" // or "all"
>
  <div>Protected content</div>
</ProtectedComponent>
```

**Props:**
- `requiredPermissions`: Array of required permissions
- `requiredRole`: Minimum required role
- `fallback`: Content to show when access is denied
- `showFallback`: Whether to show fallback content
- `mode`: "any" (has any permission) or "all" (has all permissions)

### `PermissionGate`
A more declarative component with error handling:

```tsx
<PermissionGate 
  permissions={['create_school']}
  roles={['root']}
  fallback={<div>Custom fallback</div>}
  errorMessage="Access denied message"
  showError={true}
  mode="any"
>
  <div>Protected content</div>
</PermissionGate>
```

**Props:**
- `permissions`: Array of required permissions
- `roles`: Array of allowed roles
- `fallback`: Custom fallback content
- `errorMessage`: Error message to display
- `showError`: Whether to show error message
- `mode`: "any" or "all"

## 🔄 Integration with Existing Components

### Sidebar Navigation
The sidebar automatically filters navigation items based on user permissions:

```tsx
// Navigation items are automatically filtered
const navigationItems: NavigationItem[] = [
  {
    id: 'students',
    label: 'Students',
    icon: FaUserGraduate,
    requiredPermissions: ['view_students'],
  },
  {
    id: 'users',
    label: 'Users',
    icon: FaUsers,
    requiredPermissions: ['view_school_users', 'view_all_users'],
  },
];
```

### Students Component
The Students component uses RBAC for action buttons and dropdowns:

```tsx
// Add button is protected
<PermissionGate permissions={['student_crud']}>
  <button onClick={openAddDrawer}>+ Add Student</button>
</PermissionGate>

// Dropdown actions are protected
<PermissionGate permissions={['student_crud']}>
  <button onClick={handleEdit}>Edit</button>
  <button onClick={handleDelete}>Delete</button>
</PermissionGate>
```

## 🚀 Setup Instructions

### 1. Provider Setup
Ensure the RBAC provider is wrapped around your app:

```tsx
// App.tsx
import { RBACProvider } from './context/RBACContext';

function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <TenantProvider>
          <AppContent />
        </TenantProvider>
      </RBACProvider>
    </AuthProvider>
  );
}
```

### 2. User Role Integration
The system automatically reads the user role from the auth context:

```tsx
// AuthContext.tsx
const user: AuthUser = {
  // ... other fields
  role: userInfo.role || 'user', // This is used by RBAC
};
```

### 3. Backend Integration
Ensure your backend returns the user role in the `/me` endpoint or JWT token:

```json
{
  "id": "123",
  "email": "user@example.com",
  "role": "admin",
  "school_id": "456"
}
```

## 🧪 Testing

### Demo Component
Use the `RBACExample` component to test all RBAC features:

```tsx
import RBACExample from './components/RBAC/RBACExample';

// Add to your routes for testing
<Route path="/rbac-demo" element={<RBACExample />} />
```

### Testing Different Roles
To test different roles, modify the user role in the auth context or backend response.

## 🔒 Security Considerations

1. **Frontend Only**: This RBAC system is for UI control only
2. **Backend Validation**: Always validate permissions on the backend
3. **Token Security**: Ensure JWT tokens contain role information
4. **Role Hierarchy**: Respect the role hierarchy in permission checks
5. **Default Deny**: Default to denying access unless explicitly allowed

## 📝 Best Practices

1. **Use Specific Permissions**: Prefer specific permissions over role checks
2. **Consistent Naming**: Use consistent permission naming conventions
3. **Fallback Content**: Always provide meaningful fallback content
4. **Error Messages**: Provide clear error messages for denied access
5. **Performance**: Use memoization for expensive permission checks
6. **Testing**: Test all permission combinations thoroughly

## 🔄 Extending the System

### Adding New Permissions
1. Add to the `Permission` type in `src/types/rbac.ts`
2. Add to the `ROLE_PERMISSIONS` matrix
3. Add helper functions to `usePermissions` hook

### Adding New Roles
1. Add to the `UserRole` type
2. Update the `ROLE_PERMISSIONS` matrix
3. Add role-specific helper functions

### Adding New Components
1. Create reusable components in `src/components/RBAC/`
2. Export from the index file
3. Document usage and props

## 🎉 Conclusion

This RBAC system provides a comprehensive, maintainable, and secure way to control access to different features in your application. It's designed to be easy to use, flexible, and scalable for future requirements.

For questions or issues, refer to the example components and test cases provided in the codebase.
