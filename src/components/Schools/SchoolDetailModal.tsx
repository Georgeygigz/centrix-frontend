import React from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { School } from '../../types/dashboard';

interface SchoolDetailModalProps {
  school: School;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (school: School) => void;
}

const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({ 
  school, 
  isOpen, 
  onClose, 
  onEdit 
}) => {
  if (!isOpen) return null;

  const schoolFeatures = [
    {
      title: "Basic Information",
      tag: "basic_info",
      description: "Core school identification and contact details",
      details: [
        { label: "School ID", value: school.id },
        { label: "Slug", value: school.slug },
        { label: "Subdomain", value: school.subdomain },
        { label: "Domain", value: school.domain || "Not set" }
      ]
    },
    {
      title: "Contact Details",
      tag: "contact_details",
      description: "School contact information and communication channels",
      details: [
        { label: "Email", value: school.email },
        { label: "Phone", value: school.phone || "Not provided" },
        { label: "Website", value: school.website || "Not provided" },
        { label: "Address", value: school.address || "Not provided" }
      ]
    },
    {
      title: "Configuration",
      tag: "configuration",
      description: "School settings and operational parameters",
      details: [
        { label: "Timezone", value: school.timezone },
        { label: "Language", value: school.language },
        { label: "Currency", value: school.currency },
        { label: "Status", value: school.is_active ? "Active" : "Inactive" }
      ]
    },
    {
      title: "Student Management",
      tag: "student_management",
      description: "Current student enrollment and capacity information",
      details: [
        { label: "Current Students", value: (school.number_of_students || school.total_students || 0).toString() },
        { label: "Max Capacity", value: school.max_students.toString() },
        { label: "Utilization", value: `${Math.round(((school.number_of_students || school.total_students || 0) / school.max_students) * 100)}%` }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
      <div className="bg-blue-50 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-blue-900">{school.name}</h2>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(school)}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200"
                title="Edit School"
              >
                {FaPlus({ className: "w-4 h-4 text-blue-600" })}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200"
              title="Close"
            >
              {FaTimes({ className: "w-4 h-4 text-blue-600" })}
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-3 space-y-3">
          {schoolFeatures.map((feature, index) => (
            <div key={feature.tag} className="bg-white/50 rounded-lg p-3 shadow-sm">
              {/* Feature Header */}
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {feature.tag}
                </span>
              </div>

              {/* Feature Description */}
              <p className="text-xs text-gray-500 mb-2">{feature.description}</p>

              {/* Feature Details */}
              <div className="space-y-0.5">
                {feature.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex justify-between items-center py-0.5 border-b border-gray-100 last:border-b-0">
                    <span className="text-xs font-medium text-gray-700">{detail.label}:</span>
                    <span className="text-xs text-gray-900 text-right max-w-48">
                      {detail.label === "Website" && detail.value !== "Not provided" ? (
                        <a 
                          href={detail.value.startsWith('http') ? detail.value : `https://${detail.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {detail.value}
                        </a>
                      ) : detail.label === "Status" ? (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          detail.value === "Active" 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {detail.value}
                        </span>
                      ) : detail.label === "Utilization" ? (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          parseInt(detail.value) > 80 
                            ? 'bg-red-100 text-red-800' 
                            : parseInt(detail.value) > 60 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {detail.value}
                        </span>
                      ) : (
                        detail.value
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-4 pt-4 pb-6 border-t border-blue-200 bg-blue-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailModal;
