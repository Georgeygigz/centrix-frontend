import React from 'react';
import { useFeatureSwitch } from '../../hooks/useFeatureSwitch';
import { featureSwitchService } from '../../services/featureSwitch';
import { useAuth } from '../../context/AuthContext';

const FeatureSwitchTest: React.FC = () => {
  const { user } = useAuth();
  const {
    studentAdmissionDetailedStatus,
    isStudentAdmissionBlocked,
    isBillingBlocked,
    isMaintenanceBlocked,
    blockMessage,
    isLoading,
    error,
    refreshStatus
  } = useFeatureSwitch();

  const isRootUser = user?.role === 'root';

  const testFeatureCheck = async () => {
    try {
      const result = await featureSwitchService.checkFeature('student_admission_billing');
    } catch (error) {
      console.error('Feature check error:', error);
    }
  };

  const testBulkFeatureCheck = async () => {
    try {
      const result = await featureSwitchService.checkFeaturesBulk([
        'student_admission_billing',
        'student_admission_maintenance'
      ]);
    } catch (error) {
      console.error('Bulk feature check error:', error);
    }
  };

  const testGetFeatureFlags = async () => {
    try {
      const result = await featureSwitchService.getFeatureFlags();
    } catch (error) {
      console.error('Get feature flags error:', error);
    }
  };

  const testGetFeatureFlagStates = async () => {
    try {
      const result = await featureSwitchService.getFeatureFlagStates();
    } catch (error) {
      console.error('Get feature flag states error:', error);
    }
  };

  const testGetStudentAdmissionFeatureData = async () => {
    try {
      const result = await featureSwitchService.getStudentAdmissionFeatureData();
    } catch (error) {
      console.error('Get student admission feature data error:', error);
    }
  };

  const testGetDetailedStatus = async () => {
    try {
      const result = await featureSwitchService.getStudentAdmissionDetailedStatus();
    } catch (error) {
      console.error('Get detailed status error:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Feature Switch Test</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Status</h3>
          <div className="text-sm space-y-1">
            <p>User Role: <span className={`font-medium ${isRootUser ? 'text-green-600' : 'text-gray-600'}`}>
              {user?.role || 'Unknown'}
            </span></p>
            <p>Root User: <span className={`font-medium ${isRootUser ? 'text-green-600' : 'text-red-600'}`}>
              {isRootUser ? 'Yes' : 'No'}
            </span></p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
            <p>Student Admission Blocked: {isStudentAdmissionBlocked ? 'Yes' : 'No'}</p>
            <p>Billing Blocked: {isBillingBlocked ? 'Yes' : 'No'}</p>
            <p>Maintenance Blocked: {isMaintenanceBlocked ? 'Yes' : 'No'}</p>
            <p>Block Message: {blockMessage || 'None'}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Raw Status Data</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(studentAdmissionDetailedStatus, null, 2)}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshStatus}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Refresh Status
            </button>
            <button
              onClick={testFeatureCheck}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Test Single Feature Check
            </button>
            <button
              onClick={testBulkFeatureCheck}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Test Bulk Feature Check
            </button>
            <button
              onClick={testGetFeatureFlags}
              className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
            >
              Get Feature Flags
            </button>
            <button
              onClick={testGetFeatureFlagStates}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Get Feature Flag States
            </button>
            <button
              onClick={testGetStudentAdmissionFeatureData}
              className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
            >
              Get Student Admission Data
            </button>
            <button
              onClick={testGetDetailedStatus}
              className="px-3 py-1 bg-teal-500 text-white rounded text-sm hover:bg-teal-600"
            >
              Test Detailed Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureSwitchTest;
