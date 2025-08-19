# User Update Endpoint Implementation

This document describes how to use the user update endpoint in the Centrix Frontend application.

## API Endpoint

**Method:** PUT  
**URL:** `http://localhost:8000/api/v1/users/users/{id}`  
**Authentication:** Bearer token required

## Updatable Fields

The following fields can be updated for a user:

- `first_name` (string) - User's first name
- `last_name` (string) - User's last name  
- `surname` (string) - User's surname
- `phone_number` (string) - User's phone number
- `role` (string) - User's role (user, admin, super_admin, root)
- `is_active` (boolean) - Whether the user is active
- `is_staff` (boolean) - Whether the user is a staff member

## Implementation Details

### 1. TypeScript Interface

```typescript
export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  surname?: string;
  phone_number?: string;
  role?: string;
  is_active?: boolean;
  is_staff?: boolean;
}
```

### 2. API Service Method

```typescript
// In src/services/api.ts
users: {
  update: async (userId: string, userData: UpdateUserRequest) => {
    return apiService.authenticatedRequest(`/users/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
}
```

### 3. Usage Example

```typescript
import { apiService } from '../services/api';
import { UpdateUserRequest } from '../types/users';

// Example update data
const updateData: UpdateUserRequest = {
  first_name: "John",
  last_name: "Doe",
  surname: "Smith",
  phone_number: "+254 700000000",
  role: "admin",
  is_active: true,
  is_staff: true
};

// Update user
try {
  await apiService.users.update("user-id-here", updateData);
  console.log("User updated successfully");
} catch (error) {
  console.error("Failed to update user:", error);
}
```

## Components

### 1. Users Component (`src/components/Users/Users.tsx`)

The main Users component includes:
- User listing with search and filtering
- Add new user functionality
- Edit user functionality with all updatable fields
- Delete user functionality
- Role-based access control

### 2. UserUpdateExample Component (`src/components/Users/UserUpdateExample.tsx`)

A standalone example component that demonstrates:
- How to use the update endpoint
- Form handling for all updatable fields
- Error handling and success messages
- API endpoint documentation

## Features

### Form Validation
- Required fields validation
- Phone number formatting with +254 prefix
- Role selection based on current user permissions

### Error Handling
- Network error handling
- API error response handling
- User-friendly error messages

### Success Feedback
- Toast notifications for successful updates
- Form reset after successful submission
- Automatic user list refresh

### Security
- Authentication token required
- Role-based access control
- Permission gates for sensitive operations

## Usage in the Application

1. **Navigate to Users page** - Access the users management interface
2. **Edit existing user** - Click the edit button on any user row
3. **Update fields** - Modify any of the allowed fields
4. **Save changes** - Click "Save Changes" to update the user
5. **View results** - See the updated user information in the list

## Testing

You can test the endpoint using:

1. **UserUpdateExample component** - A dedicated testing interface
2. **Browser developer tools** - Monitor network requests
3. **API testing tools** - Use Postman or similar tools

## Notes

- Only the specified fields can be updated
- Empty fields are filtered out before sending to the API
- The endpoint requires authentication
- Role changes are restricted based on current user permissions
- Phone numbers are automatically formatted with +254 prefix
