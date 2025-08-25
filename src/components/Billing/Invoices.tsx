import React from 'react';
import { FaFileInvoiceDollar } from 'react-icons/fa';

const Invoices: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoices</h1>
        <p className="text-gray-600">View and manage all invoices across the platform</p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
        {FaFileInvoiceDollar({ className: "w-16 h-16 text-gray-400 mx-auto mb-4" })}
        <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Management</h3>
        <p className="text-gray-600 mb-6">
          This page will allow you to view and manage all invoices, including invoice details, 
          payment processing, and invoice status tracking.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Coming Soon:</strong> Invoice listing, payment processing, PDF generation, 
            email notifications, and invoice status management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
