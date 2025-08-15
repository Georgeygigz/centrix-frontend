export interface LoginCredentials {
  email: string;
  password: string;
  school_id?: string; // Optional school ID for multi-tenant login
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  confirmPassword: string;
  school_id?: string; // Optional school ID for multi-tenant registration
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  is_pin_set: boolean;
  school_id: string; // School ID for multi-tenant support
  school_name?: string; // School name for display
  role?: string; // User role in the school
}

export interface LoginResponse {
  email: string;
  token: string;
  is_pin_set: boolean;
  school_id?: string;
  school_name?: string;
  role?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
} 