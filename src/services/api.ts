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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    return data;
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Request failed');
    }

    return response.json();
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch schools');
      }

      return response.json();
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to detect school');
      }

      return response.json();
    },

    // Get school by ID
    getById: async (schoolId: string) => {
      const response = await fetch(`${API_BASE_URL}/schools/${schoolId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch school');
      }

      return response.json();
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
    create: async (studentData: any) => {
      return apiService.authenticatedRequest('/students', {
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

export default apiService;
