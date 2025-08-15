import React from 'react';
import { FaTimes, FaUser, FaEdit, FaEye } from 'react-icons/fa';
import { Student } from '../../types/dashboard';interface StudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}const StudentModal: React.FC<StudentModalProps> = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null;  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white shadow-xl max-w-4xl w-full max-h-[85vh] overflow-visible relative">
        {/* Close Button - Top Right Corner */}
        <button
          onClick={onClose}
          className="absolute -top-8 -right-8 w-12 h-12 bg-red-300/80 hover:bg-red-400/90 text-white rounded-full shadow-lg transition-all duration-200 z-[9999] flex items-center justify-center"
        >
          {FaTimes({ className: "w-5 h-5" })}
        </button>
                {/* Header with Student Name */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          {/* Profile Picture - Top Left Corner */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200 shadow-sm mr-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                {FaUser({ className: "w-12 h-12 text-white" })}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="w-2 h-2 bg-white rounded-full"></span>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{student.fullName || student.pupil_name || 'Student Name'}</h2>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Gender:</span>
                <span>{student.gender || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Age:</span>
                <span>{student.dateOfBirth ? `${new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear()} years` : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Admission #:</span>
                <span className="font-mono">{student.admissionNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>    {/* Content */}
     <div className="p-3 relative overflow-y-auto max-h-[60vh]">

             {/* Information Sections */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Student Info Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2.5 border border-blue-200 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-lg font-bold text-blue-900">Student Info</h3>
            </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5 border-b border-blue-200">
              <span className="text-xs font-semibold text-blue-700">Student ID:</span>
              <span className="text-xs font-medium text-blue-900 bg-blue-50 px-2 py-1 rounded">{student.admissionNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-blue-200">
              <span className="text-xs font-semibold text-blue-700">Email:</span>
              <span className="text-xs text-blue-900">N/A</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs font-semibold text-blue-700">Phone:</span>
              <span className="text-xs text-blue-900">{student.contactInfo || student.guardianContact || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Academic Info Section */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2.5 border border-green-200 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-lg font-bold text-green-900">Academic Info</h3>
            </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5 border-b border-green-200">
              <span className="text-xs font-semibold text-green-700">School:</span>
              <span className="text-xs text-green-900">N/A</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-green-200">
              <span className="text-xs font-semibold text-green-700">Grade:</span>
              <span className="text-xs font-medium text-green-900 bg-green-50 px-2 py-1 rounded">{student.classOnAdmission || student.class || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-green-200">
              <span className="text-xs font-semibold text-green-700">Class:</span>
              <span className="text-xs text-green-900">{student.classOnAdmission || student.class || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs font-semibold text-green-700">Attendance:</span>
              <span className="text-xs font-medium text-green-900 bg-green-50 px-2 py-1 rounded">95%</span>
            </div>
          </div>
        </div>

        {/* Guardian Info Section */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2.5 border border-purple-200 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-lg font-bold text-purple-900">Guardian Info</h3>
            </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5 border-b border-purple-200">
              <span className="text-xs font-semibold text-purple-700">Name:</span>
              <span className="text-xs font-medium text-purple-900 bg-purple-50 px-2 py-1 rounded">{student.guardianName || student.parentName || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-purple-200">
              <span className="text-xs font-semibold text-purple-700">Email:</span>
              <span className="text-xs text-purple-900">N/A</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-purple-200">
              <span className="text-xs font-semibold text-purple-700">Phone:</span>
              <span className="text-xs text-purple-900">{student.guardianContact || student.contactInfo || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs font-semibold text-purple-700">Relationship:</span>
              <span className="text-xs font-medium text-purple-900 bg-purple-50 px-2 py-1 rounded">Parent</span>
            </div>
          </div>
        </div>

        {/* Other Info Section */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2.5 border border-orange-200 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-lg font-bold text-orange-900">Other Info</h3>
            </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5 border-b border-orange-200">
              <span className="text-xs font-semibold text-orange-700">Joined:</span>
              <span className="text-xs font-medium text-orange-900 bg-orange-50 px-2 py-1 rounded">{student.dateOfAdmission || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-orange-200">
              <span className="text-xs font-semibold text-orange-700">Source:</span>
              <span className="text-xs text-orange-900">Direct</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-orange-200">
              <span className="text-xs font-semibold text-orange-700">Email Verified:</span>
              <span className="text-xs font-medium text-orange-900 bg-orange-50 px-2 py-1 rounded">Yes</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs font-semibold text-orange-700">Medical:</span>
              <span className="text-xs text-orange-900">No issues</span>
            </div>
          </div>
        </div>

      </div>

             {/* Additional Details Section */}
       <div className="mt-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-2.5 border border-red-200 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
            <h3 className="text-lg font-bold text-red-900">Additional Details</h3>
          </div>
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center py-1.5 border-b border-red-200">
              <span className="text-xs font-semibold text-red-700">Date of Birth:</span>
              <span className="text-xs text-red-900">{student.dateOfBirth || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-red-200">
              <span className="text-xs font-semibold text-red-700">Gender:</span>
              <span className="text-xs text-red-900">{student.gender || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-red-200">
              <span className="text-xs font-semibold text-red-700">Address:</span>
              <span className="text-xs text-red-900">{student.address || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs font-semibold text-red-700">Last School:</span>
              <span className="text-xs text-red-900">{student.lastSchoolAttended || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

        </div>
      </div>
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-xl border border-gray-200 p-3 z-[10000]" style={{ width: 'calc(100vw - 2rem)', maxWidth: '896px' }}>
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-700 flex items-center space-x-2">
            <span className="font-semibold">Last updated:</span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex space-x-3">
            <button 
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {FaEdit({ className: "w-4 h-4" })}
              <span className="text-sm font-medium">Edit</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
              {FaEye({ className: "w-4 h-4" })}
              <span className="text-sm font-medium">View Profile</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};export default StudentModal; 

