import React from 'react';
import { FaSchool } from 'react-icons/fa';

const SchoolSubscriptions: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">School Subscriptions</h1>
        <p className="text-gray-600">Manage billing for existing schools</p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
        {FaSchool({ className: "w-16 h-16 text-gray-400 mx-auto mb-4" })}
        <h3 className="text-lg font-medium text-gray-900 mb-2">School Subscriptions Management</h3>
        <p className="text-gray-600 mb-6">
          This page will allow you to view and manage school subscriptions, including plan changes, 
          billing settings, and subscription status.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Coming Soon:</strong> School subscription overview, plan management, 
            billing settings, and subscription status monitoring.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolSubscriptions;
