import React, { useState } from 'react';
import { 
  FaBook, 
  FaGraduationCap, 
  FaChartBar, 
  FaUsers, 
  FaHeadset, 
  FaCog, 
  FaUser,
  FaChevronDown,
  FaChevronRight,
  FaBars
} from 'react-icons/fa';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['customer-support']);

  const navigationItems = [
    { id: 'ebook', label: 'EBook', icon: FaBook, hasSubItems: false },
    { id: 'enrollments', label: 'Enrollments', icon: FaGraduationCap, hasSubItems: false },
    { id: 'reports', label: 'Reports', icon: FaChartBar, hasSubItems: false },
    { id: 'students', label: 'Students', icon: FaUsers, hasSubItems: false },
    { id: 'users', label: 'Users', icon: FaUsers, hasSubItems: false },
    { 
      id: 'customer-support', 
      label: 'Customer Support', 
      icon: FaHeadset, 
      hasSubItems: true,
      subItems: [
        { id: 'ticket-list', label: 'Ticket List' },
        { id: 'support-category', label: 'Support Category' },
        { id: 'macro-replies', label: 'Macro Replies' },
        { id: 'create-ticket', label: 'Create Ticket' }
      ]
    },
    { id: 'settings', label: 'Settings', icon: FaCog, hasSubItems: false },
    { id: 'profile', label: 'Manage Profile', icon: FaUser, hasSubItems: false }
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isItemActive = (itemId: string) => {
    if (itemId === currentPage) return true;
    const item = navigationItems.find(nav => nav.id === itemId);
    if (item?.subItems) {
      return item.subItems.some(subItem => subItem.id === currentPage);
    }
    return false;
  };

  return (
    <div className="w-64 bg-white h-screen shadow-lg rounded-r-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-1 h-6 bg-blue-600 rounded"></div>
            <div className="w-1 h-6 bg-blue-600 rounded"></div>
            <div className="w-1 h-6 bg-blue-600 rounded"></div>
          </div>
          <span className="text-xl font-bold text-gray-800">Edaca</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  if (item.hasSubItems) {
                    toggleExpanded(item.id);
                  } else {
                    onPageChange(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  isItemActive(item.id)
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon({ className: "w-5 h-5" })}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.hasSubItems && (
                  <div className="flex items-center space-x-2">
                    {expandedItems.includes(item.id) ? (
                      FaChevronDown({ className: "w-4 h-4" })
                    ) : (
                      FaChevronRight({ className: "w-4 h-4" })
                    )}
                  </div>
                )}
              </button>

              {/* Sub-items */}
              {item.hasSubItems && expandedItems.includes(item.id) && (
                <ul className="ml-8 mt-2 space-y-1">
                  {item.subItems?.map((subItem) => (
                    <li key={subItem.id}>
                      <button
                        onClick={() => onPageChange(subItem.id)}
                        className={`w-full flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                          currentPage === subItem.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm">{subItem.label}</span>
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