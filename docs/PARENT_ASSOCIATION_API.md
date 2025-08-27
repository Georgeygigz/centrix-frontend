# Parent Association API

This document describes how to use the parent association API endpoint to attach parents to students.

## API Endpoint

```
POST /api/v1/students/admissions/{studentId}/parents
```

## Request Structure

### URL Parameters
- `studentId` (string, required): The ID of the student to associate the parent with

### Request Body
```json
{
  "parent_id": "string",
  "relationship_type": "string",
  "is_primary_contact": "boolean",
  "is_emergency_contact": "boolean",
  "can_pick_up": "boolean",
  "notes": "string"
}
```

### Field Descriptions
- `parent_id` (string, required): The parent ID to associate with the student
- `relationship_type` (string, required): The type of relationship (e.g., "Father", "Mother", "Guardian")
- `is_primary_contact` (boolean): Whether this parent is the primary contact
- `is_emergency_contact` (boolean): Whether this parent is an emergency contact
- `can_pick_up` (boolean): Whether this parent can pick up the student
- `notes` (string): Additional notes about the relationship

## Example Request

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/students/admissions/-OYg_LjcJ13gRkQYe3w6/parents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "parent_id": "-OYg_VczZBzBfmw7K0Y4",
    "relationship_type": "Father",
    "is_primary_contact": true,
    "is_emergency_contact": false,
    "can_pick_up": false,
    "notes": "none"
  }'
```

## JavaScript/TypeScript Usage

### Using the API Service

```typescript
import { apiService } from '../services/api';

const associateParent = async () => {
  try {
    const studentId = '-OYg_LjcJ13gRkQYe3w6';
    const parentData = {
      parent_id: '-OYg_VczZBzBfmw7K0Y4',
      relationship_type: 'Father',
      is_primary_contact: true,
      is_emergency_contact: false,
      can_pick_up: false,
      notes: 'none'
    };

    const response = await apiService.students.associateParent(studentId, parentData);
    console.log('Parent associated successfully:', response);
  } catch (error) {
    console.error('Error associating parent:', error);
  }
};
```

### Using the Utility Function

```typescript
import { associateParentExample } from '../utils/associateParentExample';

const example = async () => {
  try {
    const result = await associateParentExample(
      '-OYg_LjcJ13gRkQYe3w6', // studentId
      '-OYg_VczZBzBfmw7K0Y4', // parentId
      'Father',               // relationshipType
      true,                   // isPrimaryContact
      false,                  // isEmergencyContact
      false,                  // canPickUp
      'none'                  // notes
    );
    
    console.log('Success:', result);
  } catch (error) {
    console.error('Failed to associate parent:', error);
  }
};
```

## React Component Usage

```typescript
import AssociateParentExample from '../components/Students/AssociateParentExample';

const MyComponent = () => {
  const handleSuccess = () => {
    console.log('Parent associated successfully!');
    // Refresh data or show success message
  };

  const handleError = (error: string) => {
    console.error('Failed to associate parent:', error);
    // Show error message to user
  };

  return (
    <AssociateParentExample
      studentId="-OYg_LjcJ13gRkQYe3w6"
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
};
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": "relationship_id",
    "student": "student_id",
    "parent": "parent_id",
    "relationship_type": "Father",
    "is_primary_contact": true,
    "is_emergency_contact": false,
    "can_pick_up": false,
    "notes": "none",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message",
  "errors": {
    "field_name": ["Field error message"]
  }
}
```

## Common Error Cases

1. **Invalid Student ID**: Student not found
2. **Invalid Parent ID**: Parent not found
3. **Missing Required Fields**: `parent` or `relationship_type` not provided
4. **Duplicate Association**: Parent already associated with student
5. **Unauthorized**: Invalid or missing authentication token

## Related Endpoints

- `GET /api/v1/students/admissions/{studentId}/parents` - Get all parents for a student
- `DELETE /api/v1/students/admissions/{studentId}/parents/{relationshipId}` - Remove parent association
- `GET /api/v1/parents/{parentId}/students` - Get all students for a parent

## TypeScript Types

```typescript
interface AssociateParentRequest {
  parent_id: string;
  relationship_type: string;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  can_pick_up: boolean;
  notes: string;
}
```

## Notes

- The `parent_id` field should contain the parent's ID, not their name or other details
- Only one parent can be marked as `is_primary_contact: true` per student
- Multiple parents can be marked as `is_emergency_contact: true`
- The `relationship_type` field is case-sensitive and should match the expected values
- All boolean fields default to `false` if not provided
