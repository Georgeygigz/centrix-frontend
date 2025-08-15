import React from 'react';
import { FaGlobe, FaTh, FaBell, FaUser, FaSignOutAlt, FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';


interface TopNavigationProps {
  pageTitle: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ pageTitle }) => {
  const { logout, user } = useAuth();
  
  // Use useMemo to ensure re-rendering when user changes
  const userDisplayName = React.useMemo(() => {
    return user?.username || 'User';
  }, [user?.username]);
  
  const userRoleAndSchool = React.useMemo(() => {
    return `${user?.role || 'User'} • ${user?.school_name || 'Default School'}`;
  }, [user?.role, user?.school_name]);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Page Title and School Info */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{pageTitle}</h1>
          </div>
          
          {/* School Information */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
            {FaGraduationCap({ className: "w-4 h-4 text-blue-600" })}
            <div className="text-sm">
              <p className="font-medium text-blue-900">
                {user?.school_name || 'Default School'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Globe Icon */}
          <button className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-all duration-200">
            {FaGlobe({ className: "w-4 h-4" })}
          </button>

          {/* Grid Layout Icon */}
          <button className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-all duration-200">
            {FaTh({ className: "w-4 h-4" })}
          </button>

          {/* Notification Bell */}
          <button className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-all duration-200 relative">
            {FaBell({ className: "w-4 h-4" })}
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900">
                {userDisplayName}
              </p>
              <p className="text-xs text-gray-500">
                {userRoleAndSchool}
              </p>

            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {FaUser({ className: "w-4 h-4 text-white" })}
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={logout}
              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
              title="Logout"
            >
              {FaSignOutAlt({ className: "w-4 h-4" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation; 