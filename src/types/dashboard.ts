import { IconType } from 'react-icons';

export interface NavigationItem {
  id: string;
  label: string;
  icon: IconType;
  href?: string;
  children?: NavigationItem[];
}

export interface Student {
  id: string;
  // Basic Info (Required)
  admissionNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  dateOfAdmission: string;
  
  // Academic Info (Required)
  classOnAdmission: string;
  
  // Parent Info (Partial optional)
  guardianName: string;
  guardianContact: string;
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
}

export interface DashboardState {
  currentPage: string;
  sidebarCollapsed: boolean;
} 