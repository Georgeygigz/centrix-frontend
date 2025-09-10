import { apiService } from './api';
import { 
  AuditLogResponse, 
  AuditLogParams, 
  AuditLogStatsResponse, 
  AuditLogSummaryResponse, 
  MyActivityResponse, 
  RecentLoginsResponse 
} from '../types/audit';

class AuditService {
  /**
   * Get all audit logs with optional filtering and pagination
   */
  async getAuditLogs(params: AuditLogParams = {}): Promise<AuditLogResponse> {
    const queryParams = new URLSearchParams();
    
    // Add all non-empty parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `/audit/logs/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiService.authenticatedRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

  /**
   * Get a specific audit log by ID
   */
  async getAuditLog(id: number) {
    const response = await apiService.authenticatedRequest(`/audit/logs/${id}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(days: number = 30): Promise<AuditLogStatsResponse> {
    const response = await apiService.authenticatedRequest(`/audit/logs/stats/?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

  /**
   * Get audit log summary
   */
  async getAuditLogSummary(days: number = 7): Promise<AuditLogSummaryResponse> {
    const response = await apiService.authenticatedRequest(`/audit/logs/summary/?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

  /**
   * Get current user's activity
   */
  async getMyActivity(days: number = 7): Promise<MyActivityResponse> {
    const response = await apiService.authenticatedRequest(`/audit/my-activity/?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

  /**
   * Get recent logins for current user
   */
  async getRecentLogins(): Promise<RecentLoginsResponse> {
    const response = await apiService.authenticatedRequest('/audit/my-activity/recent_logins/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  }
}

export const auditService = new AuditService();
