import { apiService } from '../services/api';
import { AssociateParentRequest } from '../types/parents';

/**
 * Example function demonstrating how to associate a parent with a student
 * using the API endpoint: /api/v1/students/admissions/{studentId}/parents
 */
export const associateParentExample = async (
  studentId: string,
  parentId: string,
  relationshipType: string = 'Father',
  isPrimaryContact: boolean = true,
  isEmergencyContact: boolean = false,
  canPickUp: boolean = false,
  notes: string = 'none'
) => {
  try {
    // Prepare the request data according to the API specification
    const parentData: AssociateParentRequest = {
      parent_id: parentId,
      relationship_type: relationshipType,
      is_primary_contact: isPrimaryContact,
      is_emergency_contact: isEmergencyContact,
      can_pick_up: canPickUp,
      notes: notes
    };

    console.log('Associating parent with student...');
    console.log('Student ID:', studentId);
    console.log('Parent Data:', parentData);

    // Make the API call
    const response = await apiService.students.associateParent(studentId, parentData);

    console.log('Parent associated successfully!');
    console.log('Response:', response);

    return response;
  } catch (error: any) {
    console.error('Error associating parent:', error);
    
    // Handle different types of errors
    if (error.response?.data) {
      console.error('API Error Details:', error.response.data);
    }
    
    throw error;
  }
};

/**
 * Example usage with the provided data structure
 */
export const exampleUsage = async () => {
  const studentId = '-OYg_LjcJ13gRkQYe3w6';
  const parentId = '-OYg_VczZBzBfmw7K0Y4';
  
  try {
    const result = await associateParentExample(
      studentId,
      parentId,
      'Father',
      true,  // is_primary_contact
      false, // is_emergency_contact
      false, // can_pick_up
      'none' // notes
    );
    
    console.log('Success:', result);
  } catch (error) {
    console.error('Failed to associate parent:', error);
  }
};

/**
 * Batch associate multiple parents with a student
 */
export const batchAssociateParents = async (
  studentId: string,
  parents: Array<{
    parentId: string;
    relationshipType: string;
    isPrimaryContact?: boolean;
    isEmergencyContact?: boolean;
    canPickUp?: boolean;
    notes?: string;
  }>
) => {
  const results = [];
  
  for (const parent of parents) {
    try {
      const result = await associateParentExample(
        studentId,
        parent.parentId,
        parent.relationshipType,
        parent.isPrimaryContact ?? false,
        parent.isEmergencyContact ?? false,
        parent.canPickUp ?? false,
        parent.notes ?? ''
      );
      
      results.push({ success: true, parent: parent.parentId, result });
    } catch (error) {
      results.push({ success: false, parent: parent.parentId, error });
    }
  }
  
  return results;
};
