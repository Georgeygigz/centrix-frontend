import React from 'react';
import { FaUserGraduate } from 'react-icons/fa';

const StudentFeeAssignment: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {FaUserGraduate({ className: "w-8 h-8 text-blue-600" })}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Student Fee Assignment</h3>
        <p className="text-gray-600">This feature will allow you to assign fee structures to individual students.</p>
        <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
      </div>
    </div>
  );
};

export default StudentFeeAssignment;
