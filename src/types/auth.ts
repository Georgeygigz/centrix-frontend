export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  is_pin_set: boolean;
}

export interface LoginResponse {
  data: {
    email: string;
    token: string;
    is_pin_set: boolean;
  };
  status: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
} 