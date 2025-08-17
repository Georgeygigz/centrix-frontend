import React from 'react';
import { usePermissions, useFeatureAccess, useRoleBasedUI } from '../../hooks/usePermissions';
import { PermissionGate, ProtectedComponent } from './index';
import { FaUser, FaUserTie, FaUserShield, FaCrown, FaSchool, FaUsers, FaChartBar, FaCog } from 'react-icons/fa';

const RBACExample: React.FC = () => {
  const permissions = usePermissions();
  const features = useFeatureAccess();
  const ui = useRoleBasedUI();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Role-Based Access Control Demo</h1>
          <p className="text-gray-600 mb-4">
            This page demonstrates the comprehensive RBAC system implementation.
          </p>
          
          {/* Current User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {permissions.isRoot() && FaCrown({ className: "w-5 h-5 text-yellow-600" })}
                {permissions.isSuperAdmin() && FaUserShield({ className: "w-5 h-5 text-purple-600" })}
                {permissions.isAdmin() && FaUserTie({ className: "w-5 h-5 text-blue-600" })}
                {permissions.isUser() && FaUser({ className: "w-5 h-5 text-gray-600" })}
                <span className="font-semibold text-gray-900">Current Role:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                  {permissions.userRole.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Basic Permissions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              {FaUser({ className: "w-5 h-5 mr-2 text-blue-600" })}
              Basic Permissions
            </h2>
            <div className="space-y-3">
              <PermissionItem 
                label="Create School" 
                hasPermission={permissions.canCreateSchool()} 
                requiredRole="root"
              />
              <PermissionItem 
                label="View All Schools" 
                hasPermission={permissions.canViewAllSchools()} 
                requiredRole="root"
              />
              <PermissionItem 
                label="View Own School" 
                hasPermission={permissions.canViewOwnSchool()} 
                requiredRole="user"
              />
              <PermissionItem 
                label="Register Users" 
                hasPermission={permissions.canRegisterUsers()} 
                requiredRole="root"
              />
              <PermissionItem 
                label="Assign Root/Super Admin" 
                hasPermission={permissions.canAssignRootSuperAdmin()} 
                requiredRole="root"
              />
              <PermissionItem 
                label="Assign Admin" 
                hasPermission={permissions.canAssignAdmin()} 
                requiredRole="super_admin"
              />
            </div>
          </div>

          {/* Student Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              {FaSchool({ className: "w-5 h-5 mr-2 text-green-600" })}
              Student Management
            </h2>
            <div className="space-y-3">
              <PermissionItem 
                label="View Students" 
                hasPermission={permissions.canViewStudents()} 
                requiredRole="user"
              />
              <PermissionItem 
                label="Create Student" 
                hasPermission={permissions.canCreateStudent()} 
                requiredRole="admin"
              />
              <PermissionItem 
                label="Update Student" 
                hasPermission={permissions.canUpdateStudent()} 
                requiredRole="admin"
              />
              <PermissionItem 
                label="Delete Student" 
                hasPermission={permissions.canDeleteStudent()} 
                requiredRole="admin"
              />
              <PermissionItem 
                label="Bulk Manage Students" 
                hasPermission={permissions.canBulkManageStudents()} 
                requiredRole="admin"
              />
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              {FaUsers({ className: "w-5 h-5 mr-2 text-purple-600" })}
              User Management
            </h2>
            <div className="space-y-3">
              <PermissionItem 
                label="View All Users" 
                hasPermission={permissions.canViewAllUsers()} 
                requiredRole="root"
              />
              <PermissionItem 
                label="View School Users" 
                hasPermission={permissions.canViewSchoolUsers()} 
                requiredRole="super_admin"
              />
              <PermissionItem 
                label="Create User" 
                hasPermission={permissions.canCreateUser()} 
                requiredRole="super_admin"
              />
              <PermissionItem 
                label="Update User" 
                hasPermission={permissions.canUpdateUser()} 
                requiredRole="super_admin"
              />
              <PermissionItem 
                label="Delete User" 
                hasPermission={permissions.canDeleteUser()} 
                requiredRole="super_admin"
              />
              <PermissionItem 
                label="Assign Roles" 
                hasPermission={permissions.canAssignRoles()} 
                requiredRole="super_admin"
              />
            </div>
          </div>

          {/* System Features */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              {FaCog({ className: "w-5 h-5 mr-2 text-gray-600" })}
              System Features
            </h2>
            <div className="space-y-3">
              <PermissionItem 
                label="Access Reports" 
                hasPermission={permissions.canAccessReports()} 
                requiredRole="admin"
              />
              <PermissionItem 
                label="Access Settings" 
                hasPermission={permissions.canAccessSettings()} 
                requiredRole="admin"
              />
              <PermissionItem 
                label="Access Customer Support" 
                hasPermission={permissions.canAccessCustomerSupport()} 
                requiredRole="super_admin"
              />
              <PermissionItem 
                label="Export Data" 
                hasPermission={features.canExportData()} 
                requiredRole="admin"
              />
              <PermissionItem 
                label="Import Data" 
                hasPermission={features.canImportData()} 
                requiredRole="admin"
              />
              <PermissionItem 
                label="View Analytics" 
                hasPermission={features.canViewAnalytics()} 
                requiredRole="admin"
              />
            </div>
          </div>
        </div>

        {/* Protected Components Demo */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Protected Components Demo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Root Only Component */}
            <ProtectedComponent 
              requiredPermissions={['create_school']}
              fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">Only Root users can create schools</p>
                </div>
              }
              showFallback={true}
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Create School</h3>
                <p className="text-sm text-green-700">This component is only visible to Root users</p>
                <button className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                  Create School
                </button>
              </div>
            </ProtectedComponent>

            {/* Admin+ Component */}
            <ProtectedComponent 
              requiredPermissions={['student_crud']}
              fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">Admin+ required for student management</p>
                </div>
              }
              showFallback={true}
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Student Management</h3>
                <p className="text-sm text-blue-700">This component is visible to Admin+ users</p>
                <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Manage Students
                </button>
              </div>
            </ProtectedComponent>

            {/* Super Admin+ Component */}
            <ProtectedComponent 
              requiredPermissions={['manage_users']}
              fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">Super Admin+ required for user management</p>
                </div>
              }
              showFallback={true}
            >
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">User Management</h3>
                <p className="text-sm text-purple-700">This component is visible to Super Admin+ users</p>
                <button className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                  Manage Users
                </button>
              </div>
            </ProtectedComponent>
          </div>
        </div>

        {/* Permission Gate Examples */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Permission Gate Examples</h2>
          
          <div className="space-y-4">
            {/* Error Message Example */}
            <PermissionGate 
              permissions={['create_school']}
              showError={true}
              errorMessage="You need Root access to create schools"
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">School Creation Panel</h3>
                <p className="text-sm text-green-700">This would show the school creation form</p>
              </div>
            </PermissionGate>

            {/* Multiple Permissions Example */}
            <PermissionGate 
              permissions={['student_crud', 'view_students']}
              mode="all"
              showError={true}
              errorMessage="You need both student CRUD and view permissions"
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800">Advanced Student Management</h3>
                <p className="text-sm text-blue-700">This requires ALL specified permissions</p>
              </div>
            </PermissionGate>

            {/* Role-based Example */}
            <PermissionGate 
              roles={['root', 'super_admin']}
              showError={true}
              errorMessage="Only Root and Super Admin can access this feature"
            >
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800">System Administration</h3>
                <p className="text-sm text-yellow-700">This is only for Root and Super Admin users</p>
              </div>
            </PermissionGate>
          </div>
        </div>

        {/* Feature Access Demo */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Access Demo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard 
              title="Students Module"
              description="Manage student records"
              hasAccess={features.canAccessStudentsModule()}
              icon={FaSchool}
            />
            <FeatureCard 
              title="Users Module"
              description="Manage system users"
              hasAccess={features.canAccessUsersModule()}
              icon={FaUsers}
            />
            <FeatureCard 
              title="Reports Module"
              description="View analytics and reports"
              hasAccess={features.canAccessReportsModule()}
              icon={FaChartBar}
            />
            <FeatureCard 
              title="Settings Module"
              description="System configuration"
              hasAccess={features.canAccessSettingsModule()}
              icon={FaCog}
            />
            <FeatureCard 
              title="Admin Panel"
              description="System administration and management"
              hasAccess={features.canAccessAdminPanelModule()}
              icon={FaCog}
            />
            <FeatureCard 
              title="School Management"
              description="Manage multiple schools"
              hasAccess={features.canManageSchools()}
              icon={FaSchool}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
interface PermissionItemProps {
  label: string;
  hasPermission: boolean;
  requiredRole: string;
}

const PermissionItem: React.FC<PermissionItemProps> = ({ label, hasPermission, requiredRole }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <p className="text-xs text-gray-500">Requires: {requiredRole}</p>
    </div>
    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
      hasPermission 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {hasPermission ? '✓ Allowed' : '✗ Denied'}
    </div>
  </div>
);

interface FeatureCardProps {
  title: string;
  description: string;
  hasAccess: boolean;
  icon: any;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, hasAccess, icon: Icon }) => (
  <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
    hasAccess 
      ? 'bg-green-50 border-green-200 hover:border-green-300' 
      : 'bg-red-50 border-red-200'
  }`}>
    <div className="flex items-center space-x-3 mb-3">
      {Icon({ className: `w-5 h-5 ${
        hasAccess ? 'text-green-600' : 'text-red-600'
      }` })}
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-sm text-gray-600 mb-3">{description}</p>
    <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
      hasAccess 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {hasAccess ? 'Access Granted' : 'Access Denied'}
    </div>
  </div>
);

export default RBACExample;
