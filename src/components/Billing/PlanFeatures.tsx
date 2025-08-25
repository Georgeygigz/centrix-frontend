import React from 'react';
import { FaCogs } from 'react-icons/fa';

const PlanFeatures: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Plan Features</h1>
        <p className="text-gray-600">Manage features associated with billing plans</p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
        {FaCogs({ className: "w-16 h-16 text-gray-400 mx-auto mb-4" })}
        <h3 className="text-lg font-medium text-gray-900 mb-2">Plan Features Management</h3>
        <p className="text-gray-600 mb-6">
          This page will allow you to manage which features are included in each billing plan, 
          including quantities, pricing, and overage costs.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Coming Soon:</strong> Feature-to-plan assignment, quantity management, 
            pricing configuration, and overage settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanFeatures;
