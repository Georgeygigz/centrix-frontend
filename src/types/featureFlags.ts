// Feature Flag Types
export interface FeatureFlag {
  id: string;
  name: string;
  display_name: string;
  description: string;
  feature_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields that might come from the backend
  key?: string;
  value?: boolean;
  environment?: string;
  tenant_id?: string;
  created_by?: string;
  updated_by?: string;
}

export interface FeatureFlagState {
  id: string;
  feature_flag: string;
  feature_flag_name: string;
  feature_flag_display_name: string;
  scope_type: string;
  scope_id: string | null;
  school_name: string | null;
  username: string | null;
  is_enabled: boolean;
  percentage: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagResponse {
  status: 'success' | 'error';
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: FeatureFlag[];
  };
  message?: string;
}

export interface FeatureFlagStateResponse {
  status: 'success' | 'error';
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: FeatureFlagState[];
  };
  message?: string;
}

export interface CreateFeatureFlagRequest {
  name: string;
  display_name: string;
  description: string;
  feature_type: string;
  is_active: boolean;
  key?: string;
  value?: boolean;
  environment?: string;
}

export interface UpdateFeatureFlagRequest extends Partial<CreateFeatureFlagRequest> {
  id: string;
}

export interface CreateFeatureFlagStateRequest {
  feature_flag: string;
  scope_type: string;
  scope_id: string | null;
  is_enabled: boolean;
  percentage: number;
  start_date: string | null;
  end_date: string | null;
}

export interface UpdateFeatureFlagStateRequest extends Partial<CreateFeatureFlagStateRequest> {
  id: string;
}
