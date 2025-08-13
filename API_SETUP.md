# API Integration Setup

This guide explains how to set up the API integration for the School Management System.

## Environment Variables

1. Create a `.env.local` file in the root directory with the following content:

```bash
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

2. Make sure your API server is running on `http://127.0.0.1:8000/api/v1`

## API Endpoints

The application is configured to work with the following API endpoints:

### Authentication
- **POST** `/api/v1/users/login` - User login
- **POST** `/api/v1/users/signup` - User registration (TODO)

### Students
- **GET** `/api/v1/students/admissions/` - List all students
- **POST** `/api/v1/students/admissions/` - Create new student
- **PUT** `/api/v1/students/admissions/{id}/` - Update student
- **DELETE** `/api/v1/students/admissions/{id}/` - Delete student

## Token Storage

The application stores the authentication token in the browser's session storage. This means:
- The token persists during the browser session
- The token is automatically cleared when the browser is closed
- The token is available for all authenticated API requests

## Usage

1. Start your API server on `http://127.0.0.1:8000/api/v1`
2. Create the `.env.local` file with the API base URL
3. Start the React application with `npm start`
4. Use the login form to authenticate with your API

## API Response Format

The login API expects and returns the following format:

### Request
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

### Response
```json
{
  "data": {
    "email": "john.doe@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "is_pin_set": false
  },
  "status": "success"
}
```

## Error Handling

The application handles API errors gracefully:
- Network errors are caught and displayed to the user
- Invalid credentials show appropriate error messages
- Token expiration is handled automatically

## Development

To modify the API integration:
1. Update `src/services/api.ts` for new endpoints
2. Update `src/types/auth.ts` for new data structures
3. Update `src/context/AuthContext.tsx` for new authentication flows
