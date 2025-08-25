import React from 'react';
import { FaListAlt } from 'react-icons/fa';

const BillingFeatures: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing Features</h1>
        <p className="text-gray-600">Create and manage billable features</p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
        {FaListAlt({ className: "w-16 h-16 text-gray-400 mx-auto mb-4" })}
        <h3 className="text-lg font-medium text-gray-900 mb-2">Billing Features Management</h3>
        <p className="text-gray-600 mb-6">
          This page will allow you to create and manage billable features, including feature codes, 
          descriptions, and billing configurations.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Coming Soon:</strong> Feature creation, code management, billing settings, 
            and feature-to-plan assignment capabilities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingFeatures;
