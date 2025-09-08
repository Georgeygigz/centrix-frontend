import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaSave } from 'react-icons/fa';
import { FeeAssignment, FeeStructure } from '../../types/fees';
import { apiService } from '../../services/api';

interface StudentFeeAssignmentDetailModalProps {
  assignment: FeeAssignment;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (assignment: FeeAssignment) => void;
  onUpdate?: (updatedAssignment: FeeAssignment) => void;
  forceEditMode?: boolean;
}

const StudentFeeAssignmentDetailModal: React.FC<StudentFeeAssignmentDetailModalProps> = ({ 
  assignment, 
  isOpen, 
  onClose, 
  onEdit,
  onUpdate,
  forceEditMode = false
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState<Partial<FeeAssignment>>({});
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [isLoadingFeeStructures, setIsLoadingFeeStructures] = useState(false);

  // Load fee structures when modal opens
  useEffect(() => {
    const loadFeeStructures = async () => {
      if (!isOpen) return;
      
      setIsLoadingFeeStructures(true);
      try {
        const response = await apiService.authenticatedRequest('/fees/structures/', {
          method: 'GET'
        });
        
        if (response && Array.isArray(response.results)) {
          setFeeStructures(response.results);
        } else {
          setFeeStructures([]);
        }
      } catch (error) {
        console.error('Error loading fee structures:', error);
        setFeeStructures([]);
      } finally {
        setIsLoadingFeeStructures(false);
      }
    };

    loadFeeStructures();
  }, [isOpen]);

  // Auto-enter edit mode when forceEditMode is true
  useEffect(() => {
    if (forceEditMode && isOpen) {
      setIsEditMode(true);
      setEditData(assignment);
    }
  }, [forceEditMode, isOpen, assignment]);

  const formatCurrency = (amount: string) => {
    return `KSh ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Initialize edit data when entering edit mode
  const handleEditClick = () => {
    setEditData(assignment);
    setIsEditMode(true);
  };

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle update submission
  const handleUpdate = async () => {
    if (!editData) return;
    
    setIsUpdating(true);
    try {
      const response = await apiService.authenticatedRequest(`/fees/assignments/${assignment.id}/`, {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      
      if (onUpdate) {
        // Merge the response with the original assignment data to ensure we have all fields
        const updatedAssignment = {
          ...assignment,
          ...response,
          // Ensure nested objects are properly merged
          student_details: response.student_details || assignment.student_details,
          fee_structure_details: response.fee_structure_details || assignment.fee_structure_details,
          approved_by_details: response.approved_by_details || assignment.approved_by_details
        };
        onUpdate(updatedAssignment);
      }
      
      setIsEditMode(false);
      setEditData({});
    } catch (error) {
      console.error('Error updating fee assignment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditData({});
  };

  if (!isOpen) return null;

  const assignmentFeatures = [
    {
      title: "Assignment Information",
      tag: "assignment_info",
      description: "Core assignment identification and basic details",
      details: [
        { label: "Assignment ID", value: assignment.id, editable: false, field: "id" },
        { label: "Fee Structure", value: isEditMode ? (editData.fee_structure || "") : (assignment.fee_structure_details?.name || "Not provided"), editable: true, field: "fee_structure", type: "select", options: feeStructures.map(fs => ({ value: fs.id, label: fs.name })) },
        { label: "Academic Year", value: isEditMode ? (editData.academic_year || "") : (assignment.academic_year || "Not provided"), editable: true, field: "academic_year", type: "text" },
        { label: "Term", value: isEditMode ? (editData.term || "") : (assignment.term || 'N/A'), editable: true, field: "term", type: "select", options: [1, 2, 3] },
        { label: "Status", value: isEditMode ? editData.is_active : assignment.is_active, editable: true, field: "is_active", type: "boolean" }
      ]
    },
    {
      title: "Student Details",
      tag: "student_details",
      description: "Student information and current class details",
      details: [
        { label: "Student Name", value: assignment.student_details?.pupil_name || "Not provided", editable: false, field: "student_name" },
        { label: "Admission Number", value: assignment.student_details?.admission_number || "Not provided", editable: false, field: "admission_number" },
        { label: "Current Class", value: assignment.student_details?.current_class?.name || "Not provided", editable: false, field: "current_class" },
        { label: "Stream", value: assignment.student_details?.current_class?.stream?.name || "Not provided", editable: false, field: "stream" },
        { label: "Guardian Name", value: assignment.student_details?.guardian_name || "Not provided", editable: false, field: "guardian_name" },
        { label: "Guardian Phone", value: assignment.student_details?.guardian_phone || "Not provided", editable: false, field: "guardian_phone" }
      ]
    },
    {
      title: "Fee Structure Details",
      tag: "fee_structure_details",
      description: "Fee structure information and configuration",
      details: [
        { label: "Fee Name", value: assignment.fee_structure_details?.name || "Not provided", editable: false, field: "fee_name" },
        { label: "Fee Type", value: assignment.fee_structure_details?.fee_type || "Not provided", editable: false, field: "fee_type" },
        { label: "Category", value: assignment.fee_structure_details?.category || "Not provided", editable: false, field: "category" },
        { label: "Base Amount", value: assignment.fee_structure_details?.amount ? formatCurrency(assignment.fee_structure_details.amount) : "Not provided", editable: false, field: "base_amount" },
        { label: "Frequency", value: assignment.fee_structure_details?.frequency || "Not provided", editable: false, field: "frequency" },
        { label: "Due Date", value: assignment.fee_structure_details?.due_date ? `${assignment.fee_structure_details.due_date}th of month` : "Not provided", editable: false, field: "due_date" }
      ]
    },
    {
      title: "Assignment Configuration",
      tag: "assignment_config",
      description: "Assignment-specific settings and customizations",
      details: [
        { label: "Custom Amount", value: isEditMode ? (editData.custom_amount || "") : (assignment.custom_amount ? formatCurrency(assignment.custom_amount) : "Uses base amount"), editable: true, field: "custom_amount", type: "number" },
        { label: "Is Waived", value: isEditMode ? editData.is_waived : assignment.is_waived, editable: true, field: "is_waived", type: "boolean" },
        { label: "Waiver Reason", value: isEditMode ? (editData.waiver_reason || "") : (assignment.waiver_reason || "Not applicable"), editable: true, field: "waiver_reason", type: "text" },
        { label: "Start Date", value: assignment.start_date ? formatDate(assignment.start_date) : "Not provided", editable: false, field: "start_date" },
        { label: "End Date", value: assignment.end_date ? formatDate(assignment.end_date) : "Not set", editable: false, field: "end_date" }
      ]
    },
    {
      title: "Late Fee Settings",
      tag: "late_fee_settings",
      description: "Late fee configuration and penalties",
      details: [
        { label: "Late Fee Applicable", value: assignment.fee_structure_details?.late_fee_applicable, editable: false, field: "late_fee_applicable" },
        { label: "Late Fee Amount", value: assignment.fee_structure_details?.late_fee_amount ? formatCurrency(assignment.fee_structure_details.late_fee_amount) : "N/A", editable: false, field: "late_fee_amount" },
        { label: "Late Fee Percentage", value: assignment.fee_structure_details?.late_fee_percentage ? `${assignment.fee_structure_details.late_fee_percentage}%` : "N/A", editable: false, field: "late_fee_percentage" }
      ]
    },
    {
      title: "System Information",
      tag: "system_info",
      description: "Creation and update timestamps",
      details: [
        { label: "Created At", value: assignment.created_at ? formatDate(assignment.created_at) : "Not provided", editable: false, field: "created_at" },
        { label: "Updated At", value: assignment.updated_at ? formatDate(assignment.updated_at) : "Not provided", editable: false, field: "updated_at" },
        { label: "Waiver Approved By", value: assignment.approved_by_details?.name || "Not applicable", editable: false, field: "waiver_approved_by" }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
      <div className="bg-blue-100 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-blue-900">
              {assignment.student_details?.pupil_name || 'Student'} - {assignment.fee_structure_details?.name || 'Fee Assignment'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEditClick}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200"
              title="Edit Assignment"
            >
              {FaEdit({ className: "w-4 h-4 text-blue-600" })}
            </button>
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
          {isLoadingFeeStructures && (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-gray-500">Loading fee structures...</div>
            </div>
          )}
          {assignmentFeatures.map((feature, index) => (
            <div key={feature.tag} className="bg-white rounded-lg p-3 shadow-sm">
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
                  <div key={detailIndex} className="flex justify-between items-center py-1 border-b border-blue-200 last:border-b-0">
                    <span className={`text-xs font-semibold text-gray-800 flex-shrink-0 px-2 py-1 ${detail.label === "Assignment ID" ? "w-20" : "w-40"}`}>{detail.label}:</span>
                    <div className={`text-xs text-gray-900 text-right ${detail.label === "Assignment ID" ? "w-52" : "w-32"}`}>
                      {isEditMode && detail.editable ? (
                        // Editable field
                        <div className="w-full">
                          {(detail as any).type === "boolean" ? (
                            <select
                              value={detail.value ? "true" : "false"}
                              onChange={(e) => handleFieldChange(detail.field, e.target.value === "true")}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          ) : (detail as any).type === "select" ? (
                            <select
                              value={String(detail.value || "")}
                              onChange={(e) => handleFieldChange(detail.field!, e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                              disabled={isLoadingFeeStructures && detail.field === "fee_structure"}
                            >
                              <option value="">Select...</option>
                              {(detail as any).options?.map((option: any) => (
                                <option key={option.value || option} value={option.value || option}>
                                  {option.label || option}
                                </option>
                              ))}
                            </select>
                          ) : (detail as any).type === "number" ? (
                            <input
                              type="number"
                              value={String(detail.value || "")}
                              onChange={(e) => handleFieldChange(detail.field!, e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                              placeholder="Enter amount"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(detail.value || "")}
                              onChange={(e) => handleFieldChange(detail.field!, e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                              placeholder={detail.label === "Academic Year" ? "Enter academic year" : detail.label === "Waiver Reason" ? "Enter waiver reason" : "Enter value"}
                            />
                          )}
                        </div>
                      ) : (
                        // Display mode
                        <span>
                          {detail.label === "Status" ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              detail.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {detail.value ? "Active" : "Inactive"}
                            </span>
                          ) : detail.label === "Is Waived" || detail.label === "Late Fee Applicable" ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              detail.value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {detail.value ? "Yes" : "No"}
                            </span>
                          ) : detail.label === "Term" ? (
                            `Term ${detail.value}`
                          ) : detail.label === "Custom Amount" ? (
                            detail.value ? formatCurrency(String(detail.value)) : "Uses base amount"
                          ) : detail.label === "Fee Structure" ? (
                            assignment.fee_structure_details?.name || "Not provided"
                          ) : (
                            String(detail.value || "Not provided")
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-4 pt-4 pb-6 border-t border-blue-200 bg-blue-50">
          <div className="flex justify-end space-x-2">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-1.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-6 py-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      {FaSave({ className: "w-3 h-3" })}
                      <span>Update</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFeeAssignmentDetailModal;
