import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Student } from '../../types/dashboard';

interface StudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {FaTimes({ className: "w-5 h-5" })}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Admission Number</label>
                  <p className="text-gray-900 font-medium">{student.admissionNumber}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900 font-medium">{student.fullName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900 font-medium">{student.gender}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900 font-medium">{student.dateOfBirth}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Class</label>
                  <p className="text-gray-900 font-medium">{student.class}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Parent Name</label>
                  <p className="text-gray-900 font-medium">{student.parentName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Info</label>
                  <p className="text-gray-900 font-medium">{student.contactInfo}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900 font-medium">{student.address}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Admission</label>
                  <p className="text-gray-900 font-medium">{student.dateOfAdmission}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentModal; 