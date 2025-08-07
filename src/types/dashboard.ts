export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  hasSubItems?: boolean;
  subItems?: NavigationItem[];
}

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  class: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  parentName: string;
  contactInfo: string;
  address: string;
  dateOfAdmission: string;
}

export interface DashboardState {
  currentPage: string;
  searchQuery: string;
  sortBy: string;
  filterBy: string;
} 