import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaPlus, FaUserGraduate, FaEye, FaCheckCircle, FaUser, FaMoneyBillWave } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';
import { feesService } from '../../services/fees';
import { apiService } from '../../services/api';
import { Student, FeeStructure, CreateFeeAssignmentRequest, FeeAssignment } from '../../types/fees';
import StudentFeeAssignmentDetailModal from './StudentFeeAssignmentDetailModal';

interface StudentFeeAssignmentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  feeTypeFilter: string;
  setFeeTypeFilter: (filter: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  clearFilters: () => void;
  isAddDrawerOpen: boolean;
  openAddDrawer: () => void;
  closeAddDrawer: () => void;
}



const StudentFeeAssignment: React.FC<StudentFeeAssignmentProps> = ({
  searchQuery,
  setSearchQuery,
  debouncedSearchQuery,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  feeTypeFilter,
  setFeeTypeFilter,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  clearFilters,
  isAddDrawerOpen,
  openAddDrawer,
  closeAddDrawer
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [assignments, setAssignments] = useState<FeeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Form state for new assignment
  const [newAssignment, setNewAssignment] = useState<CreateFeeAssignmentRequest>({
    academic_year: '',
    fee_structure: '',
    student: '',
    term: 1,
    custom_amount: null,
    is_waived: false,
    waiver_reason: '',
    is_active: true
  });

  // Search states for dropdowns
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [feeStructureSearchQuery, setFeeStructureSearchQuery] = useState('');
  const [searchedStudents, setSearchedStudents] = useState<Student[]>([]);
  const [searchedFeeStructures, setSearchedFeeStructures] = useState<FeeStructure[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [isSearchingFeeStructures, setIsSearchingFeeStructures] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showFeeStructureDropdown, setShowFeeStructureDropdown] = useState(false);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<FeeAssignment | null>(null);

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FeeAssignment | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<FeeAssignment>>({});
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string[] }>({});




  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch assignments from API
      const response = await feesService.getAllAssignments({
        ordering: sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined,
        page: 1,
        page_size: 20,
        search: debouncedSearchQuery || undefined
      });
      
      // Get results from response (no data wrapper in this API)
      const results = response?.results;
      
      if (response && Array.isArray(results)) {
        // Filter out any invalid assignments before setting
        const validAssignments = results.filter(assignment => 
          assignment && assignment.id && assignment.student_details && assignment.fee_structure_details
        );
        
        setAssignments(validAssignments);
      } else {
        setAssignments([]);
      }
      
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to fetch fee assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortDirection, debouncedSearchQuery]);

  // Search students function
  const searchStudents = useCallback(async (query: string) => {
    try {
      setIsSearchingStudents(true);
      const response = await feesService.searchStudents(query);
      // Handle the response structure - it's directly the paginated structure
      if (response && Array.isArray(response.results)) {
        setSearchedStudents(response.results);
      } else {
        setSearchedStudents([]);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchedStudents([]);
    } finally {
      setIsSearchingStudents(false);
    }
  }, []);

  // Search fee structures function
  const searchFeeStructures = useCallback(async (query: string) => {
    try {
      setIsSearchingFeeStructures(true);
      const response = await feesService.searchFeeStructures(query);
      // Handle the response structure - it's directly the paginated structure
      if (response && Array.isArray(response.results)) {
        setSearchedFeeStructures(response.results);
      } else {
        setSearchedFeeStructures([]);
      }
    } catch (error) {
      console.error('Error searching fee structures:', error);
      setSearchedFeeStructures([]);
    } finally {
      setIsSearchingFeeStructures(false);
    }
  }, []);

  // Debounced search effects
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStudents(studentSearchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [studentSearchQuery, searchStudents]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFeeStructures(feeStructureSearchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [feeStructureSearchQuery, searchFeeStructures]);

  // Load initial data when component mounts
  useEffect(() => {
    searchStudents('');
    searchFeeStructures('');
  }, [searchStudents, searchFeeStructures]);

  // Fetch assignments
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        setTimeout(() => {
          setOpenDropdownId(null);
          setDropdownPosition(null);
        }, 100);
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const handleFormInputChange = (field: string, value: any) => {
    setNewAssignment(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Auto-set custom amount when fee structure is selected
    if (field === 'fee_structure' && value) {
      const selectedFeeStructure = searchedFeeStructures.find(fs => fs.id === value);
      if (selectedFeeStructure) {
        setNewAssignment(prev => ({
          ...prev,
          custom_amount: selectedFeeStructure.amount
        }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Prepare data for API
      const assignmentData: CreateFeeAssignmentRequest = {
        ...newAssignment,
        custom_amount: newAssignment.custom_amount || null,
        waiver_reason: newAssignment.waiver_reason || undefined
      };

      // Make API call
      await feesService.createAssignment(assignmentData);
      
      // Close drawer and refresh data
      closeAddDrawer();
      resetForm();
      fetchAssignments();
      
      // Show success message
      setToast({
        message: 'Fee assignment created successfully!',
        type: 'success'
      });
      
      setTimeout(() => setToast(null), 3000);
      
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        setFormErrors({ general: ['Failed to create fee assignment. Please try again.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      FaChevronUp({ className: "w-3 h-3" }) : 
      FaChevronDown({ className: "w-3 h-3" });
  };

  const resetForm = () => {
    setFormErrors({});
    setNewAssignment({
      academic_year: '',
      fee_structure: '',
      student: '',
      term: 1,
      custom_amount: null,
      is_waived: false,
      waiver_reason: '',
      is_active: true
    });
    setStudentSearchQuery('');
    setFeeStructureSearchQuery('');
    setSearchedStudents([]);
    setSearchedFeeStructures([]);
    setShowStudentDropdown(false);
    setShowFeeStructureDropdown(false);
  };

  // Modal handlers
  const handleViewDetails = (assignment: FeeAssignment) => {
    setSelectedAssignment(assignment);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAssignment(null);
  };

  const handleAssignmentUpdate = (updatedAssignment: FeeAssignment) => {
    // Update the assignment in the local state
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === updatedAssignment.id ? updatedAssignment : assignment
      )
    );
    
    // Update the selected assignment if it's the same one
    if (selectedAssignment && selectedAssignment.id === updatedAssignment.id) {
      setSelectedAssignment(updatedAssignment);
    }
    
    // Show success message
    setToast({
      message: 'Fee assignment updated successfully!',
      type: 'success'
    });
    
    setTimeout(() => setToast(null), 3000);
  };

  // Edit drawer handlers
  const handleEditAssignment = (assignment: FeeAssignment) => {
    setEditingAssignment(assignment);
    setEditFormData({
      academic_year: assignment.academic_year,
      fee_structure: assignment.fee_structure,
      term: assignment.term,
      custom_amount: assignment.custom_amount,
      is_waived: assignment.is_waived,
      waiver_reason: assignment.waiver_reason,
      is_active: assignment.is_active
    });
    setEditFormErrors({});
    setIsEditDrawerOpen(true);
  };

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingAssignment(null);
    setEditFormData({});
    setEditFormErrors({});
  };

  const handleEditFormInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (editFormErrors[field]) {
      setEditFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment || !editFormData) return;
    
    setIsUpdatingAssignment(true);
    setEditFormErrors({});
    
    try {
      const response = await apiService.authenticatedRequest(`/fees/assignments/${editingAssignment.id}/`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      
      // Update the assignment in the local state
      const updatedAssignment = {
        ...editingAssignment,
        ...response,
        student_details: response.student_details || editingAssignment.student_details,
        fee_structure_details: response.fee_structure_details || editingAssignment.fee_structure_details,
        approved_by_details: response.approved_by_details || editingAssignment.approved_by_details
      };
      
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === updatedAssignment.id ? updatedAssignment : assignment
        )
      );
      
      // Close drawer and show success message
      handleCloseEditDrawer();
      setToast({
        message: 'Fee assignment updated successfully!',
        type: 'success'
      });
      
      setTimeout(() => setToast(null), 3000);
      
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      
      if (error.response?.data?.errors) {
        setEditFormErrors(error.response.data.errors);
      } else {
        setEditFormErrors({ general: ['Failed to update fee assignment. Please try again.'] });
      }
    } finally {
      setIsUpdatingAssignment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      waived: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Waived' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Filter assignments based on search and filters
  const filteredAssignments = assignments.filter(assignment => {
    // Add null checks for all nested properties
    if (!assignment || !assignment.student_details || !assignment.fee_structure_details) {
      return false;
    }

    const matchesSearch = !debouncedSearchQuery || 
      (assignment.student_details.pupil_name && assignment.student_details.pupil_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
      (assignment.student_details.admission_number && assignment.student_details.admission_number.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
      (assignment.fee_structure_details.name && assignment.fee_structure_details.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));

    const matchesClass = !feeTypeFilter || (assignment.student_details.current_class && assignment.student_details.current_class.id === feeTypeFilter);
    const matchesStream = !categoryFilter || (assignment.student_details.current_class && assignment.student_details.current_class.stream && assignment.student_details.current_class.stream.id === categoryFilter);
    const matchesStatus = !statusFilter || (assignment.is_active ? 'active' : 'inactive') === statusFilter;

    return matchesSearch && matchesClass && matchesStream && matchesStatus;
  });

  return (
    <div>
      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading && (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading fee assignments...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">
              {FaTimes({ className: "w-12 h-12 mx-auto mb-2" })}
              <p className="text-lg font-medium">Error Loading Fee Assignments</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchAssignments()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto border-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('student_name')}>
                      <div className="flex items-center space-x-1">
                        <span>Student</span>
                        {getSortIcon('student_name')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class')}>
                      <div className="flex items-center space-x-1">
                        <span>Class</span>
                        {getSortIcon('class')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('stream')}>
                      <div className="flex items-center space-x-1">
                        <span>Stream</span>
                        {getSortIcon('stream')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fee_structure_name')}>
                      <div className="flex items-center space-x-1">
                        <span>Fee Structure</span>
                        {getSortIcon('fee_structure_name')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('assigned_amount')}>
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                        {getSortIcon('assigned_amount')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('term')}>
                      <div className="flex items-center space-x-1">
                        <span>Term</span>
                        {getSortIcon('term')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredAssignments.map((assignment, index) => (
                    <tr key={assignment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            {FaUser({ className: "w-3 h-3 text-blue-600" })}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{assignment.student_details?.pupil_name || 'N/A'}</div>
                            <div className="text-gray-500">{assignment.student_details?.admission_number || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {assignment.student_details?.current_class?.name || 'N/A'}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {assignment.student_details?.current_class?.stream?.name || 'N/A'}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        <div className="flex items-center space-x-1">
                          {FaMoneyBillWave({ className: "w-3 h-3 text-green-600" })}
                          <span>{assignment.fee_structure_details?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        KSh {assignment.custom_amount ? 
                          parseFloat(assignment.custom_amount).toLocaleString() : 
                          (assignment.fee_structure_details?.amount ? parseFloat(assignment.fee_structure_details.amount).toLocaleString() : '0')
                        }
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        Term {assignment.term || 'N/A'}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {getStatusBadge(assignment.is_active ? 'active' : 'inactive')}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleViewDetails(assignment)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                            title="View Details"
                          >
                            {FaEye({ className: "w-3 h-3" })}
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + window.scrollY,
                                  left: rect.right - 120 + window.scrollX
                                });
                                setOpenDropdownId(openDropdownId === assignment.id ? null : assignment.id);
                              }}
                              className={`p-1 rounded-md transition-colors duration-200 ${
                                openDropdownId === assignment.id
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                              }`}
                              title="More Options"
                            >
                              {FaEllipsisV({ className: "w-3 h-3" })}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {!loading && !error && filteredAssignments.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  {FaUserGraduate({ className: "w-12 h-12 mx-auto mb-2" })}
                  <p className="text-lg font-medium text-gray-600">No Fee Assignments Found</p>
                  <p className="text-sm text-gray-500 mt-1">Get started by creating your first fee assignment</p>
                </div>
                <PermissionGate permissions={['access_fees']}>
                  <button
                    onClick={openAddDrawer}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200"
                  >
                    {FaPlus({ className: "w-4 h-4 inline mr-2" })}
                    Add Assignment
                  </button>
                </PermissionGate>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Dropdown Portal */}
      {openDropdownId && dropdownPosition && createPortal(
        <div
          className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-32"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenDropdownId(null);
              setDropdownPosition(null);
              // Find the assignment being edited
              const assignment = assignments.find(a => a.id === openDropdownId);
              if (assignment) {
                handleEditAssignment(assignment);
              }
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            {FaEdit({ className: "w-3 h-3" })}
            <span>Edit</span>
          </button>
          <button
            onClick={() => {
              setOpenDropdownId(null);
              setDropdownPosition(null);
              // Handle delete assignment
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            {FaTrash({ className: "w-3 h-3" })}
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}

      {/* Add Assignment Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300 ease-out z-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  {FaUserGraduate({ className: "w-5 h-5 text-blue-600" })}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Fee Assignment</h2>
                  <p className="text-sm text-gray-500">Assign a fee structure to a student</p>
                </div>
              </div>
              <button
                onClick={closeAddDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* General Error Banner */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div className="p-1 bg-red-100 rounded-full">
                          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">Please fix the errors below</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Academic Year */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={newAssignment.academic_year}
                    onChange={(e) => handleFormInputChange('academic_year', e.target.value)}
                    placeholder="e.g., 2024-2025"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                      formErrors.academic_year ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.academic_year && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.academic_year[0]}</p>
                  )}
                </div>

                {/* Student Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Student *
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder="Search and select a student..."
                        className={`w-full px-3 py-2 pr-8 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          formErrors.student ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onFocus={() => {
                          setShowStudentDropdown(true);
                          if (searchedStudents.length === 0) {
                            searchStudents(studentSearchQuery);
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding dropdown to allow click on options
                          setTimeout(() => setShowStudentDropdown(false), 200);
                        }}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {isSearchingStudents ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {showStudentDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchedStudents.length > 0 ? (
                          searchedStudents
                            .filter(student => student && student.id && student.pupil_name)
                            .map((student) => (
                              <button
                                key={student.id}
                                onClick={() => {
                                  setNewAssignment(prev => ({ ...prev, student: student.id }));
                                  setStudentSearchQuery(`${student.pupil_name} (${student.admission_number || 'N/A'}) - ${student.current_class?.name || 'N/A'} ${student.current_class?.stream?.name || 'N/A'}`);
                                  setShowStudentDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-left text-xs hover:bg-green-50 border-b border-gray-100 last:border-b-0 focus:bg-green-50 focus:outline-none"
                              >
                                <div className="font-medium text-gray-900">{student.pupil_name}</div>
                                <div className="text-gray-500">{student.admission_number || 'N/A'} - {student.current_class?.name || 'N/A'} {student.current_class?.stream?.name || 'N/A'}</div>
                              </button>
                            ))
                        ) : (
                          <div className="p-3">
                            <p className="text-xs text-gray-500 text-center">No students found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.student && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.student[0]}</p>
                  )}
                </div>

                {/* Fee Structure Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                    Fee Structure *
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={feeStructureSearchQuery}
                        onChange={(e) => setFeeStructureSearchQuery(e.target.value)}
                        placeholder="Search and select a fee structure..."
                        className={`w-full px-3 py-2 pr-8 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                          formErrors.fee_structure ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onFocus={() => {
                          setShowFeeStructureDropdown(true);
                          if (searchedFeeStructures.length === 0) {
                            searchFeeStructures(feeStructureSearchQuery);
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding dropdown to allow click on options
                          setTimeout(() => setShowFeeStructureDropdown(false), 200);
                        }}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {isSearchingFeeStructures ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {showFeeStructureDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchedFeeStructures.length > 0 ? (
                          searchedFeeStructures
                            .filter(structure => structure && structure.id && structure.name)
                            .map((structure) => (
                              <button
                                key={structure.id}
                                onClick={() => {
                                  setNewAssignment(prev => ({ ...prev, fee_structure: structure.id }));
                                  setFeeStructureSearchQuery(`${structure.name} - KSh ${structure.amount || '0'}`);
                                  setShowFeeStructureDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 focus:bg-indigo-50 focus:outline-none"
                              >
                                <div className="font-medium text-gray-900">{structure.name}</div>
                                <div className="text-gray-500">KSh {structure.amount || '0'} • {structure.fee_type || 'N/A'}</div>
                              </button>
                            ))
                        ) : (
                          <div className="p-3">
                            <p className="text-xs text-gray-500 text-center">No fee structures found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.fee_structure && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.fee_structure[0]}</p>
                  )}
                </div>

                {/* Term */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                    Term *
                  </label>
                  <select
                    value={newAssignment.term}
                    onChange={(e) => handleFormInputChange('term', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                      formErrors.term ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                  {formErrors.term && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.term[0]}</p>
                  )}
                </div>

                {/* Custom Amount */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Custom Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAssignment.custom_amount || ''}
                    onChange={(e) => handleFormInputChange('custom_amount', e.target.value || null)}
                    placeholder="Leave empty for default amount"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                      formErrors.custom_amount ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.custom_amount && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.custom_amount[0]}</p>
                  )}
                </div>

                {/* Is Waived */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                    Fee Waiver
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAssignment.is_waived}
                        onChange={(e) => handleFormInputChange('is_waived', e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="ml-2 text-xs text-gray-700">Is this fee waived?</span>
                    </label>
                  </div>
                  {formErrors.is_waived && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.is_waived[0]}</p>
                  )}
                </div>

                {/* Waiver Reason */}
                {newAssignment.is_waived && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                      Waiver Reason *
                    </label>
                    <textarea
                      value={newAssignment.waiver_reason || ''}
                      onChange={(e) => handleFormInputChange('waiver_reason', e.target.value)}
                      placeholder="Enter reason for fee waiver..."
                      rows={2}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all duration-200 bg-white ${
                        formErrors.waiver_reason ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.waiver_reason && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.waiver_reason[0]}</p>
                    )}
                  </div>
                )}

                {/* Is Active */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Assignment Status
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAssignment.is_active}
                        onChange={(e) => handleFormInputChange('is_active', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="ml-2 text-xs text-gray-700">Active assignment</span>
                    </label>
                  </div>
                  {formErrors.is_active && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.is_active[0]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={closeAddDrawer}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                {isSubmitting ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center p-4 rounded-lg shadow-lg transition-all duration-300">
          <div className={`flex items-center space-x-3 ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          } px-6 py-4 rounded-lg shadow-xl`}>
            {toast.type === 'success' ? (
              FaCheckCircle({ className: "w-5 h-5 text-green-600" })
            ) : (
              FaTimes({ className: "w-5 h-5 text-red-600" })
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 text-gray-400 hover:text-gray-600"
            >
              {FaTimes({ className: "w-4 h-4" })}
            </button>
          </div>
        </div>
      )}

      {/* Student Fee Assignment Detail Modal */}
      {selectedAssignment && (
        <StudentFeeAssignmentDetailModal
          assignment={selectedAssignment}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onUpdate={handleAssignmentUpdate}
        />
      )}

      {/* Edit Assignment Drawer */}
      {isEditDrawerOpen && editingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300 ease-out z-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  {FaEdit({ className: "w-5 h-5 text-blue-600" })}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Edit Fee Assignment</h2>
                  <p className="text-sm text-gray-500">
                    {editingAssignment.student_details?.pupil_name} - {editingAssignment.fee_structure_details?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseEditDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* General Error Banner */}
                {Object.keys(editFormErrors).length > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div className="p-1 bg-red-100 rounded-full">
                          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">Please fix the errors below</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Academic Year */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={editFormData.academic_year || ""}
                    onChange={(e) => handleEditFormInputChange('academic_year', e.target.value)}
                    placeholder="e.g., 2024-2025"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                      editFormErrors.academic_year ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.academic_year && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.academic_year[0]}</p>
                  )}
                </div>

                {/* Fee Structure Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                    Fee Structure *
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={feeStructureSearchQuery}
                        onChange={(e) => setFeeStructureSearchQuery(e.target.value)}
                        placeholder="Search and select a fee structure..."
                        className={`w-full px-3 py-2 pr-8 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                          editFormErrors.fee_structure ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onFocus={() => {
                          setShowFeeStructureDropdown(true);
                          if (searchedFeeStructures.length === 0) {
                            searchFeeStructures(feeStructureSearchQuery);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowFeeStructureDropdown(false), 200);
                        }}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {isSearchingFeeStructures ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {showFeeStructureDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchedFeeStructures.length > 0 ? (
                          searchedFeeStructures
                            .filter(structure => structure && structure.id && structure.name)
                            .map((structure) => (
                              <button
                                key={structure.id}
                                onClick={() => {
                                  setEditFormData(prev => ({ ...prev, fee_structure: structure.id }));
                                  setFeeStructureSearchQuery(`${structure.name} - KSh ${structure.amount || '0'}`);
                                  setShowFeeStructureDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 focus:bg-indigo-50 focus:outline-none"
                              >
                                <div className="font-medium text-gray-900">{structure.name}</div>
                                <div className="text-gray-500">KSh {structure.amount || '0'} • {structure.fee_type || 'N/A'}</div>
                              </button>
                            ))
                        ) : (
                          <div className="p-3">
                            <p className="text-xs text-gray-500 text-center">No fee structures found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {editFormErrors.fee_structure && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.fee_structure[0]}</p>
                  )}
                </div>

                {/* Term */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                    Term *
                  </label>
                  <select
                    value={editFormData.term || 1}
                    onChange={(e) => handleEditFormInputChange('term', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                      editFormErrors.term ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                  {editFormErrors.term && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.term[0]}</p>
                  )}
                </div>

                {/* Custom Amount */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Custom Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.custom_amount || ''}
                    onChange={(e) => handleEditFormInputChange('custom_amount', e.target.value || null)}
                    placeholder="Leave empty for default amount"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                      editFormErrors.custom_amount ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.custom_amount && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.custom_amount[0]}</p>
                  )}
                </div>

                {/* Is Waived */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                    Fee Waiver
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.is_waived || false}
                        onChange={(e) => handleEditFormInputChange('is_waived', e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="ml-2 text-xs text-gray-700">Is this fee waived?</span>
                    </label>
                  </div>
                  {editFormErrors.is_waived && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.is_waived[0]}</p>
                  )}
                </div>

                {/* Waiver Reason */}
                {editFormData.is_waived && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                      Waiver Reason *
                    </label>
                    <textarea
                      value={editFormData.waiver_reason || ''}
                      onChange={(e) => handleEditFormInputChange('waiver_reason', e.target.value)}
                      placeholder="Enter reason for fee waiver..."
                      rows={2}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all duration-200 bg-white ${
                        editFormErrors.waiver_reason ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.waiver_reason && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.waiver_reason[0]}</p>
                    )}
                  </div>
                )}

                {/* Is Active */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Assignment Status
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.is_active || false}
                        onChange={(e) => handleEditFormInputChange('is_active', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="ml-2 text-xs text-gray-700">Active assignment</span>
                    </label>
                  </div>
                  {editFormErrors.is_active && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.is_active[0]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={handleCloseEditDrawer}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAssignment}
                disabled={isUpdatingAssignment}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                {isUpdatingAssignment ? 'Updating...' : 'Update Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeeAssignment;
