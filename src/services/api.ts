import { Student, CreateStudentRequest } from '../types/dashboard';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';



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
    const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
    
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
      return responseData.data;
    }
    
    // Fallback for legacy responses
    return responseData;
  },



  // School-specific API calls
  schools: {
    // Get all schools
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/schools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch schools');
      }

      if (responseData.status === 'error') {
        throw new Error(responseData.message || 'Failed to fetch schools');
      }
      
      if (responseData.status === 'success') {
        return responseData.data;
      }
      
      return responseData;
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
  },

  // Students API
  students: {
    // Get all students for current school
    getAll: async () => {
      return apiService.authenticatedRequest('/students/admissions', { method: 'GET' });
    },

    // Get student by ID
    getById: async (studentId: string) => {
      return apiService.authenticatedRequest(`/students/${studentId}`, { method: 'GET' });
    },

    // Create new student
    create: async (studentData: CreateStudentRequest) => {
      return apiService.authenticatedRequest('/students/admissions', {
        method: 'POST',
        body: JSON.stringify(studentData),
      });
    },

    // Update student
    update: async (studentId: string, studentData: any) => {
      return apiService.authenticatedRequest(`/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(studentData),
      });
    },

    // Delete student
    delete: async (studentId: string) => {
      return apiService.authenticatedRequest(`/students/${studentId}`, { method: 'DELETE' });
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
  },
};

// Utility function to convert Student to CreateStudentRequest
export const convertStudentToCreateRequest = (student: Partial<Student>): CreateStudentRequest => {
  return {
    admission_number: student.admissionNumber || student.admission_number || '',
    pupil_name: student.fullName || student.pupil_name || '',
    date_of_birth: student.dateOfBirth || student.date_of_birth || '',
    gender: student.gender || '',
    date_of_admission: student.dateOfAdmission || student.date_of_admission || '',
    class_on_admission: student.classOnAdmission || student.class_on_admission || student.class || '',
    guardian_name: student.guardianName || student.guardian_name || student.parentName || '',
    contact_1: student.guardianContact || student.guardian_contact || student.contactInfo || '',
    address: student.address || '',
    last_school_attended: student.lastSchoolAttended || student.last_school_attended || '',
    boarding_status: student.boardingStatus || student.boarding_status || '',
    exempted_from_religious_instruction: student.exemptedFromReligiousInstruction || student.exempted_from_religious_instruction || false,
  };
};

export default apiService;
