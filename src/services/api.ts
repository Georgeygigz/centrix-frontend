import { Student, CreateStudentRequest, CreateSchoolRequest, Class, Stream, StudentQueryParams } from '../types/dashboard';
import { CreateFeatureFlagRequest, UpdateFeatureFlagRequest, CreateFeatureFlagStateRequest, UpdateFeatureFlagStateRequest } from '../types/featureFlags';
import { UpdateUserRequest, PaginationParams } from '../types/users';
import { CreateParentRequest, UpdateParentRequest, ParentQueryParams, AssociateParentRequest } from '../types/parents';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';



// API Service for authentication and tenant-aware requests
export const apiService = {
  // Login endpoint with tenant support
  login: async (credentials: { email: string; password: string; school_id?: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(responseData.message || 'Login failed');
    }

    if (responseData.status === 'error') {
      throw new Error(responseData.message || 'Login failed');
    }
    
    if (responseData.status === 'success') {
      return responseData.data;
    }
    
    return responseData;
  },

  // Get current user details
  getCurrentUser: async () => {
    return apiService.authenticatedRequest('/users/me', { method: 'GET' });
  },

  // Get stored token
  getToken: (): string | null => {
    return sessionStorage.getItem('authToken');
  },

  // Set token in session storage
  setToken: (token: string): void => {
    sessionStorage.setItem('authToken', token);
  },

  // Remove token from session storage
  removeToken: (): void => {
    sessionStorage.removeItem('authToken');
  },



  // Create authenticated request headers
  getAuthHeaders: (): HeadersInit => {
    const token = apiService.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  },

  // Generic authenticated request
  authenticatedRequest: async (url: string, options: RequestInit = {}) => {
    const headers = apiService.getAuthHeaders();
    
    // Ensure proper URL construction (avoid double slashes)
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const fullUrl = `${baseUrl}/${cleanUrl}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Get the response data once
    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      // Create a custom error that preserves the full response data
      const error = new Error(responseData.message || 'Request failed');
      (error as any).response = { data: responseData };
      throw error;
    }

    // For successful responses, handle the data directly
    if (responseData.status === 'error') {
      // Create a custom error that preserves the full response data
      const error = new Error(responseData.message || 'Request failed');
      (error as any).response = { data: responseData };
      throw error;
    }
    
    if (responseData.status === 'success') {
      // For most endpoints, return the data directly
      // For feature flag endpoints, return the full response
      if (url.includes('/switch/')) {
        return responseData;
      }
      return responseData.data;
    }
    
    // Fallback for legacy responses
    return responseData;
  },



  // School-specific API calls
  schools: {
    // Get all schools with pagination support
    getAll: async (page: number = 1, pageSize: number = 20, search?: string, ordering?: string) => {
      let url = `/schools?page=${page}&page_size=${pageSize}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (ordering) {
        url += `&ordering=${encodeURIComponent(ordering)}`;
      }
      return apiService.authenticatedRequest(url, { method: 'GET' });
    },

    // Detect school by identifier
    detect: async (identifier: string) => {
      const response = await fetch(`${API_BASE_URL}/schools/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to detect school');
      }

      if (responseData.status === 'error') {
        throw new Error(responseData.message || 'Failed to detect school');
      }
      
      if (responseData.status === 'success') {
        return responseData.data;
      }
      
      return responseData;
    },

    // Get school by ID
    getById: async (schoolId: string) => {
      const response = await fetch(`${API_BASE_URL}/schools/${schoolId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch school');
      }

      if (responseData.status === 'error') {
        throw new Error(responseData.message || 'Failed to fetch school');
      }
      
      if (responseData.status === 'success') {
        return responseData.data;
      }
      
      return responseData;
    },

    // Create new school
    create: async (schoolData: CreateSchoolRequest) => {
      return apiService.authenticatedRequest('/schools/create', {
        method: 'POST',
        body: JSON.stringify(schoolData),
      });
    },
  },

  // Students API
  students: {
    // Get all students for current school with pagination and filtering support
    getAll: async (params: StudentQueryParams = {}) => {
      const {
        page = 1,
        page_size = 20,
        search,
        admission_year,
        boarding_status,
        class_on_admission,
        current_only,
        exempted_from_religious_instruction,
        gender,
        max_age,
        min_age,
        ordering
      } = params;

      let url = `/students/admissions?page=${page}&page_size=${page_size}`;
      
      // Add search parameter
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      // Add filtering parameters
      if (admission_year !== undefined) {
        url += `&admission_year=${admission_year}`;
      }
      if (boarding_status) {
        url += `&boarding_status=${encodeURIComponent(boarding_status)}`;
      }
      if (class_on_admission) {
        url += `&class_on_admission=${encodeURIComponent(class_on_admission)}`;
      }
      if (current_only) {
        url += `&current_only=${encodeURIComponent(current_only)}`;
      }
      if (exempted_from_religious_instruction !== undefined) {
        url += `&exempted_from_religious_instruction=${exempted_from_religious_instruction}`;
      }
      if (gender) {
        url += `&gender=${encodeURIComponent(gender)}`;
      }
      if (max_age !== undefined) {
        url += `&max_age=${max_age}`;
      }
      if (min_age !== undefined) {
        url += `&min_age=${min_age}`;
      }
      
      // Add ordering parameter
      if (ordering) {
        url += `&ordering=${encodeURIComponent(ordering)}`;
      }
      
      return apiService.authenticatedRequest(url, { method: 'GET' });
    },

    // Get student by ID
    getById: async (studentId: string) => {
      return apiService.authenticatedRequest(`/students/admissions/${studentId}`, { method: 'GET' });
    },

    // Create new student
    create: async (studentData: CreateStudentRequest) => {
      return apiService.authenticatedRequest('/students/admissions', {
        method: 'POST',
        body: JSON.stringify(studentData),
      });
    },

    // Update student by ID
    update: async (studentId: string, studentData: any) => {
      return apiService.authenticatedRequest(`/students/admissions/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(studentData),
      });
    },

    // Delete student by ID
    delete: async (studentId: string) => {
      return apiService.authenticatedRequest(`/students/admissions/${studentId}`, { method: 'DELETE' });
    },

    // Bulk operations
    bulkCreate: async (studentsData: any[]) => {
      return apiService.authenticatedRequest('/students/bulk-create', {
        method: 'POST',
        body: JSON.stringify({ students: studentsData }),
      });
    },

    bulkUpdate: async (studentsData: any[]) => {
      return apiService.authenticatedRequest('/students/bulk-update', {
        method: 'PUT',
        body: JSON.stringify({ students: studentsData }),
      });
    },

    bulkDelete: async (studentIds: string[]) => {
      return apiService.authenticatedRequest('/students/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ student_ids: studentIds }),
      });
    },

    // Get statistics
    getStats: async () => {
      return apiService.authenticatedRequest('/students/statistics', { method: 'GET' });
    },

    // Get student admission detailed feature status
    getDetailedFeatureStatus: async () => {
      return apiService.authenticatedRequest('/students/features/detailed-status', { method: 'GET' });
    },

    // Get all streams
    getStreams: async () => {
      return apiService.authenticatedRequest('/students/streams/', { method: 'GET' });
    },

    // Create a new stream
    createStream: async (streamData: { name: string; code: string; description?: string }) => {
      return apiService.authenticatedRequest('/students/streams/', {
        method: 'POST',
        body: JSON.stringify(streamData)
      });
    },

    // Create a new class
    createClass: async (classData: { name: string; code: string; stream: string; description?: string; level?: number; capacity?: number }) => {
      // Transform stream to stream_id for API compatibility
      const apiData: any = {
        ...classData,
        stream_id: classData.stream,
        stream: undefined // Remove the stream field to avoid confusion
      };
      
      return apiService.authenticatedRequest('/students/classes/', {
        method: 'POST',
        body: JSON.stringify(apiData)
      });
    },

    // Get all classes
    getClasses: async () => {
      return apiService.authenticatedRequest('/students/classes/', { method: 'GET' });
    },

    // Update a class
    updateClass: async (id: string, classData: Partial<Class> & { stream?: string }) => {
      // Transform stream to stream_id for API compatibility
      const apiData: any = { ...classData };
      if (classData.stream) {
        apiData.stream_id = classData.stream;
        delete apiData.stream;
      }
      
      return apiService.authenticatedRequest(`/students/classes/${id}/`, { 
        method: 'PUT',
        body: JSON.stringify(apiData)
      });
    },

    // Update a stream
    updateStream: async (id: string, streamData: Partial<Stream>) => {
      return apiService.authenticatedRequest(`/students/streams/${id}/`, { 
        method: 'PUT',
        body: JSON.stringify(streamData)
      });
    },

    // Delete a stream
    deleteStream: async (id: string) => {
      return apiService.authenticatedRequest(`/students/streams/${id}/`, { 
        method: 'DELETE'
      });
    },

    // Delete a class
    deleteClass: async (id: string) => {
      return apiService.authenticatedRequest(`/students/classes/${id}/`, { 
        method: 'DELETE'
      });
    },

    // Associate a parent with a student
    associateParent: async (studentId: string, parentData: AssociateParentRequest) => {
      return apiService.authenticatedRequest(`/students/admissions/${studentId}/parents`, {
        method: 'POST',
        body: JSON.stringify(parentData),
      });
    },
    getParents: async (studentId: string) => {
      return apiService.authenticatedRequest(`/students/admissions/${studentId}/parents`, {
        method: 'GET',
      });
    },
    disassociateParent: async (studentId: string, relationshipId: string) => {
      return apiService.authenticatedRequest(`/students/admissions/${studentId}/parents/${relationshipId}`, {
        method: 'DELETE',
      });
    },
  },

  // Feature Flags API
  featureFlags: {
    // Get all feature flags
    getAll: async () => {
      const headers = apiService.getAuthHeaders();
      const fullUrl = `${API_BASE_URL}/switch/flags/`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          ...headers,
        },
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const error = new Error(responseData.message || 'Request failed');
        (error as any).response = { data: responseData };
        throw error;
      }

      if (responseData.status === 'error') {
        const error = new Error(responseData.message || 'Request failed');
        (error as any).response = { data: responseData };
        throw error;
      }
      
      // Return the full response for feature flags
      return responseData;
    },

    // Get feature flag by ID
    getById: async (flagId: string) => {
      return apiService.authenticatedRequest(`/switch/flags/${flagId}/`, { method: 'GET' });
    },

    // Check single feature
    checkFeature: async (featureName: string, scopeType: string = 'global', scopeId: string | null = null) => {
      return apiService.authenticatedRequest('/switch/check', {
        method: 'POST',
        body: JSON.stringify({
          feature_name: featureName,
          scope_type: scopeType,
          scope_id: scopeId
        }),
      });
    },

    // Check multiple features in bulk
    checkFeaturesBulk: async (featureNames: string[], scopeType: string = 'global', scopeId: string | null = null) => {
      return apiService.authenticatedRequest('/switch/check/bulk', {
        method: 'POST',
        body: JSON.stringify({
          features: featureNames,
          scope_type: scopeType,
          scope_id: scopeId
        }),
      });
    },

    // Get all feature flag states
    getFeatureFlagStates: async (featureFlag?: string, scopeType?: string, scopeId?: string) => {
      let url = '/switch/states/';
      const params = new URLSearchParams();
      
      if (featureFlag) {
        params.append('feature_flag', featureFlag);
      }
      if (scopeType) {
        params.append('scope_type', scopeType);
      }
      if (scopeId) {
        params.append('scope_id', scopeId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      return apiService.authenticatedRequest(url, { method: 'GET' });
    },

    // Create new feature flag
    create: async (flagData: CreateFeatureFlagRequest) => {
      return apiService.authenticatedRequest('/switch/flags/', {
        method: 'POST',
        body: JSON.stringify(flagData),
      });
    },

    // Update feature flag by ID
    update: async (flagId: string, flagData: Partial<UpdateFeatureFlagRequest>) => {
      return apiService.authenticatedRequest(`/switch/flags/${flagId}/`, {
        method: 'PUT',
        body: JSON.stringify(flagData),
      });
    },

    // Delete feature flag by ID
    delete: async (flagId: string) => {
      return apiService.authenticatedRequest(`/switch/flags/${flagId}/`, { method: 'DELETE' });
    },

    // Toggle feature flag status
    toggle: async (flagId: string) => {
      return apiService.authenticatedRequest(`/switch/flags/${flagId}/toggle`, { method: 'POST' });
    },
  },

  // Feature Flag States API
  featureFlagStates: {
    // Get all feature flag states
    getAll: async () => {
      const headers = apiService.getAuthHeaders();
      const fullUrl = `${API_BASE_URL}/switch/states/`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          ...headers,
        },
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const error = new Error(responseData.message || 'Request failed');
        (error as any).response = { data: responseData };
        throw error;
      }

      if (responseData.status === 'error') {
        const error = new Error(responseData.message || 'Request failed');
        (error as any).response = { data: responseData };
        throw error;
      }
      
      // Return the full response for feature flag states
      return responseData;
    },

    // Get feature flag state by ID
    getById: async (stateId: string) => {
      return apiService.authenticatedRequest(`/switch/states/${stateId}/`, { method: 'GET' });
    },

    // Create new feature flag state
    create: async (stateData: CreateFeatureFlagStateRequest) => {
      return apiService.authenticatedRequest('/switch/states/', {
        method: 'POST',
        body: JSON.stringify(stateData),
      });
    },

    // Update feature flag state by ID
    update: async (stateId: string, stateData: Partial<UpdateFeatureFlagStateRequest>) => {
      return apiService.authenticatedRequest(`/switch/states/${stateId}/`, {
        method: 'PUT',
        body: JSON.stringify(stateData),
      });
    },

    // Delete feature flag state by ID
    delete: async (stateId: string) => {
      return apiService.authenticatedRequest(`/switch/states/${stateId}/`, { method: 'DELETE' });
    },
  },

  // Users API
  users: {
    // Get all users with pagination
    getAll: async (params?: PaginationParams) => {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params?.sort_direction) queryParams.append('sort_direction', params.sort_direction);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/users/?${queryString}` : '/users/';
      
      return apiService.authenticatedRequest(url, { method: 'GET' });
    },

    // Get user by ID
    getById: async (userId: string) => {
      return apiService.authenticatedRequest(`/users/${userId}`, { method: 'GET' });
    },

    // Create new user
    create: async (userData: any) => {
      return apiService.authenticatedRequest('/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    // Register new user (signup)
    signup: async (userData: any) => {
      return apiService.authenticatedRequest('/users/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    // Update user by ID
    update: async (userId: string, userData: UpdateUserRequest) => {
      return apiService.authenticatedRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },

    // Delete user by ID
    delete: async (userId: string) => {
      return apiService.authenticatedRequest(`/users/${userId}`, { method: 'DELETE' });
    },

    // Reset user password
    resetPassword: async (userId: string, password: string) => {
      return apiService.authenticatedRequest(`/users/password/reset/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    },

    // Sign in as another user
    signinAs: async (userId: string) => {
      return apiService.authenticatedRequest(`/users/signin-as`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
    },
  },

  // Parents API
  parents: {
    // Get all parents with pagination and filtering
    getAll: async (params?: ParentQueryParams) => {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.relationship) queryParams.append('relationship', params.relationship);
      if (params?.ordering) queryParams.append('ordering', params.ordering);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/parents/?${queryString}` : '/parents/';
      
      return apiService.authenticatedRequest(url, { method: 'GET' });
    },

    // Get parent by ID
    getById: async (parentId: string) => {
      return apiService.authenticatedRequest(`/parents/${parentId}`, { method: 'GET' });
    },

    // Create new parent
    create: async (parentData: CreateParentRequest) => {
      return apiService.authenticatedRequest('/parents/', {
        method: 'POST',
        body: JSON.stringify(parentData),
      });
    },

    // Update parent by ID
    update: async (parentId: string, parentData: UpdateParentRequest) => {
      return apiService.authenticatedRequest(`/parents/${parentId}`, {
        method: 'PUT',
        body: JSON.stringify(parentData),
      });
    },

    // Delete parent by ID
    delete: async (parentId: string) => {
      return apiService.authenticatedRequest(`/parents/${parentId}`, { method: 'DELETE' });
    },

    // Get students for a specific parent
    getStudents: async (parentId: string) => {
      return apiService.authenticatedRequest(`/students/parents/${parentId}/students`, { method: 'GET' });
    },

    // Generate parent login credentials
    generateLoginCredentials: async (parentId: string) => {
      return apiService.authenticatedRequest('/users/register/parent', {
        method: 'POST',
        body: JSON.stringify({ parent_id: parentId }),
      });
    },

    // Reset parent password
    resetPassword: async (parentId: string, password: string) => {
      return apiService.authenticatedRequest(`/users/password/reset/${parentId}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    },
  },
};

// Utility function to convert Student to CreateStudentRequest
export const convertStudentToCreateRequest = (student: Partial<Student>): CreateStudentRequest => {
  return {
    admission_number: student.admissionNumber || student.admission_number || '',
    pupil_name: student.fullName || student.pupil_name || '',
    date_of_birth: student.dateOfBirth || student.date_of_birth || '',
    gender: student.gender || 'M',
    date_of_admission: student.dateOfAdmission || student.date_of_admission || '',
    class_on_admission_id: student.classOnAdmission || student.class_on_admission_id || student.class || '',
    current_class_id: student.currentClass || student.current_class_id || '',
    guardian_name: student.guardianName || student.guardian_name || student.parentName || '',
    guardian_phone: student.guardianPhone || student.guardian_phone || '',
    guardian_relationship: student.guardianRelationship || student.guardian_relationship || '',
    nemis_number: student.nemisNumber || student.nemis_number || '',
    assessment_number: student.assessmentNumber || student.assessment_number || '',
    has_special_need: student.hasSpecialNeed || student.has_special_need || false,
    special_need: student.specialNeed || '',
    preferred_hospital: student.preferredHospital || student.preferred_hospital || '',
    health_info: student.healthInfo || student.health_info || '',
    address: student.address || '',
    last_school_attended: student.lastSchoolAttended || student.last_school_attended || '',
    boarding_status: student.boardingStatus || student.boarding_status || 'Day',
    exempted_from_religious_instruction: student.exemptedFromReligiousInstruction || student.exempted_from_religious_instruction || false,
    birth_certificate_no: student.birthCertificateNo || student.birth_certificate_no || '',
    image: student.image || '',
    date_of_leaving: student.dateOfLeaving || student.date_of_leaving || '',
    school_leaving_certificate_number: student.schoolLeavingCertificateNumber || student.school_leaving_certificate_number || '',
    remarks: student.remarks || '',
  };
};

// Utility function to get only changed fields between original and edited student
export const getChangedFields = (originalStudent: Student, editedStudent: Student): Partial<CreateStudentRequest> => {
  const changes: Partial<CreateStudentRequest> = {};
  
  // Helper function to normalize field values for comparison
  const normalizeValue = (value: any): any => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };
  
  // Compare each field and only include changed ones
  if (normalizeValue(originalStudent.fullName || originalStudent.pupil_name) !== normalizeValue(editedStudent.fullName)) {
    changes.pupil_name = editedStudent.fullName || '';
  }
  
  if (normalizeValue(originalStudent.dateOfBirth || originalStudent.date_of_birth) !== normalizeValue(editedStudent.dateOfBirth)) {
    changes.date_of_birth = editedStudent.dateOfBirth || '';
  }
  
  if (normalizeValue(originalStudent.gender) !== normalizeValue(editedStudent.gender)) {
    changes.gender = editedStudent.gender || '';
  }
  
  if (normalizeValue(originalStudent.dateOfAdmission || originalStudent.date_of_admission) !== normalizeValue(editedStudent.dateOfAdmission)) {
    changes.date_of_admission = editedStudent.dateOfAdmission || '';
  }
  
  if (normalizeValue(originalStudent.classOnAdmission || originalStudent.class_on_admission_id || originalStudent.class) !== normalizeValue(editedStudent.classOnAdmission)) {
    changes.class_on_admission_id = editedStudent.classOnAdmission || '';
  }
  
  if (normalizeValue(originalStudent.currentClass || originalStudent.current_class_id) !== normalizeValue(editedStudent.currentClass)) {
    changes.current_class_id = editedStudent.currentClass || '';
  }
  
  if (normalizeValue(originalStudent.guardianName || originalStudent.guardian_name || originalStudent.parentName) !== normalizeValue(editedStudent.guardianName)) {
    changes.guardian_name = editedStudent.guardianName || '';
  }
  
  if (normalizeValue(originalStudent.guardianPhone || originalStudent.guardian_phone) !== normalizeValue(editedStudent.guardianPhone)) {
    changes.guardian_phone = editedStudent.guardianPhone || '';
  }
  
  if (normalizeValue(originalStudent.guardianRelationship || originalStudent.guardian_relationship) !== normalizeValue(editedStudent.guardianRelationship)) {
    changes.guardian_relationship = editedStudent.guardianRelationship || '';
  }
  
  if (normalizeValue(originalStudent.nemisNumber || originalStudent.nemis_number) !== normalizeValue(editedStudent.nemisNumber)) {
    changes.nemis_number = editedStudent.nemisNumber || '';
  }
  
  if (normalizeValue(originalStudent.assessmentNumber || originalStudent.assessment_number) !== normalizeValue(editedStudent.assessmentNumber)) {
    changes.assessment_number = editedStudent.assessmentNumber || '';
  }
  
  if (originalStudent.hasSpecialNeed !== editedStudent.hasSpecialNeed) {
    changes.has_special_need = editedStudent.hasSpecialNeed || false;
  }
  
  if (normalizeValue(originalStudent.specialNeed) !== normalizeValue(editedStudent.specialNeed)) {
    changes.special_need = editedStudent.specialNeed || '';
  }
  
  if (normalizeValue(originalStudent.preferredHospital || originalStudent.preferred_hospital) !== normalizeValue(editedStudent.preferredHospital)) {
    changes.preferred_hospital = editedStudent.preferredHospital || '';
  }
  
  if (normalizeValue(originalStudent.healthInfo || originalStudent.health_info) !== normalizeValue(editedStudent.healthInfo)) {
    changes.health_info = editedStudent.healthInfo || '';
  }
  
  if (normalizeValue(originalStudent.address) !== normalizeValue(editedStudent.address)) {
    changes.address = editedStudent.address || '';
  }
  
  if (normalizeValue(originalStudent.lastSchoolAttended || originalStudent.last_school_attended) !== normalizeValue(editedStudent.lastSchoolAttended)) {
    changes.last_school_attended = editedStudent.lastSchoolAttended || '';
  }
  
  if (normalizeValue(originalStudent.boardingStatus || originalStudent.boarding_status) !== normalizeValue(editedStudent.boardingStatus)) {
    changes.boarding_status = editedStudent.boardingStatus || '';
  }
  
  if (originalStudent.exemptedFromReligiousInstruction !== editedStudent.exemptedFromReligiousInstruction) {
    changes.exempted_from_religious_instruction = editedStudent.exemptedFromReligiousInstruction || false;
  }
  
  if (normalizeValue(originalStudent.birthCertificateNo || originalStudent.birth_certificate_no) !== normalizeValue(editedStudent.birthCertificateNo)) {
    changes.birth_certificate_no = editedStudent.birthCertificateNo || '';
  }
  
  if (normalizeValue(originalStudent.dateOfLeaving || originalStudent.date_of_leaving) !== normalizeValue(editedStudent.dateOfLeaving)) {
    changes.date_of_leaving = editedStudent.dateOfLeaving || '';
  }
  
  if (normalizeValue(originalStudent.school_leaving_certificate_number) !== normalizeValue(editedStudent.school_leaving_certificate_number)) {
    changes.school_leaving_certificate_number = editedStudent.school_leaving_certificate_number || '';
  }
  
  if (normalizeValue(originalStudent.remarks) !== normalizeValue(editedStudent.remarks)) {
    changes.remarks = editedStudent.remarks || '';
  }
  
  return changes;
};

export default apiService;
