// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

// API Service for authentication
export const apiService = {
  // Login endpoint
  login: async (credentials: { email: string; password: string }) => {
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
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },

  // Generic authenticated request
  authenticatedRequest: async (url: string, options: RequestInit = {}) => {
    const headers = apiService.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
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
};

export default apiService;
