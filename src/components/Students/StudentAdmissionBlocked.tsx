import React from 'react';
import { FaExclamationTriangle, FaCreditCard, FaTools } from 'react-icons/fa';

interface StudentAdmissionBlockedProps {
  isBillingBlocked: boolean;
  isMaintenanceBlocked: boolean;
  blockMessage: string;
  isLoading: boolean;
}

const StudentAdmissionBlocked: React.FC<StudentAdmissionBlockedProps> = ({
  isBillingBlocked,
  isMaintenanceBlocked,
  blockMessage,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-md shadow-sm p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Checking feature status...</p>
        </div>
      </div>
    );
  }

  const getIcon = () => {
    if (isBillingBlocked) {
      return FaCreditCard({ className: "w-12 h-12 text-orange-500" });
    }
    if (isMaintenanceBlocked) {
      return FaTools({ className: "w-12 h-12 text-yellow-500" });
    }
    return FaExclamationTriangle({ className: "w-12 h-12 text-red-500" });
  };

  const getTitle = () => {
    if (isBillingBlocked) {
      return 'Student Admission Temporarily Unavailable';
    }
    if (isMaintenanceBlocked) {
      return 'Student Admission Under Maintenance';
    }
    return 'Student Admission Unavailable';
  };

  const getDescription = () => {
    if (isBillingBlocked) {
      return 'Student admission features are currently unavailable due to billing restrictions. Please contact your administrator to resolve this issue.';
    }
    if (isMaintenanceBlocked) {
      return 'Student admission features are temporarily unavailable due to scheduled maintenance. Please try again later.';
    }
    return 'Student admission features are currently unavailable. Please try again later.';
  };

  const getActionText = () => {
    if (isBillingBlocked) {
      return 'Contact Administrator';
    }
    if (isMaintenanceBlocked) {
      return 'Try Again Later';
    }
    return 'Contact Support';
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-8">
      <div className="text-center">
        <div className="mb-6">
          {getIcon()}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {getTitle()}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          {blockMessage || getDescription()}
        </p>
        
        <div className="flex justify-center">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isBillingBlocked
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : isMaintenanceBlocked
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            onClick={() => {
              // You can add navigation or contact functionality here
            }}
          >
            {getActionText()}
          </button>
        </div>
        
        {/* Additional info based on block type */}
        {isBillingBlocked && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-700">
              <strong>Note:</strong> This restriction may be due to unpaid invoices or account suspension. 
              Please contact your school administrator to resolve billing issues.
            </p>
          </div>
        )}
        
        {isMaintenanceBlocked && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700">
              <strong>Note:</strong> We're performing scheduled maintenance to improve our services. 
              This usually takes 15-30 minutes. Thank you for your patience.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAdmissionBlocked;
