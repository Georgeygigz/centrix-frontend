import React from 'react';
import { FaFileAlt } from 'react-icons/fa';

const FeeInvoice: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {FaFileAlt({ className: "w-8 h-8 text-green-600" })}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fee Invoice</h3>
        <p className="text-gray-600">This feature will allow you to manage and generate fee invoices for students.</p>
        <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
      </div>
    </div>
  );
};

export default FeeInvoice;
