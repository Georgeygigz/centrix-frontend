export interface FeeStructure {
  id: string;
  name: string;
  fee_type: 'tuition' | 'development' | 'library' | 'laboratory' | 'sports' | 'transport' | 'hostel' | 'exam' | 'miscellaneous' | 'fine' | 'discount';
  category: 'academic' | 'non_academic' | 'fine' | 'discount';
  description?: string;
  amount: string;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'termly' | 'yearly' | 'custom';
  applicable_class?: string | null;
  applicable_stream?: string | null;
  applicable_to_all: boolean;
  is_active: boolean;
  is_discount: boolean;
  discount_percentage: string;
  max_discount_amount?: string | null;
  due_date: number;
  late_fee_applicable: boolean;
  late_fee_amount: string;
  late_fee_percentage: string;
  class_details?: any | null;
  created_at: string;
  updated_at: string;
}

export interface StudentFeeAssignment {
  id: string;
  student: string;
  fee_structure: string;
  academic_year: string;
  term: number;
  custom_amount?: string | null;
  is_waived: boolean;
  waiver_reason?: string;
  is_active: boolean;
}

export interface CreateFeeAssignmentRequest {
  academic_year: string;
  fee_structure: string;
  student: string;
  term: number;
  custom_amount?: string | null;
  is_waived: boolean;
  waiver_reason?: string;
  is_active: boolean;
}

export interface FeeAssignment {
  id: string;
  student_details: Student;
  fee_structure_details: FeeStructure;
  academic_year: string;
  term: number;
  custom_amount?: string | null;
  is_waived: boolean;
  waiver_reason?: string;
  is_active: boolean;
  start_date: string;
  end_date?: string | null;
  school: string;
  student: string; // Student ID
  fee_structure: string; // Fee structure ID
  waiver_approved_by?: string | null;
  approved_by_details?: any | null;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

export interface FeeAssignmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeeAssignment[];
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Student {
  id: string;
  admission_number: string;
  pupil_name: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_relationship: string;
  date_of_admission: string;
  date_of_birth: string;
  gender: string;
  class_on_admission: {
    id: string;
    name: string;
    code: string;
    stream: {
      id: string;
      name: string;
      code: string;
      description: string;
    };
  };
  current_class: {
    id: string;
    name: string;
    code: string;
    stream: {
      id: string;
      name: string;
      code: string;
      description: string;
    };
  };
  is_current_student: boolean;
}

export interface StudentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Student[];
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FeeInvoiceItem {
  id: string;
  fee_structure_details: {
    id: string;
    class_details: {
      id: string;
      name: string;
      level: any;
    };
    created_at: string;
    updated_at: string;
    deleted: boolean;
    name: string;
    fee_type: string;
    category: string;
    description: string;
    applicable_to_all: boolean;
    amount: string;
    frequency: string;
    is_active: boolean;
    is_discount: boolean;
    discount_percentage: string;
    max_discount_amount: string | null;
    due_date: number;
    late_fee_applicable: boolean;
    late_fee_amount: string;
    late_fee_percentage: string;
    school: string;
    applicable_class: string;
    applicable_stream: string;
  };
  created_at: string;
  updated_at: string;
  deleted: boolean;
  base_amount: string;
  discount_amount: string;
  waiver_amount: string;
  late_fee_amount: string;
  net_amount: string;
  is_waived: boolean;
  school: string;
  invoice: string;
  fee_assignment: string;
  fee_structure: string;
}

export interface FeeInvoice {
  id: string;
  student_details: Student;
  items: FeeInvoiceItem[];
  payments: any[];
  status_display: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  invoice_number: string;
  academic_year: string;
  term: number;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  total_amount: string;
  total_discount: string;
  total_waiver: string;
  total_late_fee: string;
  net_amount: string;
  amount_paid: string;
  balance_due: string;
  status: 'draft' | 'generated' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  is_overdue: boolean;
  notes: string;
  pdf_document: string | null;
  school: string;
  student: string;
}

export interface FeeInvoicesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeeInvoice[];
  page: number;
  page_size: number;
  total_pages: number;
}

export interface InvoiceQueryParams {
  ordering?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface FeePayment {
  id: string;
  student_details: Student;
  invoice_details: {
    id: string;
    invoice_number: string;
    total_amount: string;
    balance_due: string;
    status: string;
  };
  collected_by_details: {
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
  };
  verified_by_details?: {
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
  };
  method_display: string;
  status_display: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  payment_date: string;
  amount: string;
  method: 'cash' | 'cheque' | 'bank_transfer' | 'mobile_money' | 'card' | 'online';
  reference_number: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'reversed';
  bank_name?: string;
  branch_name?: string;
  cheque_number?: string;
  transaction_id: string;
  verification_date?: string;
  notes?: string;
  receipt_number: string;
  school: string;
  invoice: string;
  student: string;
  collected_by: string;
  verified_by?: string;
}

export interface CreatePaymentRequest {
  amount: string;
  invoice: string;
  method: 'cash' | 'cheque' | 'bank_transfer' | 'mobile_money' | 'card' | 'online';
  reference_number: string;
  student: string;
  payment_date: string;
  bank_name?: string;
  branch_name?: string;
  cheque_number?: string;
  transaction_id: string;
  verification_date: string;
  notes?: string;
}

export interface FeePaymentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeePayment[];
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaymentQueryParams {
  ordering?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface FeeConcession {
  id: string;
  student: string;
  concession_type: string;
  description: string;
  discount_percentage?: string;
  fixed_amount?: string;
  is_active: boolean;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  fee_type?: string;
  category?: string;
  is_active?: boolean;
  applicable_class?: string;
  applicable_stream?: string;
}

export interface FeeStructureResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeeStructure[];
}

export interface GenerateTermInvoicesRequest {
  academic_year: string;
  term: number;
  due_date_days: number;
}

export interface GenerateTermInvoicesResponse {
  message: string;
  invoices_generated: number;
  total_amount: string;
  academic_year: string;
  term: number;
  due_date: string;
  generated_invoices: string[]; // Array of invoice IDs
}
