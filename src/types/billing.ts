// Billing Plan Types
export interface BillingPlan {
  id: string;
  name: string;
  plan_type: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  features: BillingPlanFeature[];
  created_at: string;
  updated_at: string;
}

export interface BillingPlanFeature {
  id: string;
  plan: string;
  feature: string;
  included_quantity: number;
  price_per_unit: string;
  overage_price_per_unit: string;
  feature_details: BillingFeature;
  created_at: string;
  updated_at: string;
}

export interface BillingFeature {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface BillingPlansResponse {
  data?: {
    count: number;
    next: string | null;
    previous: string | null;
    results: BillingPlan[];
  };
  status?: string;
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: BillingPlan[];
}

export interface BillingFeaturesResponse {
  data?: {
    count: number;
    next: string | null;
    previous: string | null;
    results: BillingFeature[];
  };
  status?: string;
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: BillingFeature[];
}

export interface SchoolSubscription {
  id: string;
  school: string;
  plan: string;
  custom_plan_name: string;
  interval: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  student_count: number;
  base_price: string;
  custom_price: string;
  discount_percent: string;
  pricing_option: string;
  notes: string;
  plan_details: BillingPlan;
  school_details: {
    id: string;
    name: string;
    domain: string;
    email: string;
    phone: string;
    max_students: number;
  };
  created_at: string;
  updated_at: string;
}

export interface SchoolSubscriptionsResponse {
  data?: {
    count: number;
    next: string | null;
    previous: string | null;
    results: SchoolSubscription[];
  };
  status?: string;
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: SchoolSubscription[];
}

// Dashboard Types
export interface BillingDashboardStats {
  revenue: {
    currentMonth: number;
    lastMonth: number;
    percentageChange: number;
    currency: string;
  };
  subscriptions: {
    totalActive: number;
    newThisMonth: number;
    byPlanType: Array<{
      planType: string;
      count: number;
      percentage: number;
    }>;
  };
  payments: {
    totalOutstanding: number;
    overdueInvoices: number;
    successRate: number;
  };
  schoolActivity: {
    schoolsWithOverduePayments: number;
    recentPayments: Array<{
      id: string;
      schoolName: string;
      amount: number;
      status: string;
      date: string;
    }>;
    schoolsRequiringAttention: Array<{
      id: string;
      name: string;
      currentPlan: string;
      subscriptionStatus: string;
      lastPaymentDate: string;
      outstandingAmount: number;
      requiresAttention: boolean;
    }>;
  };
}

// Additional types for billing service
export interface BillingDashboardResponse {
  success: boolean;
  data: BillingDashboardStats;
}

export interface SchoolsBillingResponse {
  success: boolean;
  data: any[];
}

// Invoice Types
export interface Invoice {
  id: string;
  school: string;
  subscription: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoicesResponse {
  data?: {
    count: number;
    next: string | null;
    previous: string | null;
    results: Invoice[];
  };
  status?: string;
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Invoice[];
}
