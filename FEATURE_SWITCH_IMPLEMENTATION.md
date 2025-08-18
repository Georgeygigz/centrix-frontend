# 🚀 Feature Switch Implementation - Frontend

## 📋 Overview

This document describes the implementation of feature switching for student admission functionality in the Centrix frontend. The implementation follows the architecture outlined in the comprehensive guide and provides a complete solution for controlling student admission features based on billing and maintenance status.

## 🏗️ Architecture

### Components Structure

```
src/
├── services/
│   ├── featureSwitch.ts          # Feature switch service
│   └── api.ts                    # API service (updated)
├── hooks/
│   └── useFeatureSwitch.ts       # Custom hook for feature state
├── components/
│   ├── Students/
│   │   ├── Students.tsx          # Main students component (updated)
│   │   ├── StudentAdmissionBlocked.tsx  # Blocked state component
│   │   └── DisabledButtonWithTooltip.tsx # Tooltip component
│   └── Debug/
│       └── FeatureSwitchTest.tsx # Debug component for testing
└── types/
    └── featureFlags.ts           # Type definitions
```

## 🔧 Implementation Details

### 1. Feature Switch Service (`src/services/featureSwitch.ts`)

The feature switch service provides methods to interact with the backend feature switch API:

#### Key Methods:
- `checkFeature()` - Check a single feature flag
- `checkFeaturesBulk()` - Check multiple feature flags
- `getStudentAdmissionStatus()` - Get student admission feature status
- `isStudentAdmissionBlocked()` - Check if student admission is blocked

#### Usage:
```typescript
import { featureSwitchService } from '../services/featureSwitch';

// Check student admission status
const status = await featureSwitchService.getStudentAdmissionStatus();

// Check if blocked
const { isBlocked, billingBlocked, maintenanceBlocked, message } = 
  await featureSwitchService.isStudentAdmissionBlocked();
```

### 2. Custom Hook (`src/hooks/useFeatureSwitch.ts`)

The custom hook manages feature switch state and provides a clean interface for components:

#### Features:
- Automatic loading of student admission status
- Error handling with fallback states
- Loading states
- Refresh functionality

#### Usage:
```typescript
import { useFeatureSwitch } from '../hooks/useFeatureSwitch';

const MyComponent = () => {
  const {
    isStudentAdmissionBlocked,
    isBillingBlocked,
    isMaintenanceBlocked,
    blockMessage,
    isLoading,
    error,
    refreshStatus
  } = useFeatureSwitch();

  // Use the values in your component
};
```

### 3. UI Components

#### StudentAdmissionBlocked Component
Displays when student admission is completely blocked (maintenance mode):

- Shows appropriate icons and messages based on block type
- Provides action buttons for user guidance
- Handles loading states

#### DisabledButtonWithTooltip Component
Provides disabled buttons with tooltips when billing is blocked:

- Shows tooltip with block message on hover
- Disables button functionality
- Maintains visual consistency

### 4. Integration with Students Component

The main Students component has been updated to:

#### Feature Status Integration:
- Uses `useFeatureSwitch` hook to get feature status
- Shows blocked component when admission is completely blocked
- Disables buttons with tooltips when billing is blocked
- Shows feature status indicators in header

#### Conditional Rendering:
```typescript
{isStudentAdmissionBlocked ? (
  <StudentAdmissionBlocked
    isBillingBlocked={isBillingBlocked}
    isMaintenanceBlocked={isMaintenanceBlocked}
    blockMessage={blockMessage}
    isLoading={featureSwitchLoading}
  />
) : (
  // Normal student admission UI
)}
```

#### Button Disabling:
```typescript
<DisabledButtonWithTooltip
  tooltipMessage={isBillingBlocked ? blockMessage : ''}
  disabled={isBillingBlocked}
>
  <button onClick={openAddDrawer} disabled={isBillingBlocked}>
    + Add Student
  </button>
</DisabledButtonWithTooltip>
```

## 🎯 Feature Logic

### Student Admission Blocking Rules

1. **Maintenance Mode** (`student_admission_maintenance`):
   - When enabled (global scope): Completely blocks admission tab
   - When enabled (school scope): Blocks admission for that school
   - When enabled (user scope): Blocks admission for that user

2. **Billing Restrictions** (`student_admission_billing`):
   - When enabled (global scope): Shows admission tab but disables CRUD operations
   - When enabled (school scope): Disables CRUD operations for that school
   - When enabled (user scope): Disables CRUD operations for that user

### Scope Resolution
- Global scope takes precedence over school/user scope
- Root users are exempt from all restrictions
- Hierarchical resolution: Global → School → User

## 🔍 Testing

### Debug Component
Use the `FeatureSwitchTest` component to test feature switching:

```typescript
import FeatureSwitchTest from '../components/Debug/FeatureSwitchTest';

// Add to your component for testing
<FeatureSwitchTest />
```

### Manual Testing Scenarios

1. **Normal Operation**:
   - Both feature flags disabled
   - All functionality available

2. **Billing Blocked**:
   - `student_admission_billing` enabled
   - Admission tab visible but buttons disabled
   - Tooltips show block message

3. **Maintenance Mode**:
   - `student_admission_maintenance` enabled
   - Admission tab shows blocked component
   - No CRUD operations possible

4. **Error Handling**:
   - Network errors show refresh button
   - Fallback to enabled state on errors

## 🚀 Usage Examples

### Basic Integration
```typescript
import { useFeatureSwitch } from '../hooks/useFeatureSwitch';

const StudentsPage = () => {
  const { isStudentAdmissionBlocked, isBillingBlocked, blockMessage } = useFeatureSwitch();

  if (isStudentAdmissionBlocked) {
    return <StudentAdmissionBlocked />;
  }

  return (
    <div>
      <button disabled={isBillingBlocked} title={isBillingBlocked ? blockMessage : ''}>
        Add Student
      </button>
    </div>
  );
};
```

### Custom Feature Check
```typescript
import { featureSwitchService } from '../services/featureSwitch';

const checkCustomFeature = async () => {
  try {
    const result = await featureSwitchService.checkFeature('my_feature', 'school', 'school_123');
    console.log('Feature enabled:', result.is_enabled);
  } catch (error) {
    console.error('Feature check failed:', error);
  }
};
```

## 🔧 Configuration

### Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
```

### API Endpoints
- `GET /students/features/status` - Get student admission status
- `POST /switch/check/` - Check single feature
- `POST /switch/check/bulk/` - Check multiple features

## 🐛 Troubleshooting

### Common Issues

1. **Feature status not loading**:
   - Check network connectivity
   - Verify API endpoint is accessible
   - Check authentication token

2. **Buttons not disabled**:
   - Verify `isBillingBlocked` is true
   - Check tooltip message is provided
   - Ensure `DisabledButtonWithTooltip` is used correctly

3. **Blocked component not showing**:
   - Verify `isStudentAdmissionBlocked` is true
   - Check that maintenance mode is enabled
   - Ensure component is rendered conditionally

### Debug Steps
1. Use browser dev tools to check network requests
2. Add console logs to verify hook state
3. Use `FeatureSwitchTest` component to inspect raw data
4. Check API responses for correct data structure

## 📝 Future Enhancements

1. **Caching**: Implement client-side caching for feature status
2. **Real-time Updates**: Add WebSocket support for live feature updates
3. **Analytics**: Track feature usage and blocking events
4. **Admin Panel**: Add UI for managing feature flags (root users only)
5. **A/B Testing**: Support for percentage-based rollouts

## 🤝 Contributing

When adding new feature flags:

1. Update types in `featureFlags.ts`
2. Add methods to `featureSwitch.ts` service
3. Create appropriate UI components
4. Add tests using `FeatureSwitchTest`
5. Update this documentation

## 📚 References

- [Feature Switch Comprehensive Guide](./FEATURE_SWITCH_COMPREHENSIVE_GUIDE.md)
- [API Documentation](./api.yaml)
- [Backend Implementation Guide](../backend/README.md)
