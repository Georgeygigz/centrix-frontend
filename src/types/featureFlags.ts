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
