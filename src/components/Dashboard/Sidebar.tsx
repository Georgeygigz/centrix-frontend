import React from 'react';
import { FaUserGraduate, FaChartBar, FaUsers, FaCog, FaChevronDown, FaBuilding, FaSchool, FaUserFriends } from 'react-icons/fa';
import { NavigationItem } from '../../types/rbac';
import { useAuth } from '../../context/AuthContext';
import { useRoleBasedUI } from '../../hooks/usePermissions';
import { useRBAC } from '../../context/RBACContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { logout } = useAuth();
  const ui = useRoleBasedUI();
  const { userRole } = useRBAC();
  
  const navigationItems: NavigationItem[] = [
    {
      id: 'students',
      label: 'Students',
      icon: FaUserGraduate,
      requiredPermissions: ['view_students'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FaChartBar,
      requiredPermissions: ['access_reports'],
    },
    {
      id: 'admin-panel',
      label: 'Admin Panel',
      icon: FaCog,
      requiredPermissions: ['access_admin_panel'],
      children: userRole === 'super_admin' 
        ? [
            { id: 'admin-users', label: 'Users', icon: FaUsers },
            { id: 'admin-parents', label: 'Parents', icon: FaUserFriends },
          ]
        : [
            { id: 'admin-schools', label: 'Schools', icon: FaSchool },
            { id: 'admin-users', label: 'Users', icon: FaUsers },
            { id: 'admin-parents', label: 'Parents', icon: FaUserFriends },
            { id: 'admin-features', label: 'Switch Board', icon: FaCog },
          ],
    },
  ];

  return (
    <div className="w-56 bg-white h-screen shadow-lg border-r border-gray-200">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200">
        <button 
          onClick={logout}
          className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-all duration-200 group"
          title="Click to logout"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            {FaBuilding({ className: "w-5 h-5 text-white" })}
          </div>
          <h1 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">Centrix</h1>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            // Check if user has permission to see this navigation item
            const hasPermission = !item.requiredPermissions || 
              item.requiredPermissions.some(permission => ui.hasPermission(permission));
            
            if (!hasPermission) return null;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-all duration-200 group ${
                    currentPage === item.id || (item.children && item.children.some(child => child.id === currentPage))
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {item.icon({ className: `w-4 h-4 ${currentPage === item.id || (item.children && item.children.some(child => child.id === currentPage)) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}` })}
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  {item.children && (
                    FaChevronDown({ className: `w-3 h-3 transition-transform duration-200 ${currentPage === item.id || (item.children && item.children.some(child => child.id === currentPage)) ? 'text-blue-600' : 'text-gray-400'}` })
                  )}
                </button>
                
                {/* Sub-items */}
                {item.children && (currentPage === item.id || item.children.some(child => child.id === currentPage)) && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {item.children.map((subItem) => (
                      <li key={subItem.id}>
                        <button
                          onClick={() => onPageChange(subItem.id)}
                          className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left transition-all duration-200 ${
                            currentPage === subItem.id
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                          }`}
                        >
                          {subItem.icon({ className: `w-3 h-3 ${currentPage === subItem.id ? 'text-blue-600' : 'text-gray-400'}` })}
                          <span className="text-xs">{subItem.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 