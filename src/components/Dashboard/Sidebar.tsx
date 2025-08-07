import React from 'react';
import { FaBook, FaUserGraduate, FaChartBar, FaUsers, FaHeadset, FaCog, FaChevronDown, FaBuilding } from 'react-icons/fa';
import { NavigationItem } from '../../types/dashboard';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { logout } = useAuth();
  const navigationItems: NavigationItem[] = [
    {
      id: 'students',
      label: 'Students',
      icon: FaUserGraduate,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FaChartBar,
    },
    {
      id: 'users',
      label: 'Users',
      icon: FaUsers,
    },
    {
      id: 'customer-support',
      label: 'Customer Support',
      icon: FaHeadset,
      children: [
        { id: 'tickets', label: 'Tickets', icon: FaHeadset },
        { id: 'live-chat', label: 'Live Chat', icon: FaHeadset },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: FaCog,
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
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-all duration-200 group ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {item.icon({ className: `w-4 h-4 ${currentPage === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}` })}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                {item.children && (
                  FaChevronDown({ className: `w-3 h-3 transition-transform duration-200 ${currentPage === item.id ? 'text-blue-600' : 'text-gray-400'}` })
                )}
              </button>
              
              {/* Sub-items */}
              {item.children && currentPage === item.id && (
                <ul className="mt-1 ml-4 space-y-1">
                  {item.children.map((subItem) => (
                    <li key={subItem.id}>
                      <button
                        onClick={() => onPageChange(subItem.id)}
                        className="w-full flex items-center space-x-2 px-2 py-1 rounded text-left text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
                      >
                        {subItem.icon({ className: "w-3 h-3 text-gray-400" })}
                        <span className="text-xs">{subItem.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 