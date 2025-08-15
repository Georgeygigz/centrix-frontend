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
  alternative_contact?: string;
  last_school_attended?: string;
  boarding_status?: string;
  exempted_from_religious_instruction?: boolean;
  date_of_leaving?: string;
  is_current_student?: boolean;
  created_at?: string;
}

export interface DashboardState {
  currentPage: string;
  sidebarCollapsed: boolean;
} 