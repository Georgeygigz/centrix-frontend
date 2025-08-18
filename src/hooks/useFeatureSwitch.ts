import { useState, useEffect, useCallback } from 'react';
import { featureSwitchService, StudentAdmissionDetailedStatus } from '../services/featureSwitch';
import { useAuth } from '../context/AuthContext';

export interface UseFeatureSwitchReturn {
  // Student admission feature status
  studentAdmissionDetailedStatus: StudentAdmissionDetailedStatus | null;
  isStudentAdmissionBlocked: boolean;
  isBillingBlocked: boolean;
  isMaintenanceBlocked: boolean;
  blockMessage: string;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshStatus: () => Promise<void>;
}

export const useFeatureSwitch = (): UseFeatureSwitchReturn => {
  const { user } = useAuth();
  const [studentAdmissionDetailedStatus, setStudentAdmissionDetailedStatus] = useState<StudentAdmissionDetailedStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is root (exempt from all feature restrictions)
  const isRootUser = user?.role === 'root';

  const loadStudentAdmissionStatus = useCallback(async () => {
    // If user is root, bypass all feature restrictions
    if (isRootUser) {
      setStudentAdmissionDetailedStatus({
        detailed_status: {
          billing_status: [],
          maintenance_status: [],
          combined_status: {
            is_enabled: false, // Root users are never blocked
            billing_blocked: false,
            maintenance_blocked: false,
            billing_status: {
              is_enabled: false,
              message: 'Root user - billing restrictions bypassed'
            },
            maintenance_status: {
              is_enabled: false,
              message: 'Root user - maintenance restrictions bypassed'
            },
            message: 'Root user - all features enabled'
          }
        }
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const status = await featureSwitchService.getStudentAdmissionDetailedStatus();
      setStudentAdmissionDetailedStatus(status);
    } catch (err) {
      console.error('Error loading student admission detailed status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feature status');
      
      // Set default status if there's an error
      setStudentAdmissionDetailedStatus({
        detailed_status: {
          billing_status: [],
          maintenance_status: [],
          combined_status: {
            is_enabled: false, // Default to not blocked if there's an error
            billing_blocked: false,
            maintenance_blocked: false,
            billing_status: {
              is_enabled: false,
              message: 'Feature is active'
            },
            maintenance_status: {
              is_enabled: false,
              message: 'Feature is active'
            },
            message: 'Unable to determine feature status'
          }
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [isRootUser]);

  const refreshStatus = useCallback(async () => {
    await loadStudentAdmissionStatus();
  }, [loadStudentAdmissionStatus]);

  // Load status on mount
  useEffect(() => {
    loadStudentAdmissionStatus();
  }, [loadStudentAdmissionStatus]);

  // Computed values - root users are never blocked
  const combinedStatus = studentAdmissionDetailedStatus?.detailed_status?.combined_status;
  const isStudentAdmissionBlocked = isRootUser ? false : (combinedStatus?.is_enabled || false);
  const isBillingBlocked = isRootUser ? false : (combinedStatus?.billing_blocked || false);
  const isMaintenanceBlocked = isRootUser ? false : (combinedStatus?.maintenance_blocked || false);
  const blockMessage = isRootUser ? 'Root user - all features enabled' : (combinedStatus?.message || '');



  return {
    studentAdmissionDetailedStatus,
    isStudentAdmissionBlocked,
    isBillingBlocked,
    isMaintenanceBlocked,
    blockMessage,
    isLoading,
    error,
    refreshStatus
  };
};
