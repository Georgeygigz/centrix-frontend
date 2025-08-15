import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { Student } from '../../types/dashboard';
import StudentModal from './StudentModal';
import { apiService, convertStudentToCreateRequest } from '../../services/api';

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isActive?: boolean;
  onSectionClick?: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children, 
  defaultExpanded = true,
  isActive = false,
  onSectionClick
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    if (onSectionClick) {
      onSectionClick();
    }
  };

  return (
    <div className={`border rounded-lg transition-all duration-200 ${
      isActive 
        ? 'border-blue-300 bg-blue-50/30' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <button
        onClick={handleClick}
        className={`w-full px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all duration-200 rounded-t-lg ${
          isActive
            ? 'text-blue-900 bg-blue-100/50 hover:bg-blue-100'
            : 'text-gray-900 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <span>{title}</span>
        {isExpanded ? 
          FaChevronUp({ className: `w-4 h-4 transition-colors duration-200 ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }` }) : 
          FaChevronDown({ className: `w-4 h-4 transition-colors duration-200 ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }` })
        }
      </button>
      {isExpanded && (
        <div className={`p-4 space-y-4 transition-all duration-200 ${
          isActive ? 'bg-blue-50/20' : ''
        }`}>
          {children}
        </div>
      )}
    </div>
  );
};

const Students: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('admission');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  const [editActiveSection, setEditActiveSection] = useState<string>('basic-info');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    // Basic Info (Required)
    admissionNumber: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    dateOfAdmission: '',
    
    // Academic Info (Required)
    classOnAdmission: '',
    
    // Parent Info (Partial optional)
    guardianName: '',
    guardianContact: '',
    alternativeContact: '',
    
    // Others (Optional)
    address: '',
    lastSchoolAttended: '',
    boardingStatus: '',
    exemptedFromReligiousInstruction: false,
    dateOfLeaving: ''
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Transform API response to component format
  const transformStudentData = (apiStudent: any): Student => {
    return {
      id: apiStudent.id,
      // Map snake_case to camelCase
      admissionNumber: apiStudent.admission_number || apiStudent.admissionNumber,
      fullName: apiStudent.full_name || apiStudent.pupil_name || apiStudent.fullName,
      dateOfBirth: apiStudent.date_of_birth || apiStudent.dateOfBirth,
      gender: apiStudent.gender,
      dateOfAdmission: apiStudent.date_of_admission || apiStudent.dateOfAdmission,
      classOnAdmission: apiStudent.class_on_admission || apiStudent.classOnAdmission,
      guardianName: apiStudent.guardian_name || apiStudent.guardianName,
      guardianContact: apiStudent.guardian_contact || apiStudent.guardianContact,
      alternativeContact: apiStudent.alternative_contact || apiStudent.alternativeContact,
      address: apiStudent.address,
      lastSchoolAttended: apiStudent.last_school_attended || apiStudent.lastSchoolAttended,
      boardingStatus: apiStudent.boarding_status || apiStudent.boardingStatus,
      exemptedFromReligiousInstruction: apiStudent.exempted_from_religious_instruction || apiStudent.exemptedFromReligiousInstruction,
      dateOfLeaving: apiStudent.date_of_leaving || apiStudent.dateOfLeaving,
      // Legacy fields
      class: apiStudent.class_on_admission || apiStudent.class,
      parentName: apiStudent.guardian_name || apiStudent.parentName,
      contactInfo: apiStudent.guardian_contact || apiStudent.contactInfo,
      // Keep original API fields for backward compatibility
      admission_number: apiStudent.admission_number,
      pupil_name: apiStudent.pupil_name,
      date_of_birth: apiStudent.date_of_birth,
      date_of_admission: apiStudent.date_of_admission,
      class_on_admission: apiStudent.class_on_admission,
      guardian_name: apiStudent.guardian_name,
      guardian_contact: apiStudent.guardian_contact,
      alternative_contact: apiStudent.alternative_contact,
      last_school_attended: apiStudent.last_school_attended,
      boarding_status: apiStudent.boarding_status,
      exempted_from_religious_instruction: apiStudent.exempted_from_religious_instruction,
      date_of_leaving: apiStudent.date_of_leaving,
      is_current_student: apiStudent.is_current_student,
      created_at: apiStudent.created_at,
    };
  };

  // Load students data from API with tenant support
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching students from API...');
        const data = await apiService.students.getAll();
        console.log('Students API response:', data);
        
        // Transform the API response data
        const rawStudents = data.results || data || [];
        const transformedStudents = rawStudents.map(transformStudentData);
        console.log('Transformed students:', transformedStudents);
        
        setStudents(transformedStudents);
      } catch (error) {
        console.error('Error loading students:', error);
        // Fallback to empty array if loading fails
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, []); // Remove currentSchool dependency since API handles school context via auth token

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student =>
      (student.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.admissionNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.classOnAdmission || student.class || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof Student];
        const bValue = b[sortBy as keyof Student];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [students, searchQuery, sortBy, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  // Debug pagination
  console.log('Pagination Debug:', {
    totalStudents: students.length,
    filteredStudents: filteredAndSortedStudents.length,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedStudentsCount: paginatedStudents.length
  });

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Debug form errors
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      console.log('Form errors updated:', formErrors);
    }
  }, [formErrors]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const openAddDrawer = () => {
    setIsAddDrawerOpen(true);
    setActiveSection('basic-info'); // Reset to first section when opening
    setFormErrors({}); // Clear any previous errors
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    setNewStudent({
      admissionNumber: '',
      fullName: '',
      class: '',
      gender: 'Male',
      dateOfBirth: '',
      parentName: '',
      contactInfo: '',
      address: '',
      dateOfAdmission: ''
    });
  };

  const handleAddStudent = async () => {
    try {
        const studentData = convertStudentToCreateRequest(newStudent);

        const response = await apiService.students.create(studentData);
        
        // Transform the API response to match the component's expected format
        const transformedStudent = transformStudentData(response);
        
        // Add the new student to the list
        setStudents(prev => [...prev, transformedStudent]);
        
        // Show success toast
        setToast({
          message: 'Student added successfully!',
          type: 'success'
        });
        
        // Clear form errors
        setFormErrors({});
        
        // Clear the form
        setNewStudent({
          admissionNumber: '',
          fullName: '',
          dateOfBirth: '',
          gender: 'Male',
          dateOfAdmission: '',
          classOnAdmission: '',
          guardianName: '',
          guardianContact: '',
          alternativeContact: '',
          address: '',
          lastSchoolAttended: '',
          boardingStatus: '',
          exemptedFromReligiousInstruction: false,
          dateOfLeaving: ''
        });
        
        // Close drawer after a short delay to ensure form is cleared
        setTimeout(() => {
          closeAddDrawer();
        }, 100);
        
        // Auto-hide toast after 3 seconds
        setTimeout(() => {
          setToast(null);
        }, 3000);
        
      } catch (error: any) {
        console.error('Error adding student:', error);
        console.log('Full error object:', error);
        console.log('Error response:', error.response);
        console.log('Error response data:', error.response?.data);
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          console.log('Setting form errors:', error.response.data.errors);
          setFormErrors(error.response.data.errors);
          setToast({
            message: 'Please fix the validation errors below.',
            type: 'error'
          });
        } else if (error.response?.data) {
          // Try different error structures
          console.log('Trying alternative error structure:', error.response.data);
          if (typeof error.response.data === 'object') {
            setFormErrors(error.response.data);
            setToast({
              message: 'Please fix the validation errors below.',
              type: 'error'
            });
          } else {
            setFormErrors({});
            setToast({
              message: 'Failed to add student. Please try again.',
              type: 'error'
            });
          }
        } else {
          setFormErrors({});
          setToast({
            message: 'Failed to add student. Please try again.',
            type: 'error'
          });
        }
        
        // Auto-hide error toast after 5 seconds
        setTimeout(() => {
          setToast(null);
        }, 5000);
      }
  };

  const getFieldError = (fieldName: string): string | null => {
    return formErrors[fieldName]?.[0] || null;
  };

  const handleNewStudentInputChange = (field: keyof Student, value: string | boolean) => {
    setNewStudent(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    // Map frontend field names to API field names for error clearing
    const fieldMapping: { [key: string]: string } = {
      'admissionNumber': 'admission_number',
      'fullName': 'pupil_name',
      'classOnAdmission': 'class_on_admission',
      'guardianName': 'guardian_name',
      'guardianContact': 'contact_1',
      'boardingStatus': 'boarding_status'
    };
    
    const apiFieldName = fieldMapping[field] || field;
    if (formErrors[apiFieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[apiFieldName];
        return newErrors;
      });
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

  const openStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeStudentModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Close dropdown if clicking outside both the dropdown container and portal dropdown
      if (!target.closest('[data-dropdown-container]') && !target.closest('[data-portal-dropdown]')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (studentId: string, event: React.MouseEvent) => {
    if (openDropdownId === studentId) {
      setOpenDropdownId(null);
    } else {
      // Calculate dropdown position
      const button = event.currentTarget as HTMLElement;
      const buttonRect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 80;
      const dropdownWidth = 128;
      
      // Calculate position
      let x = buttonRect.right - dropdownWidth;
      let y = buttonRect.bottom + 4;
      
      // If there's not enough space below, position above
      if (buttonRect.bottom + dropdownHeight > viewportHeight) {
        y = buttonRect.top - dropdownHeight - 4;
      }
      
      // Ensure dropdown doesn't go off-screen horizontally
      if (x < 0) x = 0;
      if (x + dropdownWidth > viewportWidth) x = viewportWidth - dropdownWidth;
      
      setDropdownCoords({ x, y });
      setOpenDropdownId(studentId);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
    setEditActiveSection('basic-info'); // Reset to first section when opening
  };

  const handleDeleteStudent = async (student: Student) => {
    try {
      if (student.id) {
        await apiService.students.delete(student.id);
      }
      
      // Remove the student from the list
      setStudents(prev => prev.filter(s => s.id !== student.id));
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      // You might want to show an error message to the user here
    }
  };

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingStudent(null);
  };

  const handleSaveStudent = async () => {
    if (editingStudent) {
      try {
        const studentData = {
          admission_number: editingStudent.admissionNumber,
          full_name: editingStudent.fullName,
          date_of_birth: editingStudent.dateOfBirth || '',
          gender: editingStudent.gender || 'Male',
          date_of_admission: editingStudent.dateOfAdmission || '',
          class_on_admission: editingStudent.classOnAdmission || '',
          guardian_name: editingStudent.guardianName || '',
          guardian_contact: editingStudent.guardianContact || '',
          alternative_contact: editingStudent.alternativeContact || '',
          address: editingStudent.address || '',
          last_school_attended: editingStudent.lastSchoolAttended || '',
          boarding_status: editingStudent.boardingStatus || '',
          exempted_from_religious_instruction: editingStudent.exemptedFromReligiousInstruction || false,
          date_of_leaving: editingStudent.dateOfLeaving || '',
        };

        if (editingStudent.id) {
          const response = await apiService.students.update(editingStudent.id, studentData);
          
          // Update the student in the list
          setStudents(prev => prev.map(student => 
            student.id === editingStudent.id ? response : student
          ));
        }
        closeEditDrawer();
      } catch (error) {
        console.error('Error updating student:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleInputChange = (field: keyof Student, value: string | boolean) => {
    if (editingStudent) {
      setEditingStudent({
        ...editingStudent,
        [field]: value
      });
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4">
        {/* Header with tabs, search and filters */}
        <div className="bg-white rounded-md shadow-sm p-4 mb-4">
          {/* Tabs and Controls Row */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <nav className="flex space-x-6">
                <button 
                  onClick={() => setActiveTab('admission')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'admission' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Admission
                </button>
                <button 
                  onClick={() => setActiveTab('academic')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'academic' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Academic
                </button>
                <button 
                  onClick={() => setActiveTab('financial')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'financial' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Financial
                </button>
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'attendance' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Attendance
                </button>
              </nav>

              {/* Search, Filter, and Sort Controls */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {FaSearch({ className: "h-3 w-3 text-gray-400" })}
                  </div>
                </div>

                {/* Filter */}
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200">
                  Filter
                </button>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">Sort by</option>
                  <option value="admissionNumber">Admission Number</option>
                  <option value="fullName">Full Name</option>
                  <option value="class">Class</option>
                  <option value="gender">Gender</option>
                  <option value="dateOfAdmission">Date of Admission</option>
                </select>

                {/* Add New Student Button */}
                <button
                  onClick={openAddDrawer}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  + Add Student
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'admission' && (
          <div className="bg-white rounded-md shadow-sm">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading students...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('admissionNumber')}>
                        <div className="flex items-center space-x-1">
                          <span>Admn number</span>
                          {getSortIcon('admissionNumber')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fullName')}>
                        <div className="flex items-center space-x-1">
                          <span>Full name</span>
                          {getSortIcon('fullName')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class')}>
                        <div className="flex items-center space-x-1">
                          <span>Class</span>
                          {getSortIcon('class')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('gender')}>
                        <div className="flex items-center space-x-1">
                          <span>Gender</span>
                          {getSortIcon('gender')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dateOfAdmission')}>
                        <div className="flex items-center space-x-1">
                          <span>Date of admission</span>
                          {getSortIcon('dateOfAdmission')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {student.admissionNumber}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.classOnAdmission || student.class || ''}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.gender}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.dateOfAdmission}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 relative">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openStudentModal(student)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                              title="View Details"
                            >
                              {FaEye({ className: "w-3 h-3" })}
                            </button>
                            
                            {/* Dropdown Menu */}
                            <div className="relative" data-dropdown-container>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const studentId = student.id || student.admissionNumber || `student-${Math.random()}`;
                                  toggleDropdown(studentId, e);
                                }}
                                className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
                                  openDropdownId === (student.id || student.admissionNumber) 
                                    ? 'text-blue-600 bg-blue-50' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                                title="More Options"
                              >
                                {FaEllipsisV({ className: "w-3 h-3" })}
                              </button>
                              
                              {/* Dropdown button only - dropdown rendered via portal */}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Academic Tab */}
        {activeTab === 'academic' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Academic Information</h3>
              <p className="text-xs text-gray-500">Academic data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Financial Information</h3>
              <p className="text-xs text-gray-500">Financial data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Attendance Information</h3>
              <p className="text-xs text-gray-500">Attendance data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredAndSortedStudents.length)}</span> of <span className="font-medium">{filteredAndSortedStudents.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
              Page {currentPage} of {totalPages} ({totalPages > 1 ? `${totalPages} pages` : '1 page'})
            </span>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Student Modal */}
      {isModalOpen && selectedStudent && (
        <StudentModal student={selectedStudent} isOpen={isModalOpen} onClose={closeStudentModal} />
      )}

            {/* Edit Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isEditDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isEditDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {editingStudent && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                              <div>
                <h2 className="text-xl font-bold text-gray-900 font-elegant">Edit Student</h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">Update student information</p>
              </div>
                <button
                  onClick={closeEditDrawer}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-4 h-4" })}
                </button>
              </div>

                          {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Basic Info Section */}
                <CollapsibleSection 
                  title="Basic Information *" 
                  defaultExpanded={true}
                  isActive={editActiveSection === 'basic-info'}
                  onSectionClick={() => setEditActiveSection('basic-info')}
                >
                  {/* Admission Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Admission Number *
                    </label>
                    <input
                      type="text"
                      value={editingStudent.admissionNumber}
                      onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter admission number"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Full Names *
                    </label>
                    <input
                      type="text"
                      value={editingStudent.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter full names"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Date Of Birth *
                    </label>
                    <input
                      type="date"
                      value={editingStudent.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Gender *
                    </label>
                    <select
                      value={editingStudent.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date of Admission */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Date Of Admission *
                    </label>
                    <input
                      type="date"
                      value={editingStudent.dateOfAdmission}
                      onChange={(e) => handleInputChange('dateOfAdmission', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    />
                  </div>
                </CollapsibleSection>

                {/* Academic Info Section */}
                <CollapsibleSection 
                  title="Academic Information *" 
                  defaultExpanded={true}
                  isActive={editActiveSection === 'academic-info'}
                  onSectionClick={() => setEditActiveSection('academic-info')}
                >
                  {/* Class On Admission */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Class On Admission *
                    </label>
                    <input
                      type="text"
                      value={editingStudent.classOnAdmission}
                      onChange={(e) => handleInputChange('classOnAdmission', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter class on admission"
                    />
                  </div>
                </CollapsibleSection>

                {/* Parent Info Section */}
                <CollapsibleSection 
                  title="Parent Information" 
                  defaultExpanded={false}
                  isActive={editActiveSection === 'parent-info'}
                  onSectionClick={() => setEditActiveSection('parent-info')}
                >
                  {/* Guardian Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Guardian Name *
                    </label>
                    <input
                      type="text"
                      value={editingStudent.guardianName}
                      onChange={(e) => handleInputChange('guardianName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter guardian name"
                    />
                  </div>

                  {/* Guardian Contact */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Guardian Contact *
                    </label>
                    <input
                      type="tel"
                      value={editingStudent.guardianContact}
                      onChange={(e) => handleInputChange('guardianContact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter guardian contact"
                    />
                  </div>

                  {/* Alternative Contact */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Alternative Contact
                    </label>
                    <input
                      type="tel"
                      value={editingStudent.alternativeContact}
                      onChange={(e) => handleInputChange('alternativeContact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter alternative contact"
                    />
                  </div>
                </CollapsibleSection>

                {/* Others Section */}
                <CollapsibleSection 
                  title="Other Information" 
                  defaultExpanded={false}
                  isActive={editActiveSection === 'other-info'}
                  onSectionClick={() => setEditActiveSection('other-info')}
                >
                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Address
                    </label>
                    <textarea
                      value={editingStudent.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs"
                      placeholder="Enter address"
                    />
                  </div>

                  {/* Last School Attended */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Last School Attended
                    </label>
                    <input
                      type="text"
                      value={editingStudent.lastSchoolAttended}
                      onChange={(e) => handleInputChange('lastSchoolAttended', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter last school attended"
                    />
                  </div>

                  {/* Boarding Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Boarding Status
                    </label>
                    <select
                      value={editingStudent.boardingStatus}
                      onChange={(e) => handleInputChange('boardingStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="">Select boarding status</option>
                      <option value="Day">Day</option>
                      <option value="Boarding">Boarding</option>
                    </select>
                  </div>

                  {/* Exempted From Religious Instruction */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Exempted From Religious Instruction
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingStudent.exemptedFromReligiousInstruction}
                        onChange={(e) => handleInputChange('exemptedFromReligiousInstruction', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">Yes, exempted from religious instruction</span>
                    </div>
                  </div>

                  {/* Date of Leaving */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Date of Leaving
                    </label>
                    <input
                      type="date"
                      value={editingStudent.dateOfLeaving}
                      onChange={(e) => handleInputChange('dateOfLeaving', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    />
                  </div>
                </CollapsibleSection>
              </div>
            </div>

              {/* Drawer Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={closeEditDrawer}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStudent}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Student Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isAddDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isAddDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <>
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-elegant">Add New Student</h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">Enter student information</p>
              </div>
              <button
                onClick={closeAddDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Error Summary */}
              {Object.keys(formErrors).length > 0 && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <h3 className="text-sm font-semibold text-red-800">Please fix the following errors:</h3>
                  </div>
                  <ul className="text-xs text-red-700 space-y-1">
                    {Object.entries(formErrors).map(([field, errors]) => (
                      <li key={field} className="flex items-start space-x-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>
                          <span className="font-medium">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {errors[0]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="p-6 space-y-4">
                {/* Basic Info Section */}
                <CollapsibleSection 
                  title="Basic Information *" 
                  defaultExpanded={true}
                  isActive={activeSection === 'basic-info'}
                  onSectionClick={() => setActiveSection('basic-info')}
                >
                  {/* Admission Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Admission Number *
                    </label>
                    <input
                      type="text"
                      value={newStudent.admissionNumber}
                      onChange={(e) => handleNewStudentInputChange('admissionNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                        getFieldError('admission_number') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter admission number"
                    />
                    {getFieldError('admission_number') && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError('admission_number')}</p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Full Names *
                    </label>
                    <input
                      type="text"
                      value={newStudent.fullName}
                      onChange={(e) => handleNewStudentInputChange('fullName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                        getFieldError('pupil_name') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter full names"
                    />
                    {getFieldError('pupil_name') && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError('pupil_name')}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Date Of Birth *
                    </label>
                    <input
                      type="date"
                      value={newStudent.dateOfBirth}
                      onChange={(e) => handleNewStudentInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Gender *
                    </label>
                    <select
                      value={newStudent.gender}
                      onChange={(e) => handleNewStudentInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date of Admission */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Date Of Admission *
                    </label>
                    <input
                      type="date"
                      value={newStudent.dateOfAdmission}
                      onChange={(e) => handleNewStudentInputChange('dateOfAdmission', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    />
                  </div>
                </CollapsibleSection>

                {/* Academic Info Section */}
                <CollapsibleSection 
                  title="Academic Information *" 
                  defaultExpanded={true}
                  isActive={activeSection === 'academic-info'}
                  onSectionClick={() => setActiveSection('academic-info')}
                >
                  {/* Class On Admission */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Class On Admission *
                    </label>
                    <input
                      type="text"
                      value={newStudent.classOnAdmission}
                      onChange={(e) => handleNewStudentInputChange('classOnAdmission', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                        getFieldError('class_on_admission') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter class on admission"
                    />
                    {getFieldError('class_on_admission') && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError('class_on_admission')}</p>
                    )}
                  </div>
                </CollapsibleSection>

                {/* Parent Info Section */}
                <CollapsibleSection 
                  title="Parent Information" 
                  defaultExpanded={false}
                  isActive={activeSection === 'parent-info'}
                  onSectionClick={() => setActiveSection('parent-info')}
                >
                  {/* Guardian Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Guardian Name *
                    </label>
                    <input
                      type="text"
                      value={newStudent.guardianName}
                      onChange={(e) => handleNewStudentInputChange('guardianName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                        getFieldError('guardian_name') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter guardian name"
                    />
                    {getFieldError('guardian_name') && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError('guardian_name')}</p>
                    )}
                  </div>

                  {/* Guardian Contact */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Guardian Contact *
                    </label>
                    <input
                      type="tel"
                      value={newStudent.guardianContact}
                      onChange={(e) => handleNewStudentInputChange('guardianContact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter guardian contact"
                    />
                  </div>

                  {/* Alternative Contact */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Alternative Contact
                    </label>
                    <input
                      type="tel"
                      value={newStudent.alternativeContact}
                      onChange={(e) => handleNewStudentInputChange('alternativeContact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter alternative contact"
                    />
                  </div>
                </CollapsibleSection>

                {/* Others Section */}
                <CollapsibleSection 
                  title="Other Information" 
                  defaultExpanded={false}
                  isActive={activeSection === 'other-info'}
                  onSectionClick={() => setActiveSection('other-info')}
                >
                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Address
                    </label>
                    <textarea
                      value={newStudent.address}
                      onChange={(e) => handleNewStudentInputChange('address', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs ${
                        getFieldError('address') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter address"
                    />
                    {getFieldError('address') && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError('address')}</p>
                    )}
                  </div>

                  {/* Last School Attended */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Last School Attended
                    </label>
                    <input
                      type="text"
                      value={newStudent.lastSchoolAttended}
                      onChange={(e) => handleNewStudentInputChange('lastSchoolAttended', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter last school attended"
                    />
                  </div>

                  {/* Boarding Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Boarding Status
                    </label>
                    <select
                      value={newStudent.boardingStatus}
                      onChange={(e) => handleNewStudentInputChange('boardingStatus', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                        getFieldError('boarding_status') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select boarding status</option>
                      <option value="Day">Day</option>
                      <option value="Boarding">Boarding</option>
                    </select>
                    {getFieldError('boarding_status') && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError('boarding_status')}</p>
                    )}
                  </div>

                  {/* Exempted From Religious Instruction */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Exempted From Religious Instruction
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newStudent.exemptedFromReligiousInstruction}
                        onChange={(e) => handleNewStudentInputChange('exemptedFromReligiousInstruction', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">Yes, exempted from religious instruction</span>
                    </div>
                  </div>

                  {/* Date of Leaving */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Date of Leaving
                    </label>
                    <input
                      type="date"
                      value={newStudent.dateOfLeaving}
                      onChange={(e) => handleNewStudentInputChange('dateOfLeaving', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    />
                  </div>
                </CollapsibleSection>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={closeAddDrawer}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={!newStudent.fullName || !newStudent.admissionNumber}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Add Student
              </button>
            </div>
          </>
        </div>
      </div>
      
      {/* Portal-based Dropdown */}
      {openDropdownId && createPortal(
        <div 
          className="fixed w-32 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
          data-portal-dropdown
          style={{
            left: `${dropdownCoords.x}px`,
            top: `${dropdownCoords.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const student = students.find(s => (s.id || s.admissionNumber) === openDropdownId);
                if (student) {
                  handleEditStudent(student);
                }
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
            >
              {FaEdit({ className: "w-3 h-3 mr-2" })}
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const student = students.find(s => (s.id || s.admissionNumber) === openDropdownId);
                if (student) {
                  handleDeleteStudent(student);
                }
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              {FaTrash({ className: "w-3 h-3 mr-2" })}
              Delete
            </button>
          </div>
        </div>,
        document.body
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
    </div>
  );
};

export default Students; 