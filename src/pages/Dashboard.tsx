import React, { useState } from 'react';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNavigation from '../components/Dashboard/TopNavigation';
import Students from '../components/Students/Students';
import SwitchBoard from '../components/SwitchBoard/SwitchBoard';
import Users from '../components/Users/Users';
import Schools from '../components/Schools/Schools';
import Parents from '../components/Parents/Parents';
import Fees from '../components/Fees';
import { useRBAC } from '../context/RBACContext';
import { 
  BillingDashboard, 
  BillingPlans,
  SuperAdminBillingDashboard
} from '../components/Billing';
import { ActivityLog } from '../components/ActivityLog';
import { Assessments } from '../components/Assessments';


const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('students');
  const { userRole } = useRBAC();

  // Function to get page title based on current page
  const getPageTitle = (page: string): string => {
    const pageTitles: { [key: string]: string } = {
      'students': 'Students',
      'fees': 'Fees',
      'ebook': 'EBook',
      'enrollments': 'Enrollments',
      'assessments': 'Assessments',

      'profile': 'Manage Profile',
      'admin-panel': 'Admin Panel',
      'admin-schools': 'Admin - Schools',
      'admin-users': 'Admin - Users',
      'admin-parents': 'Admin - Parents',
      'admin-features': 'Admin - Switch Board',
      'admin-activity-log': 'Admin - Activity Log',
      
      // Billing pages
      'admin-billing': 'Admin - Billing',
      'admin-billing-dashboard': 'Admin - Billing Dashboard',
      'admin-billing-plans': 'Admin - Billing Plans',
    };
    return pageTitles[page] || 'Dashboard';
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'students':
        return <Students />;
      case 'fees':
        return <Fees />;
      case 'ebook':
        return <div className="p-6 text-center text-gray-500">EBook page coming soon...</div>;
      case 'enrollments':
        return <div className="p-6 text-center text-gray-500">Enrollments page coming soon...</div>;
      case 'assessments':
        return <Assessments />;

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
      case 'admin-activity-log':
        return <ActivityLog />;

      // Billing routes
      case 'admin-billing':
        return <div className="p-6 text-center text-gray-500">Billing - Select a sub-item from the sidebar</div>;
      case 'admin-billing-dashboard':
        // Show different billing dashboard based on user role
        if (userRole === 'root') {
          return <BillingDashboard />;
        } else if (userRole === 'super_admin') {
          return <SuperAdminBillingDashboard />;
        } else {
          return <div className="p-6 text-center text-gray-500">Access denied. Only root and super admin users can access billing.</div>;
        }
      case 'admin-billing-plans':
        // Only root users can access billing plans
        if (userRole === 'root') {
          return <BillingPlans />;
        } else {
          return <div className="p-6 text-center text-gray-500">Access denied. Only root users can access billing plans.</div>;
        }

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
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 