import React, { useState } from 'react';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNavigation from '../components/Dashboard/TopNavigation';
import Students from '../components/Students/Students';


const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('students');

  // Function to get page title based on current page
  const getPageTitle = (page: string): string => {
    const pageTitles: { [key: string]: string } = {
      'students': 'Students',
      'ebook': 'EBook',
      'enrollments': 'Enrollments',
      'reports': 'Reports',
      'users': 'Users',
      'settings': 'Settings',
      'profile': 'Manage Profile',
      'ticket-list': 'Ticket List',
      'support-category': 'Support Category',
      'macro-replies': 'Macro Replies',
      'create-ticket': 'Create Ticket',

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
      case 'users':
        return <div className="p-6 text-center text-gray-500">Users page coming soon...</div>;
      case 'settings':
        return <div className="p-6 text-center text-gray-500">Settings page coming soon...</div>;
      case 'profile':
        return <div className="p-6 text-center text-gray-500">Profile page coming soon...</div>;

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
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 