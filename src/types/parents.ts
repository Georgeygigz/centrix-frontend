export interface Parent {
  id: string;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface CreateParentRequest {
  first_name: string;
  last_name: string;
  title: string;
  relationship: string;
  email: string;
  phone: string;
  phone_alt?: string;
  address?: string;
  occupation?: string;
}

export interface UpdateParentRequest {
  first_name?: string;
  last_name?: string;
  title?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  phone_alt?: string;
  address?: string;
  occupation?: string;
}

export interface ParentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Parent[];
}

export interface ParentsApiResponse {
  data: ParentsResponse;
  status: string;
}

export interface ParentQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  relationship?: string;
  ordering?: string;
}

export interface ParentStudentRelationship {
  id: string;
  student: string;
  parent: string;
  parent_details: {
    id: string;
    first_name: string;
    last_name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  student_details: {
    id: string;
    pupil_name: string;
    admission_number: string;
    current_class: string;
  };
  relationship_type: string;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  can_pick_up: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ParentStudentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ParentStudentRelationship[];
}

export interface ParentStudentsApiResponse {
  data: ParentStudentsResponse;
  status: string;
}

export interface StudentParentRelationship {
  id: string;
  student: string;
  parent: string;
  parent_details: {
    id: string;
    first_name: string;
    last_name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  student_details: {
    id: string;
    pupil_name: string;
    admission_number: string;
    current_class: string;
  };
  relationship_type: string;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  can_pick_up: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StudentParentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentParentRelationship[];
}

export interface StudentParentsApiResponse {
  data: StudentParentsResponse;
  status: string;
}
