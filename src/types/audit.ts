export interface UserDetails {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface SchoolDetails {
  id: number;
  name: string;
  code: string;
}

export interface AuditLogDetails {
  model?: string;
  changes?: Record<string, any>;
  new_values?: Record<string, any>;
  [key: string]: any;
}

export interface AuditLog {
  id: number;
  user_details: UserDetails | null;
  school_details: SchoolDetails | null;
  user_ip: string;
  user_agent: string;
  content_type: string;
  object_id: string;
  content_object: string;
  content_object_repr: string;
  action: string;
  level: string;
  http_method: string;
  url: string;
  status_code: number;
  message: string;
  details: AuditLogDetails;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

export interface AuditLogParams {
  user?: string;
  action?: string;
  level?: string;
  content_type?: string;
  object_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface AuditLogStats {
  total_entries: number;
  action_stats: Array<{
    action: string;
    count: number;
  }>;
  user_stats: Array<{
    user__username: string;
    count: number;
  }>;
  daily_stats: Array<{
    day: string;
    count: number;
  }>;
  time_period: string;
}

export interface AuditLogStatsResponse {
  data: AuditLogStats;
}

export interface AuditLogSummary {
  date: string;
  user_details: UserDetails;
  action: string;
  count: number;
}

export interface AuditLogSummaryResponse {
  data: AuditLogSummary[];
}

export interface MyActivityResponse {
  data: {
    activities: AuditLog[];
    summary: {
      total_activities: number;
      action_breakdown: Array<{
        action: string;
        count: number;
      }>;
      time_period: string;
    };
  };
}

export interface RecentLogin {
  id: number;
  action: string;
  level: string;
  message: string;
  timestamp: string;
  user_ip: string;
  user_agent: string;
  url: string;
}

export interface RecentLoginsResponse {
  data: RecentLogin[];
}

// Action types for filtering
export const ACTION_TYPES = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'view', label: 'View' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'download', label: 'Download' },
  { value: 'export', label: 'Export' },
  { value: 'import', label: 'Import' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'other', label: 'Other' },
] as const;

// Security levels for filtering
export const SECURITY_LEVELS = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'critical', label: 'Critical' },
] as const;

// Content types for filtering
export const CONTENT_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'user', label: 'User' },
  { value: 'school', label: 'School' },
  { value: 'fee', label: 'Fee' },
  { value: 'payment', label: 'Payment' },
  { value: 'class', label: 'Class' },
  { value: 'stream', label: 'Stream' },
  { value: 'parent', label: 'Parent' },
] as const;
