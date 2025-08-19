export interface School {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  domain: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
  timezone: string;
  language: string;
  currency: string;
  is_active: boolean;
  max_students: number;
  academic_year_start: string | null;
  academic_year_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  surname: string;
  phone_number: string;
  image: string;
  is_active: boolean;
  is_staff: boolean;
  is_email_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  school: School;
  school_id?: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  surname?: string;
  phone_number?: string;
  role?: string;
  is_active?: boolean;
  is_staff?: boolean;
}

export interface UsersResponse {
  users: User[];
  total_count: number;
  user_role: string;
  school_id: string;
  school_name: string;
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface ApiResponse {
  data: UsersResponse;
  status: string;
}
