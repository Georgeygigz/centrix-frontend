import React from 'react';
import { FaGlobe, FaTh, FaBell, FaUser } from 'react-icons/fa';

interface TopNavigationProps {
  pageTitle: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ pageTitle }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Globe Icon */}
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200">
            {FaGlobe({ className: "w-5 h-5" })}
          </button>

          {/* Grid Layout Icon */}
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200">
            {FaTh({ className: "w-5 h-5" })}
          </button>

          {/* Notification Bell */}
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 relative">
            {FaBell({ className: "w-5 h-5" })}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              {FaUser({ className: "w-5 h-5 text-white" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation; 