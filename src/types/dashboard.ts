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
  admissionNumber: string;
  fullName: string;
  class: string;
  gender: string;
  dateOfBirth: string;
  parentName: string;
  contactInfo: string;
  address: string;
  dateOfAdmission: string;
}

export interface DashboardState {
  currentPage: string;
  sidebarCollapsed: boolean;
} 