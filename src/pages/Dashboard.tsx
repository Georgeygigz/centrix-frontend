import React, { useState } from 'react';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNavigation from '../components/Dashboard/TopNavigation';
import Students from '../components/Students/Students';
import SwitchBoard from '../components/SwitchBoard/SwitchBoard';
import Users from '../components/Users/Users';
import Schools from '../components/Schools/Schools';
import Parents from '../components/Parents/Parents';


const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('students');

  // Function to get page title based on current page
  const getPageTitle = (page: string): string => {
    const pageTitles: { [key: string]: string } = {
      'students': 'Students',
      'ebook': 'EBook',
      'enrollments': 'Enrollments',
      'reports': 'Reports',

      'profile': 'Manage Profile',
      'admin-panel': 'Admin Panel',
      'admin-schools': 'Admin - Schools',
      'admin-users': 'Admin - Users',
      'admin-parents': 'Admin - Parents',
      'admin-features': 'Admin - Switch Board',
    };
    return pageTitles[page] || 'Dashboard';
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'students':
        return <Students />;
      case 'ebook':
        return <div className="p-6 text-center text-gray-500">EBook page coming soon...</div>;
      case 'enrollments':
        return <div className="p-6 text-center text-gray-500">Enrollments page coming soon...</div>;
      case 'reports':
        return <div className="p-6 text-center text-gray-500">Reports page coming soon...</div>;

      case 'profile':
        return <div className="p-6 text-center text-gray-500">Profile page coming soon...</div>;
      case 'admin-panel':
        return <div className="p-6 text-center text-gray-500">Admin Panel - Select a sub-item from the sidebar</div>;
                   case 'admin-schools':
               return <Schools />;
      case 'admin-users':
        return <Users />;
      case 'admin-parents':
        return <Parents />;
      case 'admin-features':
        return <SwitchBoard />;

      default:
        return <Students />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation pageTitle={getPageTitle(currentPage)} />
        
        {/* Content Area */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 