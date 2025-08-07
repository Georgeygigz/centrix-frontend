import React from 'react';
import { FaTimes, FaUser, FaCalendar, FaPhone, FaMapMarkerAlt, FaGraduationCap, FaVenusMars } from 'react-icons/fa';
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
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
            <p className="text-xs text-gray-500 mt-1">Complete student information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            {FaTimes({ className: "w-5 h-5" })}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    {FaUser({ className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Full Name</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{student.fullName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    {FaGraduationCap({ className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Admission Number</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{student.admissionNumber}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    {FaVenusMars({ className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Gender</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{student.gender}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    {FaGraduationCap({ className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Class</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{student.class}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    {FaCalendar({ className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Date of Birth</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{student.dateOfBirth}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    {FaUser({ className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Parent Name</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{student.parentName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    {FaPhone({ className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Contact Info</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{student.contactInfo}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-pink-500 rounded-lg">
                    {FaMapMarkerAlt({ className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-pink-600 uppercase tracking-wide">Address</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{student.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date of Admission - Featured Section */}
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                {FaCalendar({ className: "w-6 h-6 text-white" })}
              </div>
              <div>
                <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Date of Admission</p>
                <p className="text-2xl font-bold text-white mt-1">{student.dateOfAdmission}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentModal; 