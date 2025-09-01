import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaUser, FaEdit, FaEye, FaUserFriends, FaTrash, FaPlus } from 'react-icons/fa';
import { Student } from '../../types/dashboard';
import { StudentParentRelationship } from '../../types/parents';
import { apiService } from '../../services/api';

interface StudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, isOpen, onClose }) => {
  const [studentParents, setStudentParents] = useState<StudentParentRelationship[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [isAddParentDrawerOpen, setIsAddParentDrawerOpen] = useState(false);
  const [parents, setParents] = useState<any[]>([]);
  const [loadingParentsList, setLoadingParentsList] = useState(false);
  const [newParentRelationship, setNewParentRelationship] = useState({
    parent_id: '',
    relationship_type: '',
    is_primary_contact: false,
    is_emergency_contact: false,
    can_pick_up: false,
    notes: ''
  });
  const [parentFormErrors, setParentFormErrors] = useState<Record<string, string[]>>({});
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);

  const fetchStudentParents = useCallback(async () => {
    if (!student?.id) return;
    
    setLoadingParents(true);
    try {
      console.log('Fetching parents for student:', student.id);
      const response = await apiService.students.getParents(student.id);
      console.log('API response:', response);
      
      // Handle both response formats: direct response or wrapped in data property
      let results;
      if (response.data && response.data.results) {
        // Response is wrapped in data property
        results = response.data.results;
        console.log('Using wrapped response format');
      } else if (response.results) {
        // Response is direct
        results = response.results;
        console.log('Using direct response format');
      } else {
        console.error('Unexpected response format:', response);
        return;
      }
      
      console.log('Parents results:', results);
      console.log('Setting studentParents state with:', results);
      setStudentParents(results);
    } catch (error) {
      console.error('Error fetching student parents:', error);
    } finally {
      setLoadingParents(false);
    }
  }, [student?.id]);

  const handleDisassociateParent = async (relationshipId: string) => {
    if (!student?.id) return;
    
    if (window.confirm('Are you sure you want to dis-associate this parent from the student?')) {
      try {
        await apiService.students.disassociateParent(student.id, relationshipId);
        console.log('Parent dis-associated successfully');
        // Refresh the parents list
        fetchStudentParents();
      } catch (error) {
        console.error('Error dis-associating parent:', error);
        alert('Failed to dis-associate parent. Please try again.');
      }
    }
  };

  const handleAddParent = () => {
    setIsAddParentDrawerOpen(true);
    fetchParentsList();
  };

  const closeAddParentDrawer = () => {
    setIsAddParentDrawerOpen(false);
    setNewParentRelationship({
      parent_id: '',
      relationship_type: '',
      is_primary_contact: false,
      is_emergency_contact: false,
      can_pick_up: false,
      notes: ''
    });
    setParentFormErrors({});
    setParentSearchQuery('');
    setIsParentDropdownOpen(false);
  };

  const fetchParentsList = async () => {
    setLoadingParentsList(true);
    try {
      const response = await apiService.parents.getAll({ page: 1, page_size: 100 });
      setParents(response.results || []);
    } catch (error) {
      console.error('Error fetching parents list:', error);
    } finally {
      setLoadingParentsList(false);
    }
  };

  const getParentFieldError = (field: string) => {
    return parentFormErrors[field] && parentFormErrors[field].length > 0 
      ? parentFormErrors[field][0] 
      : null;
  };

  const handleAddParentSubmit = async () => {
    if (!student?.id || !newParentRelationship.parent_id || !newParentRelationship.relationship_type) {
      return;
    }

    try {
      await apiService.students.associateParent(student.id, newParentRelationship);
      console.log('Parent associated successfully');
      closeAddParentDrawer();
      fetchStudentParents(); // Refresh the parents list
    } catch (error: any) {
      console.error('Error associating parent:', error);
      console.log('Error response data:', error.response?.data);
      
      // Handle validation errors from API response
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        console.log('Setting form errors:', errors);
        setParentFormErrors(errors);
        
        // Show general error message if there are non-field errors
        if (errors.non_field_errors && errors.non_field_errors.length > 0) {
          alert(errors.non_field_errors[0]);
        }
      } else {
        alert('Failed to associate parent. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      fetchStudentParents();
    }
  }, [isOpen, student, fetchStudentParents]);

  // Close parent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.parent-dropdown-container')) {
        setIsParentDropdownOpen(false);
        setParentSearchQuery('');
      }
    };

    if (isParentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isParentDropdownOpen]);

  console.log('StudentModal render - studentParents state:', studentParents);
  console.log('StudentModal render - loadingParents state:', loadingParents);
  
  if (!isOpen || !student) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white shadow-xl max-w-2xl w-full max-h-[75vh] overflow-visible relative">
          {/* Close Button - Top Right Corner */}
          <button
            onClick={onClose}
            className="absolute -top-8 -right-8 w-12 h-12 bg-red-300/80 hover:bg-red-400/90 text-white rounded-full shadow-lg transition-all duration-200 z-[9999] flex items-center justify-center"
          >
            {FaTimes({ className: "w-5 h-5" })}
          </button>

          {/* Header with Student Name */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            {/* Profile Picture - Top Left Corner */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 shadow-sm mr-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  {FaUser({ className: "w-8 h-8 text-white" })}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-1">{student.fullName || student.pupil_name || 'Student Name'}</h2>
              <div className="space-y-0.5 text-xs text-gray-600">
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
          </div>

          {/* Content */}
          <div className="p-3 relative overflow-y-auto max-h-[calc(75vh-120px)]">
            {/* Information Sections - Stacked Cards */}
            <div className="space-y-3">
              {/* Student Info Section */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-sm font-bold text-blue-900">Student Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center py-1 border-b border-blue-200">
                    <span className="text-xs font-semibold text-blue-700">Student ID:</span>
                    <span className="text-xs font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{student.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-blue-200">
                    <span className="text-xs font-semibold text-blue-700">Admission #:</span>
                    <span className="text-xs font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{student.admissionNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-blue-200">
                    <span className="text-xs font-semibold text-blue-700">Email:</span>
                    <span className="text-xs text-blue-900">N/A</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-semibold text-blue-700">Phone:</span>
                    <span className="text-xs text-blue-900">{student.guardianPhone || student.contactInfo || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Academic Info Section */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-sm font-bold text-green-900">Academic Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center py-1 border-b border-green-200">
                    <span className="text-xs font-semibold text-green-700">School:</span>
                    <span className="text-xs text-green-900">N/A</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-green-200">
                    <span className="text-xs font-semibold text-green-700">Class On Admission:</span>
                    <span className="text-xs text-green-900">
                      {student.class_on_admission ? 
                        `${student.class_on_admission.name} - ${student.class_on_admission.stream?.name || 'No Stream'}` : 
                        (student.classOnAdmission || 'N/A')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-green-200">
                    <span className="text-xs font-semibold text-green-700">Current Class:</span>
                    <span className="text-xs text-green-900">
                      {student.current_class ? 
                        `${student.current_class.name} - ${student.current_class.stream?.name || 'No Stream'}` : 
                        (student.currentClass || 'N/A')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-green-200">
                    <span className="text-xs font-semibold text-green-700">NEMIS Number:</span>
                    <span className="text-xs font-medium text-green-900 bg-green-50 px-2 py-0.5 rounded">{student.nemisNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-green-200">
                    <span className="text-xs font-semibold text-green-700">Assessment Number:</span>
                    <span className="text-xs font-medium text-green-900 bg-green-50 px-2 py-0.5 rounded">{student.assessmentNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-semibold text-green-700">Attendance:</span>
                    <span className="text-xs font-medium text-green-900 bg-green-50 px-2 py-0.5 rounded">95%</span>
                  </div>
                </div>
              </div>

              {/* Other Info Section */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-sm font-bold text-orange-900">Other Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center py-1 border-b border-orange-200">
                    <span className="text-xs font-semibold text-orange-700">Joined:</span>
                    <span className="text-xs font-medium text-orange-900 bg-orange-50 px-2 py-0.5 rounded">{student.dateOfAdmission || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-orange-200">
                    <span className="text-xs font-semibold text-orange-700">Source:</span>
                    <span className="text-xs text-orange-900">Direct</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-orange-200">
                    <span className="text-xs font-semibold text-orange-700">Email Verified:</span>
                    <span className="text-xs font-medium text-orange-900 bg-orange-50 px-2 py-0.5 rounded">Yes</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-semibold text-orange-700">Medical:</span>
                    <span className="text-xs text-orange-900">No issues</span>
                  </div>
                </div>
              </div>

              {/* Health and Special Needs Section */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-sm font-bold text-red-900">Health & Special Needs</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center py-1 border-b border-red-200">
                    <span className="text-xs font-semibold text-red-700">Special Need:</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${student.hasSpecialNeed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {student.hasSpecialNeed ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-semibold text-red-700">Preferred Hospital:</span>
                    <span className="text-xs text-red-900">{student.preferredHospital || 'N/A'}</span>
                  </div>
                </div>
                {student.healthInfo && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <div className="flex justify-between items-start py-1">
                      <span className="text-xs font-semibold text-red-700">Health Information:</span>
                      <span className="text-xs text-red-900 max-w-xs text-right">{student.healthInfo}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Parents Section */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {FaUserFriends({ className: "w-4 h-4 text-purple-700" })}
                    <h3 className="text-sm font-bold text-purple-900">Parents</h3>
                  </div>
                  <button
                    onClick={handleAddParent}
                    className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
                    title="Add Parent"
                  >
                    {FaPlus({ className: "w-3 h-3" })}
                  </button>
                </div>
                <div className="space-y-2">
                  {(() => { console.log('Rendering Parents card - studentParents:', studentParents, 'length:', studentParents.length); return null; })()}
                  {loadingParents ? (
                    <div className="text-center py-2">
                      <span className="text-xs text-purple-600">Loading parents...</span>
                    </div>
                  ) : studentParents.length > 0 ? (
                    studentParents.map((parentRel, index) => (
                      <div key={parentRel.id} className={`bg-white rounded-lg p-2 border border-purple-200 ${index > 0 ? 'mt-2' : ''}`}>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between items-center py-1 border-b border-purple-200">
                            <span className="text-xs font-semibold text-purple-700">Name:</span>
                            <span className="text-xs font-medium text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded">
                              {parentRel.parent_details.first_name} {parentRel.parent_details.last_name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-purple-200">
                            <span className="text-xs font-semibold text-purple-700">Relationship:</span>
                            <span className="text-xs text-purple-900">{parentRel.relationship_type}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-purple-200">
                            <span className="text-xs font-semibold text-purple-700">Email:</span>
                            <span className="text-xs text-purple-900">{parentRel.parent_details.email}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs font-semibold text-purple-700">Phone:</span>
                            <span className="text-xs text-purple-900">{parentRel.parent_details.phone}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex flex-wrap gap-1">
                            {parentRel.is_primary_contact && (
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Primary</span>
                            )}
                            {parentRel.is_emergency_contact && (
                              <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Emergency</span>
                            )}
                            {parentRel.can_pick_up && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Pick Up</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDisassociateParent(parentRel.id)}
                            className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded hover:bg-red-200 transition-colors duration-200 flex items-center gap-1"
                            title="Dis-associate parent"
                          >
                            {FaTrash({ className: "w-3 h-3" })}
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-xs text-purple-600">No parents associated</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="bg-white border-t border-gray-200 p-3">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-700 flex items-center space-x-2">
                <span className="font-semibold">Last updated:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  {FaEdit({ className: "w-3 h-3" })}
                  <span className="text-xs font-medium">Edit</span>
                </button>
                <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-md hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
                  {FaEye({ className: "w-3 h-3" })}
                  <span className="text-xs font-medium">View Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Parent Drawer */}
      {isAddParentDrawerOpen && (
        <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-[10000] ${
          isAddParentDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}>
          <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
            isAddParentDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-elegant">Add Parent</h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">
                  Associate parent with {student?.fullName || student?.pupil_name}
                </p>
              </div>
              <button
                onClick={closeAddParentDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* General Error Display */}
                {parentFormErrors.non_field_errors && parentFormErrors.non_field_errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-red-800">
                          {parentFormErrors.non_field_errors[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Parent Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                    Parent *
                  </label>
                  {loadingParentsList ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-xs text-gray-500">Loading parents...</span>
                    </div>
                  ) : (
                    <div className="relative parent-dropdown-container">
                      <div
                        className={`w-full px-3 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200 bg-gray-50 focus-within:bg-white text-xs cursor-pointer ${
                          getParentFieldError('parent_id') ? 'border-red-300 focus-within:ring-red-500' : 'border-gray-200'
                        }`}
                        onClick={() => setIsParentDropdownOpen(!isParentDropdownOpen)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={newParentRelationship.parent_id ? 'text-gray-900' : 'text-gray-500'}>
              {newParentRelationship.parent_id
                ? parents.find(p => p.id === newParentRelationship.parent_id)?.full_name + ' (' + parents.find(p => p.id === newParentRelationship.parent_id)?.relationship + ')'
                              : 'Select a parent'
                            }
                          </span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isParentDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {isParentDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-100">
                            <input
                              type="text"
                              placeholder="Search parents..."
                              value={parentSearchQuery}
                              onChange={(e) => setParentSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          
                          {/* Parent List */}
                          <div className="max-h-48 overflow-y-auto">
                            {parents
                              .filter(parent => 
                                parent.full_name.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
                                parent.relationship.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
                                parent.email.toLowerCase().includes(parentSearchQuery.toLowerCase())
                              )
                              .map((parent) => (
                                <div
                                  key={parent.id}
                                  className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => {
                                                    setNewParentRelationship(prev => ({
                  ...prev,
                  parent_id: parent.id
                }));
                                    setIsParentDropdownOpen(false);
                                    setParentSearchQuery('');
                                    // Clear error when user makes a selection
                                    if (parentFormErrors.parent_id) {
                                      setParentFormErrors((prev: Record<string, string[]>) => ({ ...prev, parent_id: [] }));
                                    }
                                  }}
                                >
                                  <div className="font-medium text-gray-900">{parent.full_name}</div>
                                  <div className="text-gray-500 text-xs">
                                    {parent.relationship} • {parent.email}
                                  </div>
                                </div>
                              ))}
                            
                            {parents.filter(parent => 
                              parent.full_name.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
                              parent.relationship.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
                              parent.email.toLowerCase().includes(parentSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                No parents found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {getParentFieldError('parent_id') && (
                    <p className="mt-1 text-xs text-red-600">{getParentFieldError('parent_id')}</p>
                  )}
                </div>

                {/* Relationship Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                    Relationship Type *
                  </label>
                  <select
                    value={newParentRelationship.relationship_type}
                    onChange={(e) => {
                      setNewParentRelationship(prev => ({
                        ...prev,
                        relationship_type: e.target.value
                      }));
                      // Clear error when user makes a selection
                      if (parentFormErrors.relationship_type) {
                        setParentFormErrors((prev: Record<string, string[]>) => ({ ...prev, relationship_type: [] }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                      getParentFieldError('relationship_type') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select relationship type</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                  {getParentFieldError('relationship_type') && (
                    <p className="mt-1 text-xs text-red-600">{getParentFieldError('relationship_type')}</p>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_primary_contact"
                        checked={newParentRelationship.is_primary_contact}
                        onChange={(e) => {
                          setNewParentRelationship(prev => ({
                            ...prev,
                            is_primary_contact: e.target.checked
                          }));
                          // Clear error when user changes the checkbox
                          if (parentFormErrors.is_primary_contact) {
                            setParentFormErrors((prev: Record<string, string[]>) => ({ ...prev, is_primary_contact: [] }));
                          }
                        }}
                        className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                          getParentFieldError('is_primary_contact') ? 'border-red-300' : ''
                        }`}
                      />
                      <label htmlFor="is_primary_contact" className="ml-2 text-xs text-gray-700">
                        Primary Contact
                      </label>
                    </div>
                    {getParentFieldError('is_primary_contact') && (
                      <p className="mt-1 ml-6 text-xs text-red-600">{getParentFieldError('is_primary_contact')}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_emergency_contact"
                        checked={newParentRelationship.is_emergency_contact}
                        onChange={(e) => {
                          setNewParentRelationship(prev => ({
                            ...prev,
                            is_emergency_contact: e.target.checked
                          }));
                          // Clear error when user changes the checkbox
                          if (parentFormErrors.is_emergency_contact) {
                            setParentFormErrors((prev: Record<string, string[]>) => ({ ...prev, is_emergency_contact: [] }));
                          }
                        }}
                        className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                          getParentFieldError('is_emergency_contact') ? 'border-red-300' : ''
                        }`}
                      />
                      <label htmlFor="is_emergency_contact" className="ml-2 text-xs text-gray-700">
                        Emergency Contact
                      </label>
                    </div>
                    {getParentFieldError('is_emergency_contact') && (
                      <p className="mt-1 ml-6 text-xs text-red-600">{getParentFieldError('is_emergency_contact')}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="can_pick_up"
                        checked={newParentRelationship.can_pick_up}
                        onChange={(e) => {
                          setNewParentRelationship(prev => ({
                            ...prev,
                            can_pick_up: e.target.checked
                          }));
                          // Clear error when user changes the checkbox
                          if (parentFormErrors.can_pick_up) {
                            setParentFormErrors((prev: Record<string, string[]>) => ({ ...prev, can_pick_up: [] }));
                          }
                        }}
                        className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                          getParentFieldError('can_pick_up') ? 'border-red-300' : ''
                        }`}
                      />
                      <label htmlFor="can_pick_up" className="ml-2 text-xs text-gray-700">
                        Can Pick Up
                      </label>
                    </div>
                    {getParentFieldError('can_pick_up') && (
                      <p className="mt-1 ml-6 text-xs text-red-600">{getParentFieldError('can_pick_up')}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                    Notes
                  </label>
                  <textarea
                    value={newParentRelationship.notes}
                    onChange={(e) => {
                      setNewParentRelationship(prev => ({
                        ...prev,
                        notes: e.target.value
                      }));
                      // Clear error when user types
                      if (parentFormErrors.notes) {
                        setParentFormErrors((prev: Record<string, string[]>) => ({ ...prev, notes: [] }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                      getParentFieldError('notes') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Additional notes about this parent relationship"
                    rows={3}
                  />
                  {getParentFieldError('notes') && (
                    <p className="mt-1 text-xs text-red-600">{getParentFieldError('notes')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={closeAddParentDrawer}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParentSubmit}
                disabled={!newParentRelationship.parent_id || !newParentRelationship.relationship_type}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
              >
                Add Parent
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentModal; 

