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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [newClass, setNewClass] = useState<{
    name: string;
    code: string;
    stream: string;
    description: string;
    level: number;
    capacity: number;
  }>({
    name: '',
    code: '',
    stream: '',
    description: '',
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

  // Load streams data from API
  const loadStreams = useCallback(async () => {
    try {
      setIsLoadingStreams(true);
      const data = await apiService.students.getStreams();
      
      // Handle the response data
      const streamsData = data.results || data || [];
      setStreams(streamsData);
    } catch (error) {
      console.error('Error loading streams:', error);
      setToast({
        message: 'Failed to load streams. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoadingStreams(false);
    }
  }, []);

  // Load classes data from API
  const loadClasses = useCallback(async () => {
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
  }, []);

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
    loadStreams();
  }, [loadStreams]); // Load once when component mounts

  // Load classes data from API
  useEffect(() => {
    loadClasses();
  }, [loadClasses]); // Load once when component mounts

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNewClass({
      name: '',
      code: '',
      stream: '',
      description: '',
      level: 0,
      capacity: 0
    });
  };

  const handleAddStream = async () => {
    try {
      // Create stream via API
      await apiService.students.createStream({
        name: newStream.name || '',
        code: newStream.code || '',
        description: newStream.description || ''
      });
      
      // Re-fetch the streams list to get the updated data
      await loadStreams();
      
      setToast({
        message: 'Stream added successfully!',
        type: 'success'
      });
      
      // Clear form errors
      setFormErrors({});
      
      // Clear the form
      setNewStream({
        name: '',
        code: '',
        description: ''
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
      console.error('Error adding stream:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const transformedErrors: { [key: string]: string[] } = {};
        
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          transformedErrors[key] = value as string[];
        });
        
        setFormErrors(transformedErrors);
      } else {
        setToast({
          message: 'Failed to add stream. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const handleAddClass = async () => {
    try {
      // Create class via API
      await apiService.students.createClass({
        name: newClass.name || '',
        code: newClass.code || '',
        stream: newClass.stream || '',
        description: newClass.description || '',
        level: newClass.level || undefined,
        capacity: newClass.capacity || undefined
      });
      
      // Re-fetch the classes list to get the updated data
      await loadClasses();
      
      setToast({
        message: 'Class added successfully!',
        type: 'success'
      });
      
      // Clear form errors
      setFormErrors({});
      
      // Clear the form
      setNewClass({
        name: '',
        code: '',
        stream: '',
        description: '',
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
      console.error('Error adding class:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const transformedErrors: { [key: string]: string[] } = {};
        
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          transformedErrors[key] = value as string[];
        });
        
        setFormErrors(transformedErrors);
        setToast({
          message: error.response.data.message || 'Please fix the validation errors below.',
          type: 'error'
        });
      } else {
        setEditFormErrors({});
        setToast({
          message: 'Failed to add class. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const handleAddStudent = async () => {
    try {
      const studentData = convertStudentToCreateRequest(newStudent);
      await apiService.students.create(studentData);
      
      // Re-fetch the students list to get the complete data with full class objects
      await loadStudents();
      
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
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setNewClass({
        name: '',
        code: '',
        stream: '',
        description: '',
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

    setEditFormErrors({}); // Clear any previous errors
  };

  const handleEditStream = (stream: Stream) => {
    setEditingStream(stream);
    setOriginalStream({ ...stream }); // Store original data for comparison (deep copy)
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);

    setEditFormErrors({}); // Clear any previous errors
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setOriginalClass({ ...classItem }); // Store original data for comparison (deep copy)
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);

    setEditFormErrors({}); // Clear any previous errors
  };

  // Check if stream has been modified
  const isStreamModified = () => {
    if (!editingStream || !originalStream) return false;
    
    const nameChanged = editingStream.name !== originalStream.name;
    const codeChanged = editingStream.code !== originalStream.code;
    const descriptionChanged = editingStream.description !== originalStream.description;
    
    console.log('Stream modification check:', {
      editingStream: { name: editingStream.name, code: editingStream.code, description: editingStream.description },
      originalStream: { name: originalStream.name, code: originalStream.code, description: originalStream.description },
      changes: { nameChanged, codeChanged, descriptionChanged }
    });
    
    return nameChanged || codeChanged || descriptionChanged;
  };

  // Check if class has been modified
  const isClassModified = () => {
    if (!editingClass || !originalClass) return false;
    
    const nameChanged = editingClass.name !== originalClass.name;
    const codeChanged = editingClass.code !== originalClass.code;
    const streamChanged = (typeof editingClass.stream === 'string' ? editingClass.stream : editingClass.stream?.id) !== 
                         (typeof originalClass.stream === 'string' ? originalClass.stream : originalClass.stream?.id);
    const descriptionChanged = editingClass.description !== originalClass.description;
    const levelChanged = editingClass.level !== originalClass.level;
    const capacityChanged = editingClass.capacity !== originalClass.capacity;
    
    return nameChanged || codeChanged || streamChanged || descriptionChanged || levelChanged || capacityChanged;
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
    } else if (editingStream && originalStream) {
      try {
        // Check if stream has been modified
        if (!isStreamModified()) {
          setToast({
            message: 'No changes detected. Stream information is already up to date.',
            type: 'success'
          });
          closeEditDrawer();
          return;
        }

        // Update stream via API
        const streamId = editingStream.id || originalStream.id;
        if (!streamId) {
          throw new Error('Stream ID is required for update');
        }
        
        // Get only the changed fields for stream
        const streamChangedFields: Partial<Stream> = {};
        if (editingStream.name !== originalStream.name) {
          streamChangedFields.name = editingStream.name;
        }
        if (editingStream.code !== originalStream.code) {
          streamChangedFields.code = editingStream.code;
        }
        if (editingStream.description !== originalStream.description) {
          streamChangedFields.description = editingStream.description;
        }
        
        await apiService.students.updateStream(streamId, streamChangedFields);
        
        // Re-fetch the streams list to get the updated data
        await loadStreams();
        
        // Show success toast
        setToast({
          message: 'Stream updated successfully!',
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
    } else if (editingClass && originalClass) {
      try {
        // Check if class has been modified
        if (!isClassModified()) {
          setToast({
            message: 'No changes detected. Class information is already up to date.',
            type: 'success'
          });
          closeEditDrawer();
          return;
        }

        // Update class via API
        const classId = editingClass.id || originalClass.id;
        if (!classId) {
          throw new Error('Class ID is required for update');
        }
        
        // Get only the changed fields for class
        const apiData: any = {};
        
        if (editingClass.name !== originalClass.name) {
          apiData.name = editingClass.name;
        }
        if (editingClass.code !== originalClass.code) {
          apiData.code = editingClass.code;
        }
        if (editingClass.stream !== originalClass.stream) {
          apiData.stream = typeof editingClass.stream === 'string' ? editingClass.stream : editingClass.stream?.id || '';
        }
        if (editingClass.description !== originalClass.description) {
          apiData.description = editingClass.description;
        }
        
        await apiService.students.updateClass(classId, apiData);
        
        // Re-fetch the classes list to get the updated data
        await loadClasses();
        
        // Show success toast
        setToast({
          message: 'Class updated successfully!',
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
        console.error('Error updating class:', error);
        
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
            message: 'Failed to update class. Please try again.',
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

  const handleStreamInputChange = (field: keyof Stream, value: string) => {
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

  const handleNewClassInputChange = (field: keyof typeof newClass, value: string | number) => {
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

  const handleClassInputChange = (field: keyof Class | 'stream', value: string | number) => {
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
            {/* Feature Status Indicator - Show on admission, classes, and streams tabs */}
            {!featureSwitchLoading && (activeTab === 'admission' || activeTab === 'classes' || activeTab === 'streams') && !isRootUser && isStudentAdmissionBlocked && (
              <div className="mb-3 p-2 rounded-md text-xs font-medium flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-red-700 bg-red-50 px-2 py-1 rounded">
                  <span>🚫</span>
                  <span>
                    {activeTab === 'admission' && 'Student Admission Blocked'}
                    {activeTab === 'classes' && 'Student Admission Blocked - Class Management Affected'}
                    {activeTab === 'streams' && 'Student Admission Blocked - Stream Management Affected'}
                  </span>
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
                    disabled={(activeTab === 'admission' || activeTab === 'classes' || activeTab === 'streams') && !featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked}
                    className={`pl-8 pr-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-xs transition-colors duration-200 ${
                      (activeTab === 'admission' || activeTab === 'classes' || activeTab === 'streams') && !featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked
                        ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {FaSearch({ className: `h-3 w-3 ${(activeTab === 'admission' || activeTab === 'classes' || activeTab === 'streams') && !featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked ? 'text-gray-300' : 'text-gray-400'}` })}
                  </div>
                </div>

                {/* Filter */}
                <button 
                  disabled={(activeTab === 'admission' || activeTab === 'classes' || activeTab === 'streams') && !featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked}
                  className={`px-3 py-1.5 border rounded-md text-xs transition-colors duration-200 ${
                    (activeTab === 'admission' || activeTab === 'classes' || activeTab === 'streams') && !featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked
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
                  disabled={(activeTab === 'admission' || activeTab === 'classes' || activeTab === 'streams') && !featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked}
                  className={`px-3 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${
                    (activeTab === 'admission' || activeTab === 'classes' || activeTab === 'streams') && !featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked
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
                    tooltipMessage={!featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked ? blockMessage : ''}
                    disabled={!featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked}
                    className="inline-block"
                  >
                    <button
                      onClick={openAddDrawer}
                      disabled={!featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked}
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('admissionNumber')}>
                        <div className="flex items-center space-x-1">
                          <span>Admn number</span>
                          {getSortIcon('admissionNumber')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fullName')}>
                        <div className="flex items-center space-x-1">
                          <span>Full name</span>
                          {getSortIcon('fullName')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class')}>
                        <div className="flex items-center space-x-1">
                          <span>Class</span>
                          {getSortIcon('class')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('gender')}>
                        <div className="flex items-center space-x-1">
                          <span>Gender</span>
                          {getSortIcon('gender')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dateOfAdmission')}>
                        <div className="flex items-center space-x-1">
                          <span>Date of admission</span>
                          {getSortIcon('dateOfAdmission')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedStudents.map((student, index) => (
                      <tr key={student.id || `student-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                          {student.admissionNumber}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {student.fullName}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {student.current_class ? 
                            `${student.current_class.name} - ${student.current_class.stream?.name || 'No Stream'}` : 
                            (student.class_on_admission ? 
                              `${student.class_on_admission.name} - ${student.class_on_admission.stream?.name || 'No Stream'}` : 
                              (student.classOnAdmission || student.class || '')
                            )
                          }
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {student.gender}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {student.dateOfAdmission}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
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
            {/* Grey overlay when student admission is blocked */}
            {!featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked && (
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
                  <p className="text-sm font-medium text-gray-900">Class Management Temporarily Unavailable</p>
                  <p className="text-xs text-gray-600 mt-1">{blockMessage}</p>
                </div>
              </div>
            )}
            
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Class Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('code')}>
                        <div className="flex items-center space-x-1">
                          <span>Class Code</span>
                          {getSortIcon('code')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('stream.name')}>
                        <div className="flex items-center space-x-1">
                          <span>Stream</span>
                          {getSortIcon('stream.name')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('level')}>
                        <div className="flex items-center space-x-1">
                          <span>Level</span>
                          {getSortIcon('level')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('capacity')}>
                        <div className="flex items-center space-x-1">
                          <span>Capacity</span>
                          {getSortIcon('capacity')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Created At</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {classes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-xs text-gray-500">
                          No classes found
                        </td>
                      </tr>
                    ) : (
                      classes.map((classItem, index) => (
                        <tr key={classItem.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                            {classItem.name}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                            {classItem.code}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                            {classItem.stream?.name || 'N/A'}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                            {classItem.level || 'N/A'}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                            {classItem.capacity || 'N/A'}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                            {new Date(classItem.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
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
            {/* Grey overlay when student admission is blocked */}
            {!featureSwitchLoading && !isRootUser && isStudentAdmissionBlocked && (
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
                  <p className="text-sm font-medium text-gray-900">Stream Management Temporarily Unavailable</p>
                  <p className="text-xs text-gray-600 mt-1">{blockMessage}</p>
                </div>
              </div>
            )}
            
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Stream Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('code')}>
                        <div className="flex items-center space-x-1">
                          <span>Stream Code</span>
                          {getSortIcon('code')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('description')}>
                        <div className="flex items-center space-x-1">
                          <span>Description</span>
                          {getSortIcon('description')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Created At</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {streams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-xs text-gray-500">
                          No streams found
                        </td>
                      </tr>
                    ) : (
                      streams.map((stream, index) => (
                        <tr key={stream.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                            {stream.name}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                            {stream.code}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                            {stream.description}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                            {new Date(stream.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
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
        <div className="flex items-center justify-between p-3 rounded-lg mt-4 mb-4" style={{ backgroundColor: 'rgb(249,250,251)', position: 'relative', zIndex: 10 }}>
          <div className="text-xs text-gray-600">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalCount}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePreviousPage}
              disabled={!hasPreviousPage || (activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked)}
              className={`px-2.5 py-1 text-xs font-medium border rounded transition-colors duration-200 ${
                activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked
                  ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <span className="px-2.5 py-1 text-xs font-medium text-gray-600">
              Page {currentPage} of {totalPages} ({totalPages > 1 ? `${totalPages} pages` : '1 page'})
            </span>
            <button 
              onClick={handleNextPage}
              disabled={!hasNextPage || (activeTab === 'admission' && !featureSwitchLoading && isStudentAdmissionBlocked)}
              className={`px-2.5 py-1 text-xs font-medium border rounded transition-colors duration-200 ${
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
      {isEditDrawerOpen && (editingStudent || editingClass || editingStream) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeTab === 'admission' && 'Edit Student'}
                  {activeTab === 'classes' && 'Edit Class'}
                  {activeTab === 'streams' && 'Edit Stream'}
                  {activeTab === 'academic' && 'Edit Academic'}
                  {activeTab === 'financial' && 'Edit Financial'}
                  {activeTab === 'attendance' && 'Edit Attendance'}
                </h2>
              </div>
              <button
                onClick={closeEditDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
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

              {/* Student Edit Form */}
              {editingStudent && (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                        Admission Number *
                      </label>
                      <input
                        type="text"
                        value={editingStudent.admissionNumber}
                        onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                        placeholder="Enter admission number"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                          editFormErrors.admissionNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.admissionNumber && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.admissionNumber[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Full Names *
                      </label>
                      <input
                        type="text"
                        value={editingStudent.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Enter full names"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          editFormErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.fullName && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.fullName[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                          Date Of Birth *
                        </label>
                        <input
                          type="date"
                          value={editingStudent.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                            editFormErrors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {editFormErrors.dateOfBirth && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.dateOfBirth[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                          Gender *
                        </label>
                        <select
                          value={editingStudent.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                            editFormErrors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {editFormErrors.gender && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.gender[0]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                        Date Of Admission *
                      </label>
                      <input
                        type="date"
                        value={editingStudent.dateOfAdmission}
                        onChange={(e) => handleInputChange('dateOfAdmission', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                          editFormErrors.dateOfAdmission ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.dateOfAdmission && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.dateOfAdmission[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                          Class On Admission *
                        </label>
                        <select
                          value={editingStudent.classOnAdmission}
                          onChange={(e) => handleInputChange('classOnAdmission', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                            editFormErrors.classOnAdmission ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="">Select a class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} - {cls.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                        {editFormErrors.classOnAdmission && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.classOnAdmission[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                          Current Class
                        </label>
                        <select
                          value={editingStudent.currentClass}
                          onChange={(e) => handleInputChange('currentClass', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                            editFormErrors.currentClass ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="">Select a class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} - {cls.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                        {editFormErrors.currentClass && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.currentClass[0]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                        Last School Attended
                      </label>
                      <input
                        type="text"
                        value={editingStudent.lastSchoolAttended}
                        onChange={(e) => handleInputChange('lastSchoolAttended', e.target.value)}
                        placeholder="Enter last school attended"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white ${
                          editFormErrors.lastSchoolAttended ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.lastSchoolAttended && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.lastSchoolAttended[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Guardian Information */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                          Guardian Name
                        </label>
                        <input
                          type="text"
                          value={editingStudent.guardianName}
                          onChange={(e) => handleInputChange('guardianName', e.target.value)}
                          placeholder="Enter guardian name"
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                            editFormErrors.guardianName ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {editFormErrors.guardianName && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.guardianName[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                          Guardian Phone
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">+254</span>
                          </div>
                          <input
                            type="tel"
                            value={editingStudent.guardianPhone?.replace('+254', '') || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              const phoneWithPrefix = value.startsWith('+254') ? value : `+254${value}`;
                              handleInputChange('guardianPhone', phoneWithPrefix);
                            }}
                            placeholder="700000000"
                            className={`w-full pl-12 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white ${
                              editFormErrors.guardianPhone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                          />
                        </div>
                        {editFormErrors.guardianPhone && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.guardianPhone[0]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                        Guardian Relationship
                      </label>
                      <select
                        value={editingStudent.guardianRelationship}
                        onChange={(e) => handleInputChange('guardianRelationship', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white ${
                          editFormErrors.guardianRelationship ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                      {editFormErrors.guardianRelationship && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.guardianRelationship[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-lime-500 rounded-full mr-1.5"></span>
                        Address
                      </label>
                      <textarea
                        value={editingStudent.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter address"
                        rows={2}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-500 transition-all duration-200 bg-white resize-none ${
                          editFormErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.address && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.address[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>
                          Boarding Status
                        </label>
                        <select
                          value={editingStudent.boardingStatus}
                          onChange={(e) => handleInputChange('boardingStatus', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all duration-200 bg-white ${
                            editFormErrors.boardingStatus ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="Day">Day</option>
                          <option value="Boarding">Boarding</option>
                        </select>
                        {editFormErrors.boardingStatus && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.boardingStatus[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mr-1.5"></span>
                          Birth Certificate No
                        </label>
                        <input
                          type="text"
                          value={editingStudent.birthCertificateNo}
                          onChange={(e) => handleInputChange('birthCertificateNo', e.target.value)}
                          placeholder="Enter birth certificate number"
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500 transition-all duration-200 bg-white ${
                            editFormErrors.birthCertificateNo ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {editFormErrors.birthCertificateNo && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.birthCertificateNo[0]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingStudent.exemptedFromReligiousInstruction}
                          onChange={(e) => handleInputChange('exemptedFromReligiousInstruction', e.target.checked)}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-700">Exempted from Religious Instruction</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-1.5"></span>
                        Remarks
                      </label>
                      <textarea
                        value={editingStudent.remarks}
                        onChange={(e) => handleInputChange('remarks', e.target.value)}
                        placeholder="Enter remarks"
                        rows={2}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 transition-all duration-200 bg-white resize-none ${
                          editFormErrors.remarks ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.remarks && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.remarks[0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Stream Edit Form */}
              {editingStream && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                        Stream Name *
                      </label>
                      <input
                        type="text"
                        value={editingStream.name}
                        onChange={(e) => handleStreamInputChange('name', e.target.value)}
                        placeholder="Enter stream name"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                          editFormErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.name && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.name[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Stream Code *
                      </label>
                      <input
                        type="text"
                        value={editingStream.code}
                        onChange={(e) => handleStreamInputChange('code', e.target.value)}
                        placeholder="Enter stream code"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          editFormErrors.code ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.code && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.code[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                        Description
                      </label>
                      <textarea
                        value={editingStream.description}
                        onChange={(e) => handleStreamInputChange('description', e.target.value)}
                        placeholder="Enter stream description"
                        rows={3}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white resize-none ${
                          editFormErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.description && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.description[0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Class Edit Form */}
              {editingClass && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                        Class Name *
                      </label>
                      <input
                        type="text"
                        value={editingClass.name}
                        onChange={(e) => handleClassInputChange('name', e.target.value)}
                        placeholder="Enter class name"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                          editFormErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.name && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.name[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Class Code *
                      </label>
                      <input
                        type="text"
                        value={editingClass.code}
                        onChange={(e) => handleClassInputChange('code', e.target.value)}
                        placeholder="Enter class code"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          editFormErrors.code ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.code && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.code[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                        Stream *
                      </label>
                      <select
                        value={typeof editingClass.stream === 'string' ? editingClass.stream : editingClass.stream?.id || ''}
                        onChange={(e) => handleClassInputChange('stream', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                          editFormErrors.stream ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select a stream</option>
                        {streams.map((stream) => (
                          <option key={stream.id} value={stream.id}>
                            {stream.name} - {stream.code}
                          </option>
                        ))}
                      </select>
                      {editFormErrors.stream && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.stream[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                        Description
                      </label>
                      <textarea
                        value={editingClass.description}
                        onChange={(e) => handleClassInputChange('description', e.target.value)}
                        placeholder="Enter class description"
                        rows={3}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white resize-none ${
                          editFormErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.description && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.description[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                          Level (Optional)
                        </label>
                        <input
                          type="number"
                          value={editingClass.level || ''}
                          onChange={(e) => handleClassInputChange('level', parseInt(e.target.value) || 0)}
                          placeholder="Enter class level"
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                            editFormErrors.level ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {editFormErrors.level && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.level[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                          Capacity (Optional)
                        </label>
                        <input
                          type="number"
                          value={editingClass.capacity || ''}
                          onChange={(e) => handleClassInputChange('capacity', parseInt(e.target.value) || 0)}
                          placeholder="Enter class capacity"
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                            editFormErrors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {editFormErrors.capacity && (
                          <p className="mt-1 text-xs text-red-600">{editFormErrors.capacity[0]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={closeEditDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudent}
                disabled={
                  (editingStudent && !isStudentModified()) ||
                  (editingClass && !isClassModified()) ||
                  (editingStream && !isStreamModified()) ||
                  false
                }
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                {editingStudent && 'Update Student'}
                {editingStream && 'Update Stream'}
                {editingClass && 'Update Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeTab === 'admission' && 'Add New Student'}
                  {activeTab === 'classes' && 'Add New Class'}
                  {activeTab === 'streams' && 'Add New Stream'}
                  {activeTab === 'academic' && 'Add New Academic'}
                  {activeTab === 'financial' && 'Add New Financial'}
                  {activeTab === 'attendance' && 'Add New Attendance'}
                </h2>
              </div>
              <button
                onClick={closeAddDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
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

              {/* Student Form */}
              {activeTab === 'admission' && (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                        Admission Number *
                      </label>
                      <input
                        type="text"
                        value={newStudent.admissionNumber}
                        onChange={(e) => handleNewStudentInputChange('admissionNumber', e.target.value)}
                        placeholder="Enter admission number"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                          formErrors.admissionNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.admissionNumber && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.admissionNumber[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Full Names *
                      </label>
                      <input
                        type="text"
                        value={newStudent.fullName}
                        onChange={(e) => handleNewStudentInputChange('fullName', e.target.value)}
                        placeholder="Enter full names"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          formErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.fullName && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.fullName[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                          Date Of Birth *
                        </label>
                        <input
                          type="date"
                          value={newStudent.dateOfBirth}
                          onChange={(e) => handleNewStudentInputChange('dateOfBirth', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                            formErrors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {formErrors.dateOfBirth && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.dateOfBirth[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                          Gender *
                        </label>
                        <select
                          value={newStudent.gender}
                          onChange={(e) => handleNewStudentInputChange('gender', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                            formErrors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {formErrors.gender && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.gender[0]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                        Date Of Admission *
                      </label>
                      <input
                        type="date"
                        value={newStudent.dateOfAdmission}
                        onChange={(e) => handleNewStudentInputChange('dateOfAdmission', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                          formErrors.dateOfAdmission ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.dateOfAdmission && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.dateOfAdmission[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                          Class On Admission *
                        </label>
                        <select
                          value={newStudent.classOnAdmission}
                          onChange={(e) => handleNewStudentInputChange('classOnAdmission', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                            formErrors.classOnAdmission ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="">Select a class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} - {cls.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                        {formErrors.classOnAdmission && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.classOnAdmission[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                          Current Class
                        </label>
                        <select
                          value={newStudent.currentClass}
                          onChange={(e) => handleNewStudentInputChange('currentClass', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                            formErrors.currentClass ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="">Select a class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} - {cls.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                        {formErrors.currentClass && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.currentClass[0]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                        Last School Attended
                      </label>
                      <input
                        type="text"
                        value={newStudent.lastSchoolAttended}
                        onChange={(e) => handleNewStudentInputChange('lastSchoolAttended', e.target.value)}
                        placeholder="Enter last school attended"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white ${
                          formErrors.lastSchoolAttended ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.lastSchoolAttended && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.lastSchoolAttended[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Guardian Information */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                          Guardian Name
                        </label>
                        <input
                          type="text"
                          value={newStudent.guardianName}
                          onChange={(e) => handleNewStudentInputChange('guardianName', e.target.value)}
                          placeholder="Enter guardian name"
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                            formErrors.guardianName ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {formErrors.guardianName && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.guardianName[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                          Guardian Phone
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">+254</span>
                          </div>
                          <input
                            type="tel"
                            value={newStudent.guardianPhone?.replace('+254', '') || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              const phoneWithPrefix = value.startsWith('+254') ? value : `+254${value}`;
                              handleNewStudentInputChange('guardianPhone', phoneWithPrefix);
                            }}
                            placeholder="700000000"
                            className={`w-full pl-12 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white ${
                              formErrors.guardianPhone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                          />
                        </div>
                        {formErrors.guardianPhone && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.guardianPhone[0]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                        Guardian Relationship
                      </label>
                      <select
                        value={newStudent.guardianRelationship}
                        onChange={(e) => handleNewStudentInputChange('guardianRelationship', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white ${
                          formErrors.guardianRelationship ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                      {formErrors.guardianRelationship && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.guardianRelationship[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-lime-500 rounded-full mr-1.5"></span>
                        Address
                      </label>
                      <textarea
                        value={newStudent.address}
                        onChange={(e) => handleNewStudentInputChange('address', e.target.value)}
                        placeholder="Enter address"
                        rows={2}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-500 transition-all duration-200 bg-white resize-none ${
                          formErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.address && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.address[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>
                          Boarding Status
                        </label>
                        <select
                          value={newStudent.boardingStatus}
                          onChange={(e) => handleNewStudentInputChange('boardingStatus', e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all duration-200 bg-white ${
                            formErrors.boardingStatus ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="Day">Day</option>
                          <option value="Boarding">Boarding</option>
                        </select>
                        {formErrors.boardingStatus && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.boardingStatus[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mr-1.5"></span>
                          Birth Certificate No
                        </label>
                        <input
                          type="text"
                          value={newStudent.birthCertificateNo}
                          onChange={(e) => handleNewStudentInputChange('birthCertificateNo', e.target.value)}
                          placeholder="Enter birth certificate number"
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500 transition-all duration-200 bg-white ${
                            formErrors.birthCertificateNo ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {formErrors.birthCertificateNo && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.birthCertificateNo[0]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newStudent.exemptedFromReligiousInstruction}
                          onChange={(e) => handleNewStudentInputChange('exemptedFromReligiousInstruction', e.target.checked)}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-700">Exempted from Religious Instruction</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-1.5"></span>
                        Remarks
                      </label>
                      <textarea
                        value={newStudent.remarks}
                        onChange={(e) => handleNewStudentInputChange('remarks', e.target.value)}
                        placeholder="Enter remarks"
                        rows={2}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 transition-all duration-200 bg-white resize-none ${
                          formErrors.remarks ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.remarks && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.remarks[0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Stream Form */}
              {activeTab === 'streams' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                        Stream Name *
                      </label>
                      <input
                        type="text"
                        value={newStream.name}
                        onChange={(e) => handleNewStreamInputChange('name', e.target.value)}
                        placeholder="Enter stream name"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                          formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.name[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Stream Code *
                      </label>
                      <input
                        type="text"
                        value={newStream.code}
                        onChange={(e) => handleNewStreamInputChange('code', e.target.value)}
                        placeholder="Enter stream code"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          formErrors.code ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.code && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.code[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                        Description
                      </label>
                      <textarea
                        value={newStream.description}
                        onChange={(e) => handleNewStreamInputChange('description', e.target.value)}
                        placeholder="Enter stream description"
                        rows={3}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white resize-none ${
                          formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.description && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.description[0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Class Form */}
              {activeTab === 'classes' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                        Class Name *
                      </label>
                      <input
                        type="text"
                        value={newClass.name}
                        onChange={(e) => handleNewClassInputChange('name', e.target.value)}
                        placeholder="Enter class name"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                          formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.name[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Class Code *
                      </label>
                      <input
                        type="text"
                        value={newClass.code}
                        onChange={(e) => handleNewClassInputChange('code', e.target.value)}
                        placeholder="Enter class code"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          formErrors.code ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.code && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.code[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                        Stream *
                      </label>
                      <select
                        value={newClass.stream || ''}
                        onChange={(e) => handleNewClassInputChange('stream', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                          formErrors.stream ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select a stream</option>
                        {streams.map((stream) => (
                          <option key={stream.id} value={stream.id}>
                            {stream.name} - {stream.code}
                          </option>
                        ))}
                      </select>
                      {formErrors.stream && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.stream[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                        Description
                      </label>
                      <textarea
                        value={newClass.description}
                        onChange={(e) => handleNewClassInputChange('description', e.target.value)}
                        placeholder="Enter class description"
                        rows={3}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white resize-none ${
                          formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.description && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.description[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                          Level (Optional)
                        </label>
                        <input
                          type="number"
                          value={newClass.level || ''}
                          onChange={(e) => handleNewClassInputChange('level', parseInt(e.target.value) || 0)}
                          placeholder="Enter class level"
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                            formErrors.level ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {formErrors.level && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.level[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                          Capacity (Optional)
                        </label>
                        <input
                          type="number"
                          value={newClass.capacity || ''}
                          onChange={(e) => handleNewClassInputChange('capacity', parseInt(e.target.value) || 0)}
                          placeholder="Enter class capacity"
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                            formErrors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        {formErrors.capacity && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.capacity[0]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={closeAddDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={
                  activeTab === 'admission' ? handleAddStudent :
                  activeTab === 'streams' ? handleAddStream :
                  activeTab === 'classes' ? handleAddClass :
                  handleAddStudent
                }
                disabled={
                  activeTab === 'admission' ? (
                    !newStudent.admissionNumber || 
                    !newStudent.fullName || 
                    !newStudent.dateOfBirth || 
                    !newStudent.gender ||
                    !newStudent.dateOfAdmission ||
                    !newStudent.classOnAdmission
                  ) : activeTab === 'streams' ? (
                    !newStream.name || !newStream.code
                  ) : activeTab === 'classes' ? (
                    !newClass.name || !newClass.code || !newClass.stream
                  ) : false
                }
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                {activeTab === 'admission' && 'Create Student'}
                {activeTab === 'streams' && 'Create Stream'}
                {activeTab === 'classes' && 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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