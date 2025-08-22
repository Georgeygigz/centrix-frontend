import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaUserFriends } from 'react-icons/fa';
import { Student, Stream, Class } from '../../types/dashboard';
import { Parent } from '../../types/parents';
import StudentModal from './StudentModal';
import { apiService, convertStudentToCreateRequest, getChangedFields } from '../../services/api';
import { PermissionGate } from '../RBAC';
import { useFeatureSwitch } from '../../hooks/useFeatureSwitch';
import DisabledButtonWithTooltip from './DisabledButtonWithTooltip';
import { useAuth } from '../../context/AuthContext';

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
  // Auth context
  const { user } = useAuth();
  
  // Feature switch hook
  const {
    isStudentAdmissionBlocked,
    blockMessage,
    isLoading: featureSwitchLoading,
    error: featureSwitchError,
    refreshStatus: refreshFeatureStatus
  } = useFeatureSwitch();

  const isRootUser = user?.role === 'root';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('admission');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [originalStudent, setOriginalStudent] = useState<Student | null>(null);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [originalStream, setOriginalStream] = useState<Stream | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [originalClass, setOriginalClass] = useState<Class | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Add Parent state
  const [isAddParentDrawerOpen, setIsAddParentDrawerOpen] = useState(false);
  const [selectedStudentForParent, setSelectedStudentForParent] = useState<Student | null>(null);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [newParentRelationship, setNewParentRelationship] = useState({
    parent: '',
    relationship_type: '',
    is_primary_contact: false,
    is_emergency_contact: false,
    can_pick_up: false,
    notes: ''
  });
  const [parentFormErrors, setParentFormErrors] = useState<{ [key: string]: string[] }>({});
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);

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
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  const [editActiveSection, setEditActiveSection] = useState<string>('basic-info');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string[] }>({});
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    // Basic Info (Required)
    admissionNumber: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'M',
    dateOfAdmission: '',
    
    // Academic Info
    classOnAdmission: '',
    currentClass: '',
    lastSchoolAttended: '',
    
    // Parent/Guardian Info
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: '',
    
    // Others
    address: '',
    boardingStatus: 'Day',
    exemptedFromReligiousInstruction: false,
    birthCertificateNo: '',
    image: '',
    dateOfLeaving: '',
    schoolLeavingCertificateNumber: '',
    remarks: ''
  });

  const [newStream, setNewStream] = useState<Partial<Stream>>({
    name: '',
    code: '',
    description: ''
  });

  const [newClass, setNewClass] = useState<Partial<Class> & { streamId?: string }>({
    name: '',
    code: '',
    streamId: '',
    level: 0,
    capacity: 0
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const itemsPerPage = 20;

  // Transform API response to component format
  const transformStudentData = (apiStudent: any): Student => {
    return {
      id: apiStudent.id,
      // Map snake_case to camelCase
      admissionNumber: apiStudent.admission_number || apiStudent.admissionNumber,
      fullName: apiStudent.pupil_name || apiStudent.fullName,
      dateOfBirth: apiStudent.date_of_birth || apiStudent.dateOfBirth,
      gender: apiStudent.gender,
      dateOfAdmission: apiStudent.date_of_admission || apiStudent.dateOfAdmission,
      classOnAdmission: apiStudent.class_on_admission?.id || apiStudent.class_on_admission_id || apiStudent.classOnAdmission,
      currentClass: apiStudent.current_class?.id || apiStudent.current_class_id || apiStudent.currentClass,
      // Store full class objects for display
      class_on_admission: apiStudent.class_on_admission,
      current_class: apiStudent.current_class,
      lastSchoolAttended: apiStudent.last_school_attended || apiStudent.lastSchoolAttended,
      guardianName: apiStudent.guardian_name || apiStudent.guardianName,
      guardianPhone: apiStudent.guardian_phone || apiStudent.guardianPhone,
      guardianRelationship: apiStudent.guardian_relationship || apiStudent.guardianRelationship,
      address: apiStudent.address,
      boardingStatus: apiStudent.boarding_status || apiStudent.boardingStatus,
      exemptedFromReligiousInstruction: apiStudent.exempted_from_religious_instruction || apiStudent.exemptedFromReligiousInstruction,
      birthCertificateNo: apiStudent.birth_certificate_no || apiStudent.birthCertificateNo,
      image: apiStudent.image,
      dateOfLeaving: apiStudent.date_of_leaving || apiStudent.dateOfLeaving,
      schoolLeavingCertificateNumber: apiStudent.school_leaving_certificate_number || apiStudent.schoolLeavingCertificateNumber,
      remarks: apiStudent.remarks,
      // Legacy fields
      class: apiStudent.class_on_admission || apiStudent.class,
      parentName: apiStudent.guardian_name || apiStudent.parentName,
      contactInfo: apiStudent.guardian_phone || apiStudent.contactInfo,
      // Keep original API fields for backward compatibility
      admission_number: apiStudent.admission_number,
      pupil_name: apiStudent.pupil_name,
      date_of_birth: apiStudent.date_of_birth,
      date_of_admission: apiStudent.date_of_admission,
      class_on_admission_id: apiStudent.class_on_admission?.id || apiStudent.class_on_admission_id,
      current_class_id: apiStudent.current_class?.id || apiStudent.current_class_id,
      last_school_attended: apiStudent.last_school_attended,
      guardian_name: apiStudent.guardian_name,
      guardian_phone: apiStudent.guardian_phone,
      guardian_relationship: apiStudent.guardian_relationship,
      boarding_status: apiStudent.boarding_status,
      exempted_from_religious_instruction: apiStudent.exempted_from_religious_instruction,
      birth_certificate_no: apiStudent.birth_certificate_no,
      date_of_leaving: apiStudent.date_of_leaving,
      school_leaving_certificate_number: apiStudent.school_leaving_certificate_number,
      is_current_student: apiStudent.is_current_student,
      created_at: apiStudent.created_at,
      updated_at: apiStudent.updated_at,
      deleted: apiStudent.deleted,
      contact_1: apiStudent.contact_1,
      contact_2: apiStudent.contact_2,
    };
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      // Always update debounced search - gray overlay will handle visual state
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load students data from API with tenant support
  const loadStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.students.getAll({
        page: currentPage,
        page_size: itemsPerPage,
        search: debouncedSearchQuery || undefined,
        ordering: sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined
      });
      
      // Transform the API response data
      const rawStudents = data.results || data || [];
      const transformedStudents = rawStudents.map(transformStudentData);
      
      setStudents(transformedStudents);
      
      // Set pagination metadata
      setTotalCount(data.count || 0);
      setHasNextPage(!!data.next);
      setHasPreviousPage(!!data.previous);
    } catch (error) {
      console.error('Error loading students:', error);
      // Fallback to empty array if loading fails
      setStudents([]);
      setTotalCount(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchQuery, sortBy, sortDirection]);

  useEffect(() => {
    // Always load students data - gray overlay will handle blocked state visually
    loadStudents();
  }, [currentPage, debouncedSearchQuery, activeTab, sortBy, sortDirection, loadStudents]); // Reload when page, debounced search query, tab, or sorting changes

  // Load streams data from API
  useEffect(() => {
    const loadStreams = async () => {
      try {
        setIsLoadingStreams(true);
        const response = await apiService.students.getStreams();
        // The authenticatedRequest method already extracts responseData.data
        setStreams(response || []);
      } catch (error) {
        console.error('Error loading streams:', error);
        setStreams([]);
      } finally {
        setIsLoadingStreams(false);
      }
    };

    loadStreams();
  }, []); // Load once when component mounts

  // Load classes data from API
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setIsLoadingClasses(true);
        const response = await apiService.students.getClasses();
        // The authenticatedRequest method already extracts responseData.data

        setClasses(response || []);
      } catch (error) {
        console.error('Error loading classes:', error);
        setClasses([]);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    loadClasses();
  }, []); // Load once when component mounts

  // Pagination logic - now using server-side pagination and sorting
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);
  const paginatedStudents = students; // Server returns the correct page with sorting applied



  // Reset to first page when debounced search query changes
  useEffect(() => {
    // Always reset page when search changes - pagination will work with gray overlay
    setCurrentPage(1);
  }, [debouncedSearchQuery]);



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
    setNewStream({
      name: '',
      code: '',
      description: ''
    });
    setNewClass({
      name: '',
      code: '',
      streamId: '',
      level: 0,
      capacity: 0
    });
  };

  const handleAddStudent = async () => {
    try {
      if (activeTab === 'admission') {
        const studentData = convertStudentToCreateRequest(newStudent);
        await apiService.students.create(studentData);
        
        // Re-fetch the students list to get the complete data with full class objects
        await loadStudents();
        
        setToast({
          message: 'Student added successfully!',
          type: 'success'
        });
      } else if (activeTab === 'streams') {
        // TODO: Add stream creation API call
        console.log('Adding stream:', newStream);
        setToast({
          message: 'Stream added successfully!',
          type: 'success'
        });
      } else if (activeTab === 'classes') {
        // TODO: Add class creation API call
        console.log('Adding class:', newClass);
        setToast({
          message: 'Class added successfully!',
          type: 'success'
        });
      }
      
      // Clear form errors
      setFormErrors({});
      
             // Clear the form
       setNewStudent({
         admissionNumber: '',
         fullName: '',
         dateOfBirth: '',
         gender: 'M',
         dateOfAdmission: '',
         classOnAdmission: '',
         currentClass: '',
         lastSchoolAttended: '',
         guardianName: '',
         guardianPhone: '',
         guardianRelationship: '',
         address: '',
         boardingStatus: 'Day',
         exemptedFromReligiousInstruction: false,
         birthCertificateNo: '',
         image: '',
         dateOfLeaving: '',
         schoolLeavingCertificateNumber: '',
         remarks: ''
       });
      
      setNewStream({
        name: '',
        code: '',
        description: ''
      });
      
      setNewClass({
        name: '',
        code: '',
        streamId: '',
        level: 0,
        capacity: 0
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
      console.error('Error adding item:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        
        // Convert snake_case to camelCase for frontend fields
        const transformedErrors: { [key: string]: string[] } = {};
        
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          let camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          
          // Special case: map 'pupil_name' to 'fullName' for consistency
          if (key === 'pupil_name') {
            camelCaseKey = 'fullName';
          }
          
          transformedErrors[camelCaseKey] = value as string[];
        });
        
        setFormErrors(transformedErrors);
        setToast({
          message: error.response.data.message || 'Please fix the validation errors below.',
          type: 'error'
        });
      } else if (error.response?.data) {
        // Try different error structures
        
        if (typeof error.response.data === 'object' && error.response.data !== null) {
          // Try to extract errors from different possible structures
          const possibleErrors = error.response.data.errors || error.response.data;
          
          if (typeof possibleErrors === 'object' && possibleErrors !== null) {
            // Convert to camelCase if needed
            const transformedErrors: { [key: string]: string[] } = {};
            
            Object.entries(possibleErrors).forEach(([key, value]) => {
              let camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
              if (key === 'pupil_name') {
                camelCaseKey = 'fullName';
              }
              transformedErrors[camelCaseKey] = Array.isArray(value) ? value as string[] : [String(value)];
            });
            
            setFormErrors(transformedErrors);
            setToast({
              message: 'Please fix the validation errors below.',
              type: 'error'
            });
          } else {
            setFormErrors({});
            setToast({
              message: 'Failed to add item. Please try again.',
              type: 'error'
            });
          }
        } else {
          setFormErrors({});
          setToast({
            message: 'Failed to add item. Please try again.',
            type: 'error'
          });
        }
      } else {
        setFormErrors({});
        setToast({
          message: 'Failed to add item. Please try again.',
          type: 'error'
        });
      }
      
      // Auto-hide error toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  // Get field error by frontend field name (now simplified since errors are stored in camelCase)
  const getFieldErrorByFrontendName = (frontendFieldName: string): string | null => {
    return formErrors[frontendFieldName]?.[0] || null;
  };

  // Get field error for edit form
  const getEditFieldErrorByFrontendName = (frontendFieldName: string): string | null => {
    return editFormErrors[frontendFieldName]?.[0] || null;
  };

  const handleNewStudentInputChange = (field: keyof Student, value: string | boolean) => {
    setNewStudent(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    // Now errors are stored in camelCase, so we can clear them directly
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNewStreamInputChange = (field: keyof Stream, value: string) => {
    setNewStream(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNewClassInputChange = (field: keyof Class | 'streamId', value: string | number) => {
    setNewClass(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
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
    setOriginalStudent(student); // Store original data for comparison
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
    setEditActiveSection('basic-info'); // Reset to first section when opening
    setEditFormErrors({}); // Clear any previous errors
  };

  const handleEditStream = (stream: Stream) => {
    setEditingStream(stream);
    setOriginalStream(stream); // Store original data for comparison
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
    setEditActiveSection('stream-info'); // Reset to first section when opening
    setEditFormErrors({}); // Clear any previous errors
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setOriginalClass(classItem); // Store original data for comparison
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
    setEditActiveSection('class-info'); // Reset to first section when opening
    setEditFormErrors({}); // Clear any previous errors
  };

  // Check if stream has been modified
  const isStreamModified = () => {
    if (!editingStream || !originalStream) return false;
    return (
      editingStream.name !== originalStream.name ||
      editingStream.code !== originalStream.code ||
      editingStream.description !== originalStream.description
    );
  };

  // Check if class has been modified
  const isClassModified = () => {
    if (!editingClass || !originalClass) return false;
    return (
      editingClass.name !== originalClass.name ||
      editingClass.code !== originalClass.code ||
      editingClass.stream?.id !== originalClass.stream?.id ||
      editingClass.level !== originalClass.level ||
      editingClass.capacity !== originalClass.capacity
    );
  };

  // Check if student has been modified
  const isStudentModified = () => {
    if (!editingStudent || !originalStudent) return false;
    return (
      editingStudent.admissionNumber !== originalStudent.admissionNumber ||
      editingStudent.fullName !== originalStudent.fullName ||
      editingStudent.dateOfBirth !== originalStudent.dateOfBirth ||
      editingStudent.gender !== originalStudent.gender ||
      editingStudent.dateOfAdmission !== originalStudent.dateOfAdmission ||
      editingStudent.classOnAdmission !== originalStudent.classOnAdmission ||
      editingStudent.currentClass !== originalStudent.currentClass ||
      editingStudent.lastSchoolAttended !== originalStudent.lastSchoolAttended ||
      editingStudent.guardianName !== originalStudent.guardianName ||
      editingStudent.guardianPhone !== originalStudent.guardianPhone ||
      editingStudent.guardianRelationship !== originalStudent.guardianRelationship ||
      editingStudent.address !== originalStudent.address ||
      editingStudent.boardingStatus !== originalStudent.boardingStatus ||
      editingStudent.exemptedFromReligiousInstruction !== originalStudent.exemptedFromReligiousInstruction ||
      editingStudent.birthCertificateNo !== originalStudent.birthCertificateNo ||
      editingStudent.image !== originalStudent.image ||
      editingStudent.dateOfLeaving !== originalStudent.dateOfLeaving ||
      editingStudent.schoolLeavingCertificateNumber !== originalStudent.schoolLeavingCertificateNumber ||
      editingStudent.remarks !== originalStudent.remarks
    );
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
    setOriginalStudent(null);
    setEditingStream(null);
    setOriginalStream(null);
    setEditingClass(null);
    setOriginalClass(null);
    setEditFormErrors({}); // Clear errors when closing
  };

  // Add Parent functions
  const handleAddParent = (student: Student) => {
    setSelectedStudentForParent(student);
    setIsAddParentDrawerOpen(true);
    setOpenDropdownId(null);
    
    // Reset form
    setNewParentRelationship({
      parent: '',
      relationship_type: '',
      is_primary_contact: false,
      is_emergency_contact: false,
      can_pick_up: false,
      notes: ''
    });
    
    // Fetch parents for dropdown
    fetchParents();
  };

  const closeAddParentDrawer = () => {
    setIsAddParentDrawerOpen(false);
    setSelectedStudentForParent(null);
    setNewParentRelationship({
      parent: '',
      relationship_type: '',
      is_primary_contact: false,
      is_emergency_contact: false,
      can_pick_up: false,
      notes: ''
    });
    setParentFormErrors({});
  };

  const fetchParents = async () => {
    try {
      setLoadingParents(true);
      const response = await apiService.parents.getAll();
      setParents(response.results || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
      setToast({
        message: 'Failed to fetch parents. Please try again.',
        type: 'error'
      });
    } finally {
      setLoadingParents(false);
    }
  };

  // Get field error for parent form
  const getParentFieldError = (fieldName: string): string | null => {
    return parentFormErrors[fieldName]?.[0] || null;
  };

  const handleAddParentSubmit = async () => {
    if (!selectedStudentForParent || !selectedStudentForParent.id || !newParentRelationship.parent || !newParentRelationship.relationship_type) {
      setToast({
        message: 'Please fill in all required fields.',
        type: 'error'
      });
      return;
    }

    try {
      await apiService.students.associateParent(selectedStudentForParent.id, newParentRelationship);
      
      setToast({
        message: 'Parent associated successfully!',
        type: 'success'
      });
      
      closeAddParentDrawer();
      
      // Refresh students list by calling the existing fetch function
      // We'll just close the drawer for now since the parent association doesn't change the student list
      
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
          setToast({
            message: errors.non_field_errors[0],
            type: 'error'
          });
        }
      } else {
        setToast({
          message: 'Failed to associate parent. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const handleSaveStudent = async () => {
    if (editingStudent && originalStudent) {
      try {
        // Get only the changed fields
        const changedFields = getChangedFields(originalStudent, editingStudent);
        
        // Only proceed if there are actual changes
        if (Object.keys(changedFields).length === 0) {
          setToast({
            message: 'No changes detected. Student information is already up to date.',
            type: 'success'
          });
          closeEditDrawer();
          return;
        }

        // Use ID for the update
        const studentId = editingStudent.id || originalStudent.id;
        if (!studentId) {
          throw new Error('Student ID is required for update');
        }

        await apiService.students.update(studentId, changedFields);
        
        // Re-fetch the students list to get the complete data with full class objects
        await loadStudents();
        
        // Show success toast
        setToast({
          message: 'Student updated successfully!',
          type: 'success'
        });
        
        // Clear form errors
        setEditFormErrors({});
        
        closeEditDrawer();
        
        // Auto-hide toast after 3 seconds
        setTimeout(() => {
          setToast(null);
        }, 3000);
        
      } catch (error: any) {
        console.error('Error updating student:', error);
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          
          // Convert snake_case to camelCase for frontend fields
          const transformedErrors: { [key: string]: string[] } = {};
          
          Object.entries(error.response.data.errors).forEach(([key, value]) => {
            let camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            
            // Special case: map 'pupil_name' to 'fullName' for consistency
            if (key === 'pupil_name') {
              camelCaseKey = 'fullName';
            }
            
            transformedErrors[camelCaseKey] = value as string[];
          });
          
          setEditFormErrors(transformedErrors);
          setToast({
            message: error.response.data.message || 'Please fix the validation errors below.',
            type: 'error'
          });
        } else if (error.response?.data) {
          // Try different error structures
          
          if (typeof error.response.data === 'object' && error.response.data !== null) {
            // Try to extract errors from different possible structures
            const possibleErrors = error.response.data.errors || error.response.data;
            
            if (typeof possibleErrors === 'object' && possibleErrors !== null) {
              // Convert to camelCase if needed
              const transformedErrors: { [key: string]: string[] } = {};
              
              Object.entries(possibleErrors).forEach(([key, value]) => {
                let camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                if (key === 'pupil_name') {
                  camelCaseKey = 'fullName';
                }
                transformedErrors[camelCaseKey] = Array.isArray(value) ? value as string[] : [String(value)];
              });
              
              setEditFormErrors(transformedErrors);
              setToast({
                message: 'Please fix the validation errors below.',
                type: 'error'
              });
            } else {
              setEditFormErrors({});
              setToast({
                message: 'Failed to update student. Please try again.',
                type: 'error'
              });
            }
          } else {
            setEditFormErrors({});
            setToast({
              message: 'Failed to update student. Please try again.',
              type: 'error'
            });
          }
        } else {
          setEditFormErrors({});
          setToast({
            message: 'Failed to update student. Please try again.',
            type: 'error'
          });
        }
        
        // Auto-hide error toast after 5 seconds
        setTimeout(() => {
          setToast(null);
        }, 5000);
      }
    }
  };

  const handleSaveStream = async () => {
    if (!editingStream || !originalStream) return;

    try {
      // Check if any changes were made
      if (!isStreamModified()) {
        setToast({
          message: 'No changes detected.',
          type: 'error'
        });
        return;
      }

      // Prepare the update data
      const updateData = {
        name: editingStream.name,
        code: editingStream.code,
        description: editingStream.description
      };

      const response = await apiService.students.updateStream(editingStream.id, updateData);
      
      // Update the streams list
      setStreams(prev => prev.map(stream => 
        stream.id === editingStream.id ? response : stream
      ));
      
      setToast({
        message: 'Stream updated successfully!',
        type: 'success'
      });
      
      // Clear form errors
      setEditFormErrors({});
      
      // Close drawer
      closeEditDrawer();
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating stream:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const transformedErrors: { [key: string]: string[] } = {};
        
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          transformedErrors[key] = value as string[];
        });
        
        setEditFormErrors(transformedErrors);
        setToast({
          message: error.response.data.message || 'Please fix the validation errors below.',
          type: 'error'
        });
      } else {
        setEditFormErrors({});
        setToast({
          message: 'Failed to update stream. Please try again.',
          type: 'error'
        });
      }
      
      // Auto-hide error toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const handleSaveClass = async () => {
    if (!editingClass || !originalClass) return;

    try {
      // Check if any changes were made
      if (!isClassModified()) {
        setToast({
          message: 'No changes detected.',
          type: 'error'
        });
        return;
      }

      // Prepare the update data
      const updateData = {
        name: editingClass.name,
        code: editingClass.code,
        stream_id: editingClass.stream?.id,
        level: editingClass.level,
        capacity: editingClass.capacity
      };

      const response = await apiService.students.updateClass(editingClass.id, updateData);
      
      // Update the classes list
      setClasses(prev => prev.map(classItem => 
        classItem.id === editingClass.id ? response : classItem
      ));
      
      setToast({
        message: 'Class updated successfully!',
        type: 'success'
      });
      
      // Clear form errors
      setEditFormErrors({});
      
      // Close drawer
      closeEditDrawer();
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating class:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const transformedErrors: { [key: string]: string[] } = {};
        
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          let camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          if (key === 'stream_id') {
            camelCaseKey = 'streamId';
          }
          transformedErrors[camelCaseKey] = value as string[];
        });
        
        setEditFormErrors(transformedErrors);
        setToast({
          message: error.response.data.message || 'Please fix the validation errors below.',
          type: 'error'
        });
      } else {
        setEditFormErrors({});
        setToast({
          message: 'Failed to update class. Please try again.',
          type: 'error'
        });
      }
      
      // Auto-hide error toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const handleInputChange = (field: keyof Student, value: string | boolean) => {
    if (editingStudent) {
      setEditingStudent({
        ...editingStudent,
        [field]: value
      });
      
      // Clear error for this field when user starts typing
      if (editFormErrors[field]) {
        setEditFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const handleEditStreamInputChange = (field: keyof Stream, value: string) => {
    if (editingStream) {
      setEditingStream({
        ...editingStream,
        [field]: value
      });
      
      // Clear error for this field when user starts typing
      if (editFormErrors[field]) {
        setEditFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const handleEditClassInputChange = (field: keyof Class | 'streamId', value: string | number) => {
    if (editingClass) {
      setEditingClass({
        ...editingClass,
        [field]: value
      });
      
      // Clear error for this field when user starts typing
      if (editFormErrors[field]) {
        setEditFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
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
            {/* Feature Status Indicator - Only show on admission tab */}
            {!featureSwitchLoading && activeTab === 'admission' && !isRootUser && isStudentAdmissionBlocked && (
              <div className="mb-3 p-2 rounded-md text-xs font-medium flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-red-700 bg-red-50 px-2 py-1 rounded">
                  <span>🚫</span>
                  <span>Student Admission Blocked</span>
                </div>
              </div>
            )}
            
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
                  onClick={() => setActiveTab('classes')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'classes' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Classes
                </button>
                <button 
                  onClick={() => setActiveTab('streams')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'streams' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Streams
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
                {/* Refresh Feature Status Button */}
                {featureSwitchError && (
                  <button
                    onClick={refreshFeatureStatus}
                    className="px-3 py-1.5 border border-red-300 bg-red-50 text-red-700 rounded-md text-xs font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200"
                    title="Refresh feature status"
                  >
                    Refresh Status
                  </button>
                )}
                
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'admission' ? 'Search students...' :
                      activeTab === 'classes' ? 'Search classes...' :
                      activeTab === 'streams' ? 'Search streams...' :
                      activeTab === 'academic' ? 'Search academic...' :
                      activeTab === 'financial' ? 'Search financial...' :
                      activeTab === 'attendance' ? 'Search attendance...' :
                      'Search...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked}
                    className={`pl-8 pr-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-xs transition-colors duration-200 ${
                      activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked
                        ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {FaSearch({ className: `h-3 w-3 ${activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked ? 'text-gray-300' : 'text-gray-400'}` })}
                  </div>
                </div>

                {/* Filter */}
                <button 
                  disabled={activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked}
                  className={`px-3 py-1.5 border rounded-md text-xs transition-colors duration-200 ${
                    activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked
                      ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                >
                  Filter
                </button>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  disabled={activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked}
                  className={`px-3 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${
                    activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked
                      ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-transparent'
                  }`}
                >
                  <option value="">Sort by</option>
                  {activeTab === 'admission' && (
                    <>
                      <option value="admissionNumber">Admission Number</option>
                      <option value="fullName">Full Name</option>
                      <option value="class">Class</option>
                      <option value="gender">Gender</option>
                      <option value="dateOfAdmission">Date of Admission</option>
                    </>
                  )}
                  {activeTab === 'classes' && (
                    <>
                      <option value="name">Class Name</option>
                      <option value="code">Class Code</option>
                      <option value="stream.name">Stream</option>
                      <option value="capacity">Capacity</option>
                      <option value="created_at">Created At</option>
                    </>
                  )}
                  {activeTab === 'streams' && (
                    <>
                      <option value="name">Stream Name</option>
                      <option value="code">Stream Code</option>
                      <option value="description">Description</option>
                      <option value="created_at">Created At</option>
                    </>
                  )}
                  {activeTab === 'academic' && (
                    <>
                      <option value="subject">Subject</option>
                      <option value="grade">Grade</option>
                      <option value="teacher">Teacher</option>
                    </>
                  )}
                  {activeTab === 'financial' && (
                    <>
                      <option value="feeType">Fee Type</option>
                      <option value="amount">Amount</option>
                      <option value="dueDate">Due Date</option>
                      <option value="status">Status</option>
                    </>
                  )}
                  {activeTab === 'attendance' && (
                    <>
                      <option value="date">Date</option>
                      <option value="status">Status</option>
                      <option value="student">Student</option>
                    </>
                  )}
                </select>

                {/* Add New Button - Dynamic based on active tab */}
                <PermissionGate permissions={['student_crud']}>
                  <DisabledButtonWithTooltip
                    tooltipMessage={!featureSwitchLoading && isStudentAdmissionBlocked ? blockMessage : ''}
                    disabled={!featureSwitchLoading && isStudentAdmissionBlocked}
                    className="inline-block"
                  >
                    <button
                      onClick={openAddDrawer}
                      disabled={!featureSwitchLoading && isStudentAdmissionBlocked}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activeTab === 'admission' && '+ Add Student'}
                      {activeTab === 'classes' && '+ Add Class'}
                      {activeTab === 'streams' && '+ Add Stream'}
                      {activeTab === 'academic' && '+ Add Academic'}
                      {activeTab === 'financial' && '+ Add Financial'}
                      {activeTab === 'attendance' && '+ Add Attendance'}
                    </button>
                  </DisabledButtonWithTooltip>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'admission' && (
          <div className="bg-white rounded-md shadow-sm relative">
            {/* Grey overlay when admission is blocked */}
            {!featureSwitchLoading && isStudentAdmissionBlocked && (
              <div 
                className="absolute inset-0 bg-gray-500 bg-opacity-15 z-10 flex items-center justify-center"
                title={blockMessage}
              >
                <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                  <div className="text-gray-600 mb-2">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Student Admission Temporarily Unavailable</p>
                  <p className="text-xs text-gray-600 mt-1">{blockMessage}</p>
                </div>
              </div>
            )}
            
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
                      <tr key={student.id || `student-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {student.admissionNumber}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.current_class ? 
                            `${student.current_class.name} - ${student.current_class.stream?.name || 'No Stream'}` : 
                            (student.class_on_admission ? 
                              `${student.class_on_admission.name} - ${student.class_on_admission.stream?.name || 'No Stream'}` : 
                              (student.classOnAdmission || student.class || '')
                            )
                          }
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
                            <PermissionGate permissions={['student_crud']}>
                              <div className="relative" data-dropdown-container>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const studentId = student.id || `student-${Math.random()}`;
                                    toggleDropdown(studentId, e);
                                  }}
                                  className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
                                    openDropdownId === student.id 
                                      ? 'text-blue-600 bg-blue-50' 
                                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                  }`}
                                  title="More Options"
                                >
                                  {FaEllipsisV({ className: "w-3 h-3" })}
                                </button>
                                
                                {/* Dropdown button only - dropdown rendered via portal */}
                              </div>
                            </PermissionGate>
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

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="bg-white rounded-md shadow-sm relative">
            {isLoadingClasses ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading classes...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Class Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('code')}>
                        <div className="flex items-center space-x-1">
                          <span>Class Code</span>
                          {getSortIcon('code')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('stream.name')}>
                        <div className="flex items-center space-x-1">
                          <span>Stream</span>
                          {getSortIcon('stream.name')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('capacity')}>
                        <div className="flex items-center space-x-1">
                          <span>Capacity</span>
                          {getSortIcon('capacity')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Created At</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                          No classes found
                        </td>
                      </tr>
                    ) : (
                      classes.map((classItem, index) => (
                        <tr key={classItem.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                            {classItem.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {classItem.code}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {classItem.stream?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {classItem.capacity}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {new Date(classItem.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 relative">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {/* Handle view */}}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                                title="View Details"
                              >
                                {FaEye({ className: "w-3 h-3" })}
                              </button>
                              
                              <PermissionGate permissions={['student_crud']}>
                                <div className="relative" data-dropdown-container>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleDropdown(classItem.id, e);
                                    }}
                                    className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
                                      openDropdownId === classItem.id 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                    title="More Options"
                                  >
                                    {FaEllipsisV({ className: "w-3 h-3" })}
                                  </button>
                                </div>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Streams Tab */}
        {activeTab === 'streams' && (
          <div className="bg-white rounded-md shadow-sm relative">
            {isLoadingStreams ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading streams...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Stream Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('code')}>
                        <div className="flex items-center space-x-1">
                          <span>Stream Code</span>
                          {getSortIcon('code')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('description')}>
                        <div className="flex items-center space-x-1">
                          <span>Description</span>
                          {getSortIcon('description')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Created At</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {streams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                          No streams found
                        </td>
                      </tr>
                    ) : (
                      streams.map((stream, index) => (
                        <tr key={stream.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                            {stream.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {stream.code}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {stream.description}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {new Date(stream.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 relative">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {/* Handle view */}}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                                title="View Details"
                              >
                                {FaEye({ className: "w-3 h-3" })}
                              </button>
                              
                              <PermissionGate permissions={['student_crud']}>
                                <div className="relative" data-dropdown-container>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleDropdown(stream.id, e);
                                    }}
                                    className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
                                      openDropdownId === stream.id 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                    title="More Options"
                                  >
                                    {FaEllipsisV({ className: "w-3 h-3" })}
                                  </button>
                                </div>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalCount}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePreviousPage}
              disabled={!hasPreviousPage || (activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked)}
              className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors duration-200 ${
                activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked
                  ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
              Page {currentPage} of {totalPages} ({totalPages > 1 ? `${totalPages} pages` : '1 page'})
            </span>
            <button 
              onClick={handleNextPage}
              disabled={!hasNextPage || (activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked)}
              className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors duration-200 ${
                activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked
                  ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
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
          {(editingStudent || editingClass || editingStream) && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                              <div>
                <h2 className="text-xl font-bold text-gray-900 font-elegant">
                  {activeTab === 'admission' && 'Edit Student'}
                  {activeTab === 'classes' && 'Edit Class'}
                  {activeTab === 'streams' && 'Edit Stream'}
                  {activeTab === 'academic' && 'Edit Academic'}
                  {activeTab === 'financial' && 'Edit Financial'}
                  {activeTab === 'attendance' && 'Edit Attendance'}
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">
                  {activeTab === 'admission' && 'Update student information'}
                  {activeTab === 'classes' && 'Update class information'}
                  {activeTab === 'streams' && 'Update stream information'}
                  {activeTab === 'academic' && 'Update academic information'}
                  {activeTab === 'financial' && 'Update financial information'}
                  {activeTab === 'attendance' && 'Update attendance information'}
                </p>
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
              {/* Error Summary */}
              {Object.keys(editFormErrors).length > 0 && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <h3 className="text-sm font-semibold text-red-800">Please fix the following errors:</h3>
                  </div>
                  <ul className="text-xs text-red-700 space-y-1">
                    {Object.entries(editFormErrors).map(([field, errors]) => {
                      // Map camelCase field names to user-friendly names
                      const fieldNameMapping: { [key: string]: string } = {
                        'admissionNumber': 'Admission Number',
                        'fullName': 'Full Name',
                        'dateOfBirth': 'Date of Birth',
                        'dateOfAdmission': 'Date of Admission',
                        'classOnAdmission': 'Class on Admission ID',
                        'currentClass': 'Current Class ID',
                        'lastSchoolAttended': 'Last School Attended',
                        'guardianName': 'Guardian Name',
                        'guardianPhone': 'Guardian Phone',
                        'guardianRelationship': 'Guardian Relationship',
                        'boardingStatus': 'Boarding Status',
                        'address': 'Address',
                        'birthCertificateNo': 'Birth Certificate Number',
                        'schoolLeavingCertificateNumber': 'School Leaving Certificate Number',
                        'remarks': 'Remarks'
                      };
                      
                      const displayName = fieldNameMapping[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      
                      return (
                        <li key={field} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>
                            <span className="font-medium">{displayName}:</span> {errors[0]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              <div className="p-6 space-y-4">
                {/* Student Edit Form */}
                {editingStudent && (
                  <>
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('admissionNumber') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter admission number"
                        />
                        {getEditFieldErrorByFrontendName('admissionNumber') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('admissionNumber')}</p>
                        )}
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('fullName') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter full names"
                        />
                        {getEditFieldErrorByFrontendName('fullName') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('fullName')}</p>
                        )}
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('dateOfBirth') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {getEditFieldErrorByFrontendName('dateOfBirth') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('dateOfBirth')}</p>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Gender *
                        </label>
                        <select
                          value={editingStudent.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('gender') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {getEditFieldErrorByFrontendName('gender') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('gender')}</p>
                        )}
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('dateOfAdmission') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {getEditFieldErrorByFrontendName('dateOfAdmission') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('dateOfAdmission')}</p>
                        )}
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
                        <select
                          value={editingStudent.classOnAdmission}
                          onChange={(e) => handleInputChange('classOnAdmission', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('classOnAdmission') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select class on admission</option>
                          {classes.map((classItem) => (
                            <option key={classItem.id} value={classItem.id}>
                              {classItem.name} - {classItem.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                        {getEditFieldErrorByFrontendName('classOnAdmission') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('classOnAdmission')}</p>
                        )}
                      </div>

                      {/* Current Class */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Current Class *
                        </label>
                        <select
                          value={editingStudent.currentClass}
                          onChange={(e) => handleInputChange('currentClass', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('currentClass') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select current class</option>
                          {classes.map((classItem) => (
                            <option key={classItem.id} value={classItem.id}>
                              {classItem.name} - {classItem.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                        {getEditFieldErrorByFrontendName('currentClass') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('currentClass')}</p>
                        )}
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('guardianName') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter guardian name"
                        />
                        {getEditFieldErrorByFrontendName('guardianName') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('guardianName')}</p>
                        )}
                      </div>

                      {/* Guardian Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Guardian Phone *
                        </label>
                        <input
                          type="tel"
                          value={editingStudent.guardianPhone}
                          onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('guardianPhone') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter guardian phone"
                        />
                        {getEditFieldErrorByFrontendName('guardianPhone') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('guardianPhone')}</p>
                        )}
                      </div>

                      {/* Guardian Relationship */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Guardian Relationship
                        </label>
                        <select
                          value={editingStudent.guardianRelationship}
                          onChange={(e) => handleInputChange('guardianRelationship', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('guardianRelationship') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select relationship</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                        {getEditFieldErrorByFrontendName('guardianRelationship') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('guardianRelationship')}</p>
                        )}
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs ${
                            getEditFieldErrorByFrontendName('address') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter address"
                        />
                        {getEditFieldErrorByFrontendName('address') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('address')}</p>
                        )}
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('lastSchoolAttended') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter last school attended"
                        />
                        {getEditFieldErrorByFrontendName('lastSchoolAttended') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('lastSchoolAttended')}</p>
                        )}
                      </div>

                      {/* Birth Certificate Number */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Birth Certificate Number
                        </label>
                        <input
                          type="text"
                          value={editingStudent.birthCertificateNo}
                          onChange={(e) => handleInputChange('birthCertificateNo', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('birthCertificateNo') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter birth certificate number"
                        />
                        {getEditFieldErrorByFrontendName('birthCertificateNo') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('birthCertificateNo')}</p>
                        )}
                      </div>

                      {/* Boarding Status */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Boarding Status
                        </label>
                        <select
                          value={editingStudent.boardingStatus}
                          onChange={(e) => handleInputChange('boardingStatus', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('boardingStatus') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select boarding status</option>
                          <option value="Day">Day</option>
                          <option value="Boarding">Boarding</option>
                        </select>
                        {getEditFieldErrorByFrontendName('boardingStatus') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('boardingStatus')}</p>
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getEditFieldErrorByFrontendName('dateOfLeaving') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {getEditFieldErrorByFrontendName('dateOfLeaving') && (
                          <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('dateOfLeaving')}</p>
                        )}
                      </div>
                    </CollapsibleSection>
                  </>
                )}

                {/* Stream Edit Form */}
                {editingStream && (
                  <CollapsibleSection 
                    title="Stream Information *" 
                    defaultExpanded={true}
                    isActive={editActiveSection === 'stream-info'}
                    onSectionClick={() => setEditActiveSection('stream-info')}
                  >
                    {/* Stream Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Stream Name *
                      </label>
                      <input
                        type="text"
                        value={editingStream.name}
                        onChange={(e) => handleEditStreamInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getEditFieldErrorByFrontendName('name') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter stream name"
                      />
                      {getEditFieldErrorByFrontendName('name') && (
                        <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('name')}</p>
                      )}
                    </div>

                    {/* Stream Code */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Stream Code *
                      </label>
                      <input
                        type="text"
                        value={editingStream.code}
                        onChange={(e) => handleEditStreamInputChange('code', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getEditFieldErrorByFrontendName('code') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter stream code"
                      />
                      {getEditFieldErrorByFrontendName('code') && (
                        <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('code')}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Description
                      </label>
                      <textarea
                        value={editingStream.description}
                        onChange={(e) => handleEditStreamInputChange('description', e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs ${
                          getEditFieldErrorByFrontendName('description') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter stream description"
                      />
                      {getEditFieldErrorByFrontendName('description') && (
                        <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('description')}</p>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Class Edit Form */}
                {editingClass && (
                  <CollapsibleSection 
                    title="Class Information *" 
                    defaultExpanded={true}
                    isActive={editActiveSection === 'class-info'}
                    onSectionClick={() => setEditActiveSection('class-info')}
                  >
                    {/* Class Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Class Name *
                      </label>
                      <input
                        type="text"
                        value={editingClass.name}
                        onChange={(e) => handleEditClassInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getEditFieldErrorByFrontendName('name') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter class name"
                      />
                      {getEditFieldErrorByFrontendName('name') && (
                        <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('name')}</p>
                      )}
                    </div>

                    {/* Class Code */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Class Code *
                      </label>
                      <input
                        type="text"
                        value={editingClass.code}
                        onChange={(e) => handleEditClassInputChange('code', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getEditFieldErrorByFrontendName('code') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter class code"
                      />
                      {getEditFieldErrorByFrontendName('code') && (
                        <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('code')}</p>
                      )}
                    </div>

                    {/* Stream Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Stream *
                      </label>
                      <select
                        value={editingClass.stream?.id || ''}
                        onChange={(e) => handleEditClassInputChange('streamId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getEditFieldErrorByFrontendName('streamId') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                      >
                        <option value="">Select a stream</option>
                        {streams.map((stream) => (
                          <option key={stream.id} value={stream.id}>
                            {stream.name} ({stream.code})
                          </option>
                        ))}
                      </select>
                      {getEditFieldErrorByFrontendName('streamId') && (
                        <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('streamId')}</p>
                      )}
                    </div>

                    {/* Level */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Level *
                      </label>
                      <input
                        type="number"
                        value={editingClass.level}
                        onChange={(e) => handleEditClassInputChange('level', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getEditFieldErrorByFrontendName('level') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter class level"
                      />
                      {getEditFieldErrorByFrontendName('level') && (
                        <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('level')}</p>
                      )}
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Capacity *
                      </label>
                      <input
                        type="number"
                        value={editingClass.capacity}
                        onChange={(e) => handleEditClassInputChange('capacity', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getEditFieldErrorByFrontendName('capacity') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter class capacity"
                      />
                      {getEditFieldErrorByFrontendName('capacity') && (
                        <p className="text-xs text-red-600 mt-1">{getEditFieldErrorByFrontendName('capacity')}</p>
                      )}
                    </div>
                  </CollapsibleSection>
                )}
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
                  onClick={() => {
                    if (editingStudent) {
                      handleSaveStudent();
                    } else if (editingStream) {
                      handleSaveStream();
                    } else if (editingClass) {
                      handleSaveClass();
                    }
                  }}
                  disabled={
                    (editingStudent && !isStudentModified()) ||
                    (editingStream && !isStreamModified()) ||
                    (editingClass && !isClassModified()) ||
                    false
                  }
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    (editingStudent && !isStudentModified()) ||
                    (editingStream && !isStreamModified()) ||
                    (editingClass && !isClassModified())
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-white bg-blue-600 hover:bg-blue-700'
                  }`}
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
                <h2 className="text-xl font-bold text-gray-900 font-elegant">
                  {activeTab === 'admission' && 'Add New Student'}
                  {activeTab === 'classes' && 'Add New Class'}
                  {activeTab === 'streams' && 'Add New Stream'}
                  {activeTab === 'academic' && 'Add New Academic'}
                  {activeTab === 'financial' && 'Add New Financial'}
                  {activeTab === 'attendance' && 'Add New Attendance'}
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">
                  {activeTab === 'admission' && 'Enter student information'}
                  {activeTab === 'classes' && 'Enter class information'}
                  {activeTab === 'streams' && 'Enter stream information'}
                  {activeTab === 'academic' && 'Enter academic information'}
                  {activeTab === 'financial' && 'Enter financial information'}
                  {activeTab === 'attendance' && 'Enter attendance information'}
                </p>
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
                    {Object.entries(formErrors).map(([field, errors]) => {
                      // Map camelCase field names to user-friendly names
                      const fieldNameMapping: { [key: string]: string } = {
                        'admissionNumber': 'Admission Number',
                        'fullName': 'Full Name',
                        'dateOfBirth': 'Date of Birth',
                        'dateOfAdmission': 'Date of Admission',
                        'classOnAdmission': 'Class on Admission ID',
                        'currentClass': 'Current Class ID',
                        'lastSchoolAttended': 'Last School Attended',
                        'guardianName': 'Guardian Name',
                        'guardianPhone': 'Guardian Phone',
                        'guardianRelationship': 'Guardian Relationship',
                        'boardingStatus': 'Boarding Status',
                        'address': 'Address',
                        'birthCertificateNo': 'Birth Certificate Number',
                        'schoolLeavingCertificateNumber': 'School Leaving Certificate Number',
                        'remarks': 'Remarks'
                      };
                      
                      const displayName = fieldNameMapping[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      
                      return (
                        <li key={field} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>
                            <span className="font-medium">{displayName}:</span> {errors[0]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              <div className="p-6 space-y-4">
                {/* Student Form */}
                {activeTab === 'admission' && (
                  <>
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
                            getFieldErrorByFrontendName('admissionNumber') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter admission number"
                        />
                        {getFieldErrorByFrontendName('admissionNumber') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('admissionNumber')}</p>
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
                            getFieldErrorByFrontendName('fullName') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter full names"
                        />
                        {getFieldErrorByFrontendName('fullName') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('fullName')}</p>
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getFieldErrorByFrontendName('dateOfBirth') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {getFieldErrorByFrontendName('dateOfBirth') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('dateOfBirth')}</p>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Gender *
                        </label>
                        <select
                          value={newStudent.gender}
                          onChange={(e) => handleNewStudentInputChange('gender', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getFieldErrorByFrontendName('gender') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {getFieldErrorByFrontendName('gender') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('gender')}</p>
                        )}
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getFieldErrorByFrontendName('dateOfAdmission') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {getFieldErrorByFrontendName('dateOfAdmission') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('dateOfAdmission')}</p>
                        )}
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
                        <select
                          value={newStudent.classOnAdmission}
                          onChange={(e) => handleNewStudentInputChange('classOnAdmission', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getFieldErrorByFrontendName('classOnAdmission') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select class on admission</option>
                          {classes.map((classItem) => (
                            <option key={classItem.id} value={classItem.id}>
                              {classItem.name} - {classItem.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                        {getFieldErrorByFrontendName('classOnAdmission') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('classOnAdmission')}</p>
                        )}
                      </div>

                      {/* Current Class */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Current Class *
                        </label>
                        <select
                          value={newStudent.currentClass}
                          onChange={(e) => handleNewStudentInputChange('currentClass', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getFieldErrorByFrontendName('currentClass') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select current class</option>
                          {classes.map((classItem) => (
                            <option key={classItem.id} value={classItem.id}>
                              {classItem.name} - {classItem.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                        {getFieldErrorByFrontendName('currentClass') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('currentClass')}</p>
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
                            getFieldErrorByFrontendName('guardianName') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter guardian name"
                        />
                        {getFieldErrorByFrontendName('guardianName') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('guardianName')}</p>
                        )}
                      </div>

                      {/* Guardian Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Guardian Phone *
                        </label>
                        <input
                          type="tel"
                          value={newStudent.guardianPhone}
                          onChange={(e) => handleNewStudentInputChange('guardianPhone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getFieldErrorByFrontendName('guardianPhone') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter guardian phone"
                        />
                        {getFieldErrorByFrontendName('guardianPhone') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('guardianPhone')}</p>
                        )}
                      </div>

                      {/* Guardian Relationship */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Guardian Relationship
                        </label>
                        <select
                          value={newStudent.guardianRelationship}
                          onChange={(e) => handleNewStudentInputChange('guardianRelationship', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        >
                          <option value="">Select relationship</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
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
                            getFieldErrorByFrontendName('address') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter address"
                        />
                        {getFieldErrorByFrontendName('address') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('address')}</p>
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

                      {/* Birth Certificate Number */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Birth Certificate Number
                        </label>
                        <input
                          type="text"
                          value={newStudent.birthCertificateNo}
                          onChange={(e) => handleNewStudentInputChange('birthCertificateNo', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                            getFieldErrorByFrontendName('birthCertificateNo') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Enter birth certificate number"
                        />
                        {getFieldErrorByFrontendName('birthCertificateNo') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('birthCertificateNo')}</p>
                        )}
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
                            getFieldErrorByFrontendName('boardingStatus') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select boarding status</option>
                          <option value="Day">Day</option>
                          <option value="Boarding">Boarding</option>
                        </select>
                        {getFieldErrorByFrontendName('boardingStatus') && (
                          <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('boardingStatus')}</p>
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
                  </>
                )}

                {/* Stream Form */}
                {activeTab === 'streams' && (
                  <CollapsibleSection 
                    title="Stream Information *" 
                    defaultExpanded={true}
                    isActive={activeSection === 'stream-info'}
                    onSectionClick={() => setActiveSection('stream-info')}
                  >
                    {/* Stream Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Stream Name *
                      </label>
                      <input
                        type="text"
                        value={newStream?.name || ''}
                        onChange={(e) => handleNewStreamInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getFieldErrorByFrontendName('name') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter stream name"
                      />
                      {getFieldErrorByFrontendName('name') && (
                        <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('name')}</p>
                      )}
                    </div>

                    {/* Stream Code */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Stream Code *
                      </label>
                      <input
                        type="text"
                        value={newStream?.code || ''}
                        onChange={(e) => handleNewStreamInputChange('code', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getFieldErrorByFrontendName('code') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter stream code"
                      />
                      {getFieldErrorByFrontendName('code') && (
                        <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('code')}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Description
                      </label>
                      <textarea
                        value={newStream?.description || ''}
                        onChange={(e) => handleNewStreamInputChange('description', e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs ${
                          getFieldErrorByFrontendName('description') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter stream description"
                      />
                      {getFieldErrorByFrontendName('description') && (
                        <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('description')}</p>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Class Form */}
                {activeTab === 'classes' && (
                  <CollapsibleSection 
                    title="Class Information *" 
                    defaultExpanded={true}
                    isActive={activeSection === 'class-info'}
                    onSectionClick={() => setActiveSection('class-info')}
                  >
                    {/* Class Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Class Name *
                      </label>
                      <input
                        type="text"
                        value={newClass?.name || ''}
                        onChange={(e) => handleNewClassInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getFieldErrorByFrontendName('name') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter class name"
                      />
                      {getFieldErrorByFrontendName('name') && (
                        <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('name')}</p>
                      )}
                    </div>

                    {/* Class Code */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Class Code *
                      </label>
                      <input
                        type="text"
                        value={newClass?.code || ''}
                        onChange={(e) => handleNewClassInputChange('code', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getFieldErrorByFrontendName('code') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter class code"
                      />
                      {getFieldErrorByFrontendName('code') && (
                        <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('code')}</p>
                      )}
                    </div>

                    {/* Stream Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Stream *
                      </label>
                      <select
                        value={newClass?.streamId || ''}
                        onChange={(e) => handleNewClassInputChange('streamId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getFieldErrorByFrontendName('streamId') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                      >
                        <option value="">Select a stream</option>
                        {streams.map((stream) => (
                          <option key={stream.id} value={stream.id}>
                            {stream.name} ({stream.code})
                          </option>
                        ))}
                      </select>
                      {getFieldErrorByFrontendName('streamId') && (
                        <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('streamId')}</p>
                      )}
                    </div>

                    {/* Level */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Level *
                      </label>
                      <input
                        type="number"
                        value={newClass?.level || ''}
                        onChange={(e) => handleNewClassInputChange('level', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getFieldErrorByFrontendName('level') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter class level"
                      />
                      {getFieldErrorByFrontendName('level') && (
                        <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('level')}</p>
                      )}
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Capacity *
                      </label>
                      <input
                        type="number"
                        value={newClass?.capacity || ''}
                        onChange={(e) => handleNewClassInputChange('capacity', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                          getFieldErrorByFrontendName('capacity') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter class capacity"
                      />
                      {getFieldErrorByFrontendName('capacity') && (
                        <p className="text-xs text-red-600 mt-1">{getFieldErrorByFrontendName('capacity')}</p>
                      )}
                    </div>
                  </CollapsibleSection>
                )}
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
                disabled={
                  (activeTab === 'admission' && (
                    !newStudent.fullName || 
                    !newStudent.admissionNumber ||
                    !newStudent.dateOfBirth ||
                    !newStudent.dateOfAdmission ||
                    !newStudent.classOnAdmission ||
                    !newStudent.currentClass ||
                    !newStudent.guardianName ||
                    !newStudent.guardianPhone ||
                    !newStudent.address
                  )) ||
                  (activeTab === 'streams' && (!newStream.name || !newStream.code)) ||
                  (activeTab === 'classes' && (!newClass.name || !newClass.code || !newClass.streamId))
                }
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {activeTab === 'admission' && 'Add Student'}
                {activeTab === 'classes' && 'Add Class'}
                {activeTab === 'streams' && 'Add Stream'}
                {activeTab === 'academic' && 'Add Academic'}
                {activeTab === 'financial' && 'Add Financial'}
                {activeTab === 'attendance' && 'Add Attendance'}
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
            <PermissionGate permissions={['student_crud']}>
              <DisabledButtonWithTooltip
                tooltipMessage={!featureSwitchLoading && isStudentAdmissionBlocked ? blockMessage : ''}
                disabled={!featureSwitchLoading && isStudentAdmissionBlocked}
                className="w-full"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTab === 'admission') {
                      if (!featureSwitchLoading && !isStudentAdmissionBlocked) {
                        const student = students.find(s => s.id === openDropdownId);
                        if (student) {
                          handleEditStudent(student);
                        }
                      }
                    } else if (activeTab === 'classes') {
                      const classItem = classes.find(c => c.id === openDropdownId);
                      if (classItem) {
                        handleEditClass(classItem);
                      }
                    } else if (activeTab === 'streams') {
                      const stream = streams.find(s => s.id === openDropdownId);
                      if (stream) {
                        handleEditStream(stream);
                      }
                    }
                  }}
                  disabled={activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked}
                  className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {FaEdit({ className: "w-3 h-3 mr-2" })}
                  Edit
                </button>
              </DisabledButtonWithTooltip>
            </PermissionGate>
            
            {/* Add Parent button - only show for students */}
            {activeTab === 'admission' && (
              <PermissionGate permissions={['student_crud']}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const student = students.find(s => s.id === openDropdownId);
                    if (student) {
                      handleAddParent(student);
                    }
                  }}
                  className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                >
                  {FaUserFriends({ className: "w-3 h-3 mr-2" })}
                  Add Parent
                </button>
              </PermissionGate>
            )}
            <PermissionGate permissions={['student_crud']}>
              <DisabledButtonWithTooltip
                tooltipMessage={!featureSwitchLoading && isStudentAdmissionBlocked ? blockMessage : ''}
                disabled={!featureSwitchLoading && isStudentAdmissionBlocked}
                className="w-full"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTab === 'admission') {
                      if (!featureSwitchLoading && !isStudentAdmissionBlocked) {
                        const student = students.find(s => s.id === openDropdownId);
                        if (student) {
                          handleDeleteStudent(student);
                        }
                      }
                    } else if (activeTab === 'classes') {
                      const classItem = classes.find(c => c.id === openDropdownId);
                      if (classItem) {
                        // TODO: Handle delete class
                        console.log('Delete class:', classItem);
                      }
                    } else if (activeTab === 'streams') {
                      const stream = streams.find(s => s.id === openDropdownId);
                      if (stream) {
                        // TODO: Handle delete stream
                        console.log('Delete stream:', stream);
                      }
                    }
                  }}
                  disabled={activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked}
                  className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {FaTrash({ className: "w-3 h-3 mr-2" })}
                  Delete
                </button>
              </DisabledButtonWithTooltip>
            </PermissionGate>
          </div>
        </div>,
        document.body
      )}

      {/* Add Parent Drawer */}
      {isAddParentDrawerOpen && selectedStudentForParent && (
        <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
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
                  Associate parent with {selectedStudentForParent.fullName || selectedStudentForParent.pupil_name}
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
                  {loadingParents ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-xs text-gray-500">Loading parents...</span>
                    </div>
                  ) : (
                    <div className="relative parent-dropdown-container">
                      <div
                        className={`w-full px-3 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200 bg-gray-50 focus-within:bg-white text-xs cursor-pointer ${
                          getParentFieldError('parent') ? 'border-red-300 focus-within:ring-red-500' : 'border-gray-200'
                        }`}
                        onClick={() => setIsParentDropdownOpen(!isParentDropdownOpen)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={newParentRelationship.parent ? 'text-gray-900' : 'text-gray-500'}>
                            {newParentRelationship.parent 
                              ? parents.find(p => p.id === newParentRelationship.parent)?.full_name + ' (' + parents.find(p => p.id === newParentRelationship.parent)?.relationship + ')'
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
                                      parent: parent.id
                                    }));
                                    setIsParentDropdownOpen(false);
                                    setParentSearchQuery('');
                                    // Clear error when user makes a selection
                                    if (parentFormErrors.parent) {
                                      setParentFormErrors(prev => ({ ...prev, parent: [] }));
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
                  {getParentFieldError('parent') && (
                    <p className="mt-1 text-xs text-red-600">{getParentFieldError('parent')}</p>
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
                        setParentFormErrors(prev => ({ ...prev, relationship_type: [] }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs ${
                      getParentFieldError('relationship_type') ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select relationship</option>
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
                            setParentFormErrors(prev => ({ ...prev, is_primary_contact: [] }));
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
                            setParentFormErrors(prev => ({ ...prev, is_emergency_contact: [] }));
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
                            setParentFormErrors(prev => ({ ...prev, can_pick_up: [] }));
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
                        setParentFormErrors(prev => ({ ...prev, notes: [] }));
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
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={closeAddParentDrawer}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParentSubmit}
                disabled={!newParentRelationship.parent || !newParentRelationship.relationship_type}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Add Parent
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
    </div>
  );
};

export default Students; 