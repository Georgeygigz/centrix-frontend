# Frontend Multi-Tenant Implementation Guide

This document outlines the frontend changes made to support the multi-tenant architecture for the Centrix School Management System.

## 🏗️ Architecture Overview

The frontend now supports multi-tenancy through:

1. **Tenant Detection**: Automatic detection of schools via subdomain, domain, or URL parameters
2. **Tenant Context**: Global state management for current school information
3. **Tenant-Aware API**: All API calls include school identification headers
4. **School Selection**: Fallback UI for school selection when tenant detection fails

## 📁 New Files Created

### 1. `src/types/tenant.ts`
Defines TypeScript interfaces for tenant/school data:

```typescript
export interface School {
  id: string;
  name: string;
  subdomain: string;
  domain: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### 2. `src/utils/tenantDetection.ts`
Handles tenant detection logic:

- **Subdomain Detection**: `stmarys.127.0.0.1` → `stmarys`
- **Domain Detection**: `stmarys.centrix.com` → `stmarys.centrix.com`
- **URL Parameter Detection**: `?school=stmarys`
- **API Integration**: Fetches school information from backend

### 3. `src/context/TenantContext.tsx`
Global state management for tenant information:

```typescript
const { currentSchool, isLoading, error, detectTenant } = useTenant();
```

## 🔄 Updated Files

### 1. `src/types/auth.ts`
Enhanced with tenant information:

```typescript
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  is_pin_set: boolean;
  school_id: string;        // NEW: School ID
  school_name?: string;     // NEW: School name
  role?: string;           // NEW: User role
}
```

### 2. `src/services/api.ts`
Enhanced with tenant-aware API calls:

```typescript
// Tenant-aware headers
getAuthHeaders: (schoolId?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (storedSchoolId) {
    headers['X-School-ID'] = storedSchoolId;  // NEW: School ID header
  }

  return headers;
}

// School-specific API endpoints
schools: {
  getAll: async () => { /* ... */ },
  detect: async (identifier: string) => { /* ... */ },
  getById: async (schoolId: string) => { /* ... */ },
}

// Tenant-aware student operations
students: {
  getAll: async (schoolId?: string) => { /* ... */ },
  create: async (studentData: any, schoolId?: string) => { /* ... */ },
  update: async (studentId: string, studentData: any, schoolId?: string) => { /* ... */ },
  delete: async (studentId: string, schoolId?: string) => { /* ... */ },
}
```

### 3. `src/context/AuthContext.tsx`
Enhanced with tenant-aware authentication:

```typescript
const login = async (credentials: LoginCredentials) => {
  const loginData = {
    ...credentials,
    school_id: credentials.school_id || currentSchool?.id,  // NEW: Include school ID
  };
  
  const response = await apiService.login(loginData);
  apiService.setSchoolId(response.data.school_id);  // NEW: Store school ID
};
```

### 4. `src/App.tsx`
Enhanced with tenant detection and school selection:

```typescript
function AppContent() {
  const { currentSchool, isLoading, error } = useTenant();
  
  // Show loading while detecting tenant
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show error if tenant detection failed
  if (error && !currentSchool) {
    return <TenantError error={error} />;
  }

  // Show school selection if no tenant detected
  if (!currentSchool) {
    return <SchoolSelection />;
  }
  
  return isAuthenticated ? <Dashboard /> : <Auth />;
}
```

### 5. `src/components/Students/Students.tsx`
Enhanced with tenant-aware student operations:

```typescript
const Students: React.FC = () => {
  const { currentSchool } = useTenant();

  // Load students for current school
  useEffect(() => {
    const loadStudents = async () => {
      if (!currentSchool) return;
      
      const data = await apiService.students.getAll(currentSchool.id);
      setStudents(data.results || []);
    };
    
    loadStudents();
  }, [currentSchool]);

  // Create student for current school
  const handleAddStudent = async () => {
    const response = await apiService.students.create(studentData, currentSchool.id);
    setStudents(prev => [...prev, response]);
  };
};
```

### 6. `src/components/Dashboard/TopNavigation.tsx`
Enhanced with school information display:

```typescript
const TopNavigation: React.FC<TopNavigationProps> = ({ pageTitle }) => {
  const { user } = useAuth();
  const { currentSchool } = useTenant();

  return (
    <div>
      {/* School Information Badge */}
      {currentSchool && (
        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
          <FaSchool className="w-4 h-4 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">{currentSchool.name}</p>
            <p className="text-xs text-blue-700">{currentSchool.address}</p>
          </div>
        </div>
      )}
      
      {/* User Information */}
      <div>
        <p>{user?.username}</p>
        <p>{user?.role} • {user?.school_name}</p>
      </div>
    </div>
  );
};
```

## 🚀 Usage Examples

### 1. Using Tenant Context

```typescript
import { useTenant } from '../context/TenantContext';

const MyComponent = () => {
  const { currentSchool, isLoading, error } = useTenant();
  
  if (isLoading) return <div>Loading school...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!currentSchool) return <div>No school selected</div>;
  
  return <div>Welcome to {currentSchool.name}!</div>;
};
```

### 2. Making Tenant-Aware API Calls

```typescript
import { apiService } from '../services/api';
import { useTenant } from '../context/TenantContext';

const MyComponent = () => {
  const { currentSchool } = useTenant();
  
  const fetchData = async () => {
    // Automatically includes school ID in headers
    const data = await apiService.authenticatedRequest('/students/', {
      method: 'GET'
    }, currentSchool?.id);
  };
};
```

### 3. Tenant Detection

```typescript
import { TenantDetector } from '../utils/tenantDetection';

// Detect tenant from current URL
const identifier = TenantDetector.getTenantIdentifier();

// Fetch school information
const school = await TenantDetector.fetchSchoolInfo(identifier);

// Get all available schools
const schools = await TenantDetector.getAvailableSchools();
```

## 🔧 Configuration

### 1. Environment Variables

```bash
# API Base URL
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### 2. Local Development Setup

For local development with subdomains, add to `/etc/hosts`:

```
127.0.0.1 stmarys.127.0.0.1
127.0.0.1 nairobiacademy.127.0.0.1
127.0.0.1 mombasainternational.127.0.0.1
```

### 3. Development Server

```bash
# Start development server
npm start

# Access different schools
http://stmarys.127.0.0.1:3000
http://nairobiacademy.127.0.0.1:3000
http://mombasainternational.127.0.0.1:3000
```

## 🔐 Security Features

### 1. Data Isolation
- All API requests include `X-School-ID` header
- School ID stored in session storage
- Automatic filtering by school in backend

### 2. Authentication
- JWT tokens include school context
- Login validates school membership
- Logout clears school information

### 3. Access Control
- User roles per school
- School-specific permissions
- Cross-school access prevention

## 📊 Benefits

### 1. **Cost Efficiency**
- Single codebase for all schools
- Shared infrastructure
- Reduced maintenance overhead

### 2. **Scalability**
- Easy to add new schools
- Horizontal scaling support
- Performance optimization

### 3. **User Experience**
- Seamless school switching
- Consistent interface
- School-specific branding

### 4. **Development**
- Single codebase to maintain
- Feature consistency across schools
- Easier testing and deployment

## 🧪 Testing

### 1. Tenant Detection Testing

```typescript
// Test subdomain detection
expect(TenantDetector.detectFromSubdomain('stmarys.127.0.0.1')).toBe('stmarys');

// Test domain detection
expect(TenantDetector.detectFromDomain('stmarys.centrix.com')).toBe('stmarys.centrix.com');

// Test URL parameter detection
expect(TenantDetector.detectFromUrlParam('?school=stmarys')).toBe('stmarys');
```

### 2. API Testing

```typescript
// Test tenant-aware API calls
const response = await apiService.students.getAll('school-123');
expect(response.headers['X-School-ID']).toBe('school-123');
```

## 🚀 Deployment

### 1. Production Setup

```bash
# Build for production
npm run build

# Deploy to hosting service
# Configure subdomains for each school
```

### 2. Subdomain Configuration

```nginx
# Nginx configuration example
server {
    listen 80;
    server_name *.centrix.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 Next Steps

1. **Implement School Branding**: Custom logos, colors, and themes per school
2. **Add School-Specific Features**: Custom fields and workflows
3. **Implement Analytics**: Cross-school insights and reporting
4. **Add Bulk Operations**: Multi-school data management
5. **Implement Caching**: School-specific data caching
6. **Add Offline Support**: Offline data synchronization per school

## 🤝 Support

For questions or issues with the multi-tenant implementation:

1. Check the backend documentation for API endpoints
2. Review the tenant detection logic in `src/utils/tenantDetection.ts`
3. Verify school configuration in the backend
4. Test with different subdomains and URL parameters

---

**Note**: This implementation provides a robust foundation for multi-tenancy while maintaining simplicity and scalability. The architecture can be extended to support additional tenant-specific features as needed.
