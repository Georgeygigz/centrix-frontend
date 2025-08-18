import { apiService } from './api';

// Types for student admission feature status
export interface FeatureStatusItem {
  feature_name: string;
  is_enabled: boolean;
  scope_type: string;
  scope_id: string | null;
  percentage: number;
  start_date: string | null;
  end_date: string | null;
  message: string;
}

export interface CombinedStatus {
  is_enabled: boolean;
  billing_blocked: boolean;
  maintenance_blocked: boolean;
  billing_status: {
    is_enabled: boolean;
    message: string;
  };
  maintenance_status: {
    is_enabled: boolean;
    message: string;
  };
  message: string;
}

export interface DetailedStatus {
  billing_status: FeatureStatusItem[];
  maintenance_status: FeatureStatusItem[];
  combined_status: CombinedStatus;
}

export interface StudentAdmissionDetailedStatus {
  detailed_status: DetailedStatus;
}

export interface FeatureCheckResponse {
  feature_name: string;
  is_enabled: boolean;
  scope_type: string;
  scope_id: string | null;
  percentage: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  message: string;
}

export interface BulkFeatureCheckResponse {
  results: {
    [key: string]: FeatureCheckResponse;
  };
}

class FeatureSwitchService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';
  }

  /**
   * Check a single feature flag
   */
  async checkFeature(
    featureName: string, 
    scopeType: string = 'global', 
    scopeId: string | null = null
  ): Promise<FeatureCheckResponse> {
    try {
      const response = await apiService.authenticatedRequest('/switch/check/', {
        method: 'POST',
        body: JSON.stringify({
          feature_name: featureName,
          scope_type: scopeType,
          scope_id: scopeId
        }),
      });

      return response.data;
    } catch (error) {
      console.error(`Error checking feature ${featureName}:`, error);
      throw error;
    }
  }

  /**
   * Check multiple feature flags in bulk
   */
  async checkFeaturesBulk(
    featureNames: string[], 
    scopeType: string = 'global', 
    scopeId: string | null = null
  ): Promise<BulkFeatureCheckResponse> {
    try {
      const response = await apiService.authenticatedRequest('/switch/check/bulk/', {
        method: 'POST',
        body: JSON.stringify({
          features: featureNames,
          scope_type: scopeType,
          scope_id: scopeId
        }),
      });

      return response.data;
    } catch (error) {
      console.error('Error checking features in bulk:', error);
      throw error;
    }
  }

  /**
   * Get student admission detailed feature status
   * This is a specialized endpoint for student admission features
   */
  async getStudentAdmissionDetailedStatus(): Promise<StudentAdmissionDetailedStatus> {
    try {
      const response = await apiService.authenticatedRequest('/students/features/detailed-status', {
        method: 'GET',
      });

      // Handle different possible response structures
      if (response.data) {
        return response.data;
      } else if (response.detailed_status) {
        return { detailed_status: response.detailed_status };
      } else {
        console.error('Unexpected response structure:', response);
        throw new Error('Unexpected response structure from API');
      }
    } catch (error) {
      console.error('Error getting student admission detailed status:', error);
      throw error;
    }
  }

  /**
   * Check if student admission is blocked by any feature flags
   */
  async isStudentAdmissionBlocked(userRole?: string): Promise<{
    isBlocked: boolean;
    billingBlocked: boolean;
    maintenanceBlocked: boolean;
    message: string;
  }> {
    // Root users are never blocked
    if (userRole === 'root') {
      return {
        isBlocked: false,
        billingBlocked: false,
        maintenanceBlocked: false,
        message: 'Root user - all features enabled'
      };
    }

    try {
      const detailedStatus = await this.getStudentAdmissionDetailedStatus();
      const combinedStatus = detailedStatus.detailed_status.combined_status;
      
      return {
        isBlocked: combinedStatus.is_enabled, // When is_enabled = true, feature is blocked
        billingBlocked: combinedStatus.billing_blocked,
        maintenanceBlocked: combinedStatus.maintenance_blocked,
        message: combinedStatus.message
      };
    } catch (error) {
      console.error('Error checking if student admission is blocked:', error);
      // Default to not blocked if there's an error
      return {
        isBlocked: false,
        billingBlocked: false,
        maintenanceBlocked: false,
        message: 'Unable to determine feature status'
      };
    }
  }

  /**
   * Check specific student admission features
   */
  async checkStudentAdmissionFeatures(): Promise<{
    billing: FeatureCheckResponse;
    maintenance: FeatureCheckResponse;
  }> {
    try {
      const response = await this.checkFeaturesBulk([
        'student_admission_billing',
        'student_admission_maintenance'
      ]);

      return {
        billing: response.results.student_admission_billing,
        maintenance: response.results.student_admission_maintenance
      };
    } catch (error) {
      console.error('Error checking student admission features:', error);
      throw error;
    }
  }

  /**
   * Get all feature flags
   */
  async getFeatureFlags(featureType?: string, isActive?: boolean): Promise<any> {
    try {
      let url = '/switch/flags/';
      const params = new URLSearchParams();
      
      if (featureType) {
        params.append('feature_type', featureType);
      }
      if (isActive !== undefined) {
        params.append('is_active', isActive.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiService.authenticatedRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      throw error;
    }
  }

  /**
   * Get all feature flag states
   */
  async getFeatureFlagStates(featureFlag?: string, scopeType?: string, scopeId?: string): Promise<any> {
    try {
      let url = '/switch/states/';
      const params = new URLSearchParams();
      
      if (featureFlag) {
        params.append('feature_flag', featureFlag);
      }
      if (scopeType) {
        params.append('scope_type', scopeType);
      }
      if (scopeId) {
        params.append('scope_id', scopeId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiService.authenticatedRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching feature flag states:', error);
      throw error;
    }
  }

  /**
   * Get student admission specific feature flags and states
   */
  async getStudentAdmissionFeatureData(): Promise<{
    flags: any;
    states: any;
  }> {
    try {
      const [flagsResponse, statesResponse] = await Promise.all([
        this.getFeatureFlags(),
        this.getFeatureFlagStates()
      ]);

      // Filter for student admission related features
      const studentAdmissionFlags = flagsResponse.data?.results?.filter((flag: any) => 
        flag.name.includes('student_admission')
      ) || [];

      const studentAdmissionStates = statesResponse.data?.results?.filter((state: any) => 
        state.feature_flag_name?.includes('student_admission')
      ) || [];

      return {
        flags: studentAdmissionFlags,
        states: studentAdmissionStates
      };
    } catch (error) {
      console.error('Error fetching student admission feature data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const featureSwitchService = new FeatureSwitchService();
