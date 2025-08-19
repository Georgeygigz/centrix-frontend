import { IconType } from 'react-icons';

export interface NavigationItem {
  id: string;
  label: string;
  icon: IconType;
  href?: string;
  children?: NavigationItem[];
}

export interface Student {
  id?: string;
  // Basic Info (Required)
  admissionNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  dateOfAdmission?: string;
  
  // Academic Info (Required)
  classOnAdmission?: string;
  
  // Parent Info (Partial optional)
  guardianName?: string;
  guardianContact?: string;
  alternativeContact?: string;
  
  // Others (Optional)
  address?: string;
  lastSchoolAttended?: string;
  boardingStatus?: string;
  exemptedFromReligiousInstruction?: boolean;
  dateOfLeaving?: string;
  
  // Legacy fields for backward compatibility
  class?: string;
  parentName?: string;
  contactInfo?: string;
  
  // API Response fields (snake_case)
  admission_number?: string;
  pupil_name?: string;
  date_of_birth?: string;
  date_of_admission?: string;
  class_on_admission?: string;
  guardian_name?: string;
  guardian_contact?: string;
  last_school_attended?: string;
  boarding_status?: string;
  exempted_from_religious_instruction?: boolean;
  date_of_leaving?: string;
  is_current_student?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted?: boolean;
  contact_1?: string;
  contact_2?: string;
  image?: string;
  school_leaving_certificate_number?: string;
  remarks?: string;
}

export interface CreateStudentRequest {
  // Required fields for student creation
  admission_number: string;
  pupil_name: string;
  date_of_birth: string;
  gender: string;
  date_of_admission: string;
  class_on_admission: string;
  
  // Optional fields
  guardian_name?: string;
  contact_1?: string;
  contact_2?: string;
  address?: string;
  last_school_attended?: string;
  boarding_status?: string;
  exempted_from_religious_instruction?: boolean;
  date_of_leaving?: string;
  school_leaving_certificate_number?: string;
  remarks?: string;
}

export interface DashboardState {
  currentPage: string;
  sidebarCollapsed: boolean;
} 

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
  number_of_students?: number; // This will be calculated/added for display purposes
}

export interface SchoolsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: School[];
}

export interface CreateSchoolRequest {
  name: string;
  slug: string;
  subdomain: string;
  domain?: string;
  address?: string;
  phone?: string;
  email: string;
  website?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  is_active?: boolean;
  max_students?: number;
  primary_color?: string;
  secondary_color?: string;
} 