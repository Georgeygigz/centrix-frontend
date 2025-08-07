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
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            {FaTimes({ className: "w-5 h-5" })}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {FaUser({ className: "w-6 h-6 text-blue-600" })}
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-lg font-semibold text-gray-800">{student.fullName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {FaGraduationCap({ className: "w-6 h-6 text-green-600" })}
                <div>
                  <p className="text-sm font-medium text-gray-500">Admission Number</p>
                  <p className="text-lg font-semibold text-gray-800">{student.admissionNumber}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {FaVenusMars({ className: "w-6 h-6 text-purple-600" })}
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p className="text-lg font-semibold text-gray-800">{student.gender}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {FaGraduationCap({ className: "w-6 h-6 text-indigo-600" })}
                <div>
                  <p className="text-sm font-medium text-gray-500">Class</p>
                  <p className="text-lg font-semibold text-gray-800">{student.class}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {FaCalendar({ className: "w-6 h-6 text-orange-600" })}
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p className="text-lg font-semibold text-gray-800">{student.dateOfBirth}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {FaUser({ className: "w-6 h-6 text-teal-600" })}
                <div>
                  <p className="text-sm font-medium text-gray-500">Parent Name</p>
                  <p className="text-lg font-semibold text-gray-800">{student.parentName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {FaPhone({ className: "w-6 h-6 text-red-600" })}
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Info</p>
                  <p className="text-lg font-semibold text-gray-800">{student.contactInfo}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {FaMapMarkerAlt({ className: "w-6 h-6 text-pink-600" })}
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-lg font-semibold text-gray-800">{student.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date of Admission */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {FaCalendar({ className: "w-6 h-6 text-blue-600" })}
              <div>
                <p className="text-sm font-medium text-blue-600">Date of Admission</p>
                <p className="text-xl font-bold text-blue-800">{student.dateOfAdmission}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
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