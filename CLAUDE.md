# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Start Development Server
```bash
npm start
```
Runs the app in development mode at http://localhost:3000

### Build for Production
```bash
npm run build
```
Builds the app for production to the `build` folder

### Run Tests
```bash
npm test
```
Launches the test runner in interactive watch mode

## Project Architecture

### Core Technology Stack
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management (Auth, RBAC, Tenant)

### Application Structure

#### Context Providers (App.tsx)
The app is wrapped in nested context providers in this order:
1. `AuthProvider` - Handles authentication state and user session
2. `RBACProvider` - Manages role-based access control
3. `TenantProvider` - Handles multi-tenant functionality

#### Authentication Flow
- Session-based authentication using tokens stored in `sessionStorage`
- Authentication state managed through `AuthContext` (src/context/AuthContext.tsx)
- Users have roles: `root`, `super_admin`, `admin`, `user`, `parent`
- Authentication includes "Sign in as" functionality for user impersonation

#### Role-Based Access Control (RBAC)
- Comprehensive permission system defined in `src/types/rbac.ts`
- Permission matrix maps roles to specific permissions
- Components use `useRBAC()` hook to check permissions
- Navigation items have `requiredPermissions` for conditional rendering

#### API Service Architecture
- Centralized API service in `src/services/api.ts`
- All requests go through `authenticatedRequest()` method
- Automatic token management and error handling
- Organized into logical modules: schools, students, users, parents, featureFlags, etc.
- Base URL configured via `REACT_APP_API_BASE_URL` environment variable (defaults to http://127.0.0.1:8000/api/v1)

### Key Features and Modules

#### Student Management
- Full CRUD operations for student admissions
- Advanced filtering and pagination
- Bulk operations support
- Parent-student relationship management
- Class and stream management

#### Multi-tenant School System
- Schools are detected by identifier
- All API requests are tenant-aware
- School context provides scope for data isolation

#### Feature Flags
- Dynamic feature toggling system
- Scoped feature flags (global, school, user)
- Bulk feature checking capabilities

#### Billing System
- Subscription management
- Invoice handling
- Feature-based billing plans
- Integration with school subscriptions

#### Assessment System
- Student assessments and performance tracking
- Competency frameworks
- Performance analytics

### Component Organization
- Components organized by feature domains (Auth, Dashboard, Students, Schools, etc.)
- Shared components for common UI patterns
- Modal components for detailed views
- Index files for clean imports

### Type Safety
- Comprehensive TypeScript types for all data models
- API request/response types
- RBAC permission types
- Feature flag types

### State Management Patterns
- Context API for global state (auth, RBAC, tenant)
- Local state with useState for component-specific data
- Custom hooks for reusable logic (usePermissions, useFeatureSwitch, useDebounce)

### Styling Approach
- Tailwind CSS utility classes
- Consistent design system with predefined color schemes
- Responsive design patterns
- Component-specific styling co-located with components

### API Error Handling
- Standardized error response format
- Custom error objects with response data preservation
- Automatic token cleanup on authentication failures
- User-friendly error messages

### Development Patterns
- Functional components with hooks
- TypeScript strict mode enabled
- Props interfaces for all components
- Consistent naming conventions (camelCase for variables, PascalCase for components)