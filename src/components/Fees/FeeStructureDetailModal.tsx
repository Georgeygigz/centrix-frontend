import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaSave } from 'react-icons/fa';
import { FeeStructure } from '../../types/fees';
import { Class, Stream } from '../../types/dashboard';
import { apiService } from '../../services/api';

interface FeeStructureDetailModalProps {
  feeStructure: FeeStructure;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (feeStructure: FeeStructure) => void;
  onUpdate?: (updatedFeeStructure: FeeStructure) => void;
  forceEditMode?: boolean;
}

const FeeStructureDetailModal: React.FC<FeeStructureDetailModalProps> = ({ 
  feeStructure, 
  isOpen, 
  onClose, 
  onEdit,
  onUpdate,
  forceEditMode = false
}) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState<Partial<FeeStructure>>({});

  // Load classes and streams data
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      setIsLoadingData(true);
      try {
        const [classesData, streamsData] = await Promise.all([
          apiService.students.getClasses(),
          apiService.students.getStreams()
        ]);
        
        setClasses(classesData || []);
        setStreams(streamsData || []);
      } catch (error) {
        console.error('Error loading classes and streams:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [isOpen]);

  // Auto-enter edit mode when forceEditMode is true
  useEffect(() => {
    if (forceEditMode && isOpen) {
      setIsEditMode(true);
      setEditData(feeStructure);
    }
  }, [forceEditMode, isOpen, feeStructure]);

  // Helper function to get class name by ID
  const getClassNameById = (classId: string | null | undefined): string => {
    if (!classId) return "All Classes";
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : `Class ID: ${classId}`;
  };

  // Helper function to get stream name by ID
  const getStreamNameById = (streamId: string | null | undefined): string => {
    if (!streamId) return "All Streams";
    const streamItem = streams.find(s => s.id === streamId);
    return streamItem ? streamItem.name : `Stream ID: ${streamId}`;
  };

  const formatCurrency = (amount: string) => {
    return `KSh ${parseFloat(amount).toLocaleString()}`;
  };

  // Initialize edit data when entering edit mode
  const handleEditClick = () => {
    setEditData(feeStructure);
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
      const response = await apiService.authenticatedRequest(`/fees/structures/${feeStructure.id}/`, {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      
      if (onUpdate) {
        onUpdate(response);
      }
      
      setIsEditMode(false);
      setEditData({});
    } catch (error) {
      console.error('Error updating fee structure:', error);
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

  const feeStructureFeatures = [
    {
      title: "Basic Information",
      tag: "basic_info",
      description: "Core fee structure identification and basic details",
      details: [
        { label: "Fee ID", value: feeStructure.id, editable: false, field: "id" },
        { label: "Name", value: isEditMode ? (editData.name || "") : (feeStructure.name || ""), editable: true, field: "name", type: "text" },
        { label: "Description", value: isEditMode ? (editData.description || "") : (feeStructure.description || "Not provided"), editable: true, field: "description", type: "text" },
        { label: "Status", value: isEditMode ? editData.is_active : feeStructure.is_active, editable: true, field: "is_active", type: "boolean" }
      ]
    },
    {
      title: "Fee Configuration",
      tag: "fee_config",
      description: "Fee type, category, amount and frequency settings",
      details: [
        { label: "Fee Type", value: isEditMode ? (editData.fee_type || "") : (feeStructure.fee_type || ""), editable: true, field: "fee_type", type: "select", options: ["tuition", "development", "transport", "library", "sports", "examination", "other"] },
        { label: "Category", value: isEditMode ? (editData.category || "") : (feeStructure.category || ""), editable: true, field: "category", type: "select", options: ["academic", "non_academic", "administrative", "other"] },
        { label: "Amount", value: isEditMode ? (editData.amount || "") : (feeStructure.amount || ""), editable: true, field: "amount", type: "number" },
        { label: "Frequency", value: isEditMode ? (editData.frequency || "") : (feeStructure.frequency || ""), editable: true, field: "frequency", type: "select", options: ["monthly", "termly", "yearly", "one_time"] }
      ]
    },
    {
      title: "Applicability",
      tag: "applicability",
      description: "Class and stream applicability settings",
      details: [
        { label: "Applicable To All", value: isEditMode ? editData.applicable_to_all : feeStructure.applicable_to_all, editable: true, field: "applicable_to_all", type: "boolean" },
        { label: "Applicable Class", value: isEditMode ? (editData.applicable_class || "") : (feeStructure.applicable_class || ""), editable: true, field: "applicable_class", type: "select", options: classes.map(c => ({ value: c.id, label: c.name })) },
        { label: "Applicable Stream", value: isEditMode ? (editData.applicable_stream || "") : (feeStructure.applicable_stream || ""), editable: true, field: "applicable_stream", type: "select", options: streams.map(s => ({ value: s.id, label: s.name })) },
        { label: "Due Date", value: isEditMode ? (editData.due_date || "") : (feeStructure.due_date || ""), editable: true, field: "due_date", type: "date" }
      ]
    },
    {
      title: "Late Fee Settings",
      tag: "late_fee_settings",
      description: "Late fee configuration and penalties",
      details: [
        { label: "Late Fee Applicable", value: isEditMode ? editData.late_fee_applicable : feeStructure.late_fee_applicable, editable: true, field: "late_fee_applicable", type: "boolean" },
        { label: "Late Fee Amount", value: isEditMode ? (editData.late_fee_amount || "") : (feeStructure.late_fee_amount || ""), editable: true, field: "late_fee_amount", type: "number" },
        { label: "Late Fee Percentage", value: isEditMode ? (editData.late_fee_percentage || "") : (feeStructure.late_fee_percentage || ""), editable: true, field: "late_fee_percentage", type: "number" }
      ]
    },
    {
      title: "Discount Settings",
      tag: "discount_settings",
      description: "Discount configuration and limits",
      details: [
        { label: "Is Discount", value: isEditMode ? editData.is_discount : feeStructure.is_discount, editable: true, field: "is_discount", type: "boolean" },
        { label: "Discount Percentage", value: isEditMode ? (editData.discount_percentage || "") : (feeStructure.discount_percentage || ""), editable: true, field: "discount_percentage", type: "number" },
        { label: "Max Discount Amount", value: isEditMode ? (editData.max_discount_amount || "") : (feeStructure.max_discount_amount || ""), editable: true, field: "max_discount_amount", type: "number" }
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
            <h2 className="text-lg font-bold text-blue-900">{feeStructure.name}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEditClick}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200"
              title="Edit Fee Structure"
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
          {isLoadingData && (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-gray-500">Loading class and stream data...</div>
            </div>
          )}
          {feeStructureFeatures.map((feature, index) => (
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
                    <span className={`text-xs font-semibold text-gray-800 flex-shrink-0 px-2 py-1 ${detail.label === "Fee ID" ? "w-20" : "w-40"}`}>{detail.label}:</span>
                    <div className={`text-xs text-gray-900 text-right ${detail.label === "Fee ID" ? "w-52" : "w-32"}`}>
                      {isEditMode && detail.editable ? (
                        // Editable field
                        <div className="w-full">
                          {detail.type === "boolean" ? (
                            <select
                              value={detail.value ? "true" : "false"}
                              onChange={(e) => handleFieldChange(detail.field, e.target.value === "true")}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          ) : detail.type === "select" ? (
                            <select
                              value={String(detail.value || "")}
                              onChange={(e) => handleFieldChange(detail.field!, e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                            >
                              <option value="">Select...</option>
                              {(detail as any).options?.map((option: any) => (
                                <option key={option.value || option} value={option.value || option}>
                                  {option.label || option}
                                </option>
                              ))}
                            </select>
                          ) : detail.type === "number" ? (
                            <input
                              type="number"
                              value={String(detail.value || "")}
                              onChange={(e) => handleFieldChange(detail.field!, e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                              placeholder="Enter amount"
                            />
                          ) : detail.type === "date" ? (
                            <input
                              type="date"
                              value={String(detail.value || "")}
                              onChange={(e) => handleFieldChange(detail.field!, e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(detail.value || "")}
                              onChange={(e) => handleFieldChange(detail.field!, e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                              placeholder={detail.label === "Name" ? "Enter name" : detail.label === "Description" ? "Enter description" : "Enter value"}
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
                          ) : detail.label === "Applicable To All" || detail.label === "Late Fee Applicable" || detail.label === "Is Discount" ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              detail.value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {detail.value ? "Yes" : "No"}
                            </span>
                          ) : detail.label === "Applicable Class" ? (
                            getClassNameById(String(detail.value))
                          ) : detail.label === "Applicable Stream" ? (
                            getStreamNameById(String(detail.value))
                          ) : detail.label === "Amount" ? (
                            formatCurrency(String(detail.value))
                          ) : detail.label === "Due Date" ? (
                            detail.value && typeof detail.value === 'string' ? new Date(detail.value).toLocaleDateString() : "Not set"
                          ) : detail.label === "Late Fee Amount" ? (
                            detail.value ? formatCurrency(String(detail.value)) : "N/A"
                          ) : detail.label === "Late Fee Percentage" ? (
                            detail.value ? `${detail.value}%` : "N/A"
                          ) : detail.label === "Discount Percentage" ? (
                            detail.value ? `${detail.value}%` : "N/A"
                          ) : detail.label === "Max Discount Amount" ? (
                            detail.value ? formatCurrency(String(detail.value)) : "N/A"
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

export default FeeStructureDetailModal;
