import React from 'react';
import { 
  FaGlobe, 
  FaTh, 
  FaBell, 
  FaQuestionCircle,
  FaStar,
  FaEllipsisH
} from 'react-icons/fa';

interface TopNavigationProps {
  pageTitle: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ pageTitle }) => {
  return (
    <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      {/* Left side - Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
      </div>

      {/* Right side - Navigation icons */}
      <div className="flex items-center space-x-4">
        {/* Action icons */}
        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
          {FaTh({ className: "w-5 h-5" })}
        </button>
        
        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
          {FaStar({ className: "w-5 h-5" })}
        </button>
        
        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
          {FaEllipsisH({ className: "w-5 h-5" })}
        </button>
        
        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
          {FaQuestionCircle({ className: "w-5 h-5" })}
        </button>
        
        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
          {FaGlobe({ className: "w-5 h-5" })}
        </button>
        
        {/* Notification bell */}
        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 relative">
          {FaBell({ className: "w-5 h-5" })}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </button>
        
        {/* User profile */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">JD</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation; 