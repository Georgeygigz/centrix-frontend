import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { AssociateParentRequest } from '../../types/parents';

interface AssociateParentExampleProps {
  studentId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const AssociateParentExample: React.FC<AssociateParentExampleProps> = ({ 
  studentId, 
  onSuccess, 
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AssociateParentRequest>({
    parent_id: '',
    relationship_type: '',
    is_primary_contact: false,
    is_emergency_contact: false,
    can_pick_up: false,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.parent_id || !formData.relationship_type) {
      onError?.('Parent ID and relationship type are required');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiService.students.associateParent(studentId, formData);
      console.log('Parent associated successfully:', response);
      onSuccess?.();
      
      // Reset form
      setFormData({
        parent_id: '',
        relationship_type: '',
        is_primary_contact: false,
        is_emergency_contact: false,
        can_pick_up: false,
        notes: ''
      });
    } catch (error: any) {
      console.error('Error associating parent:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to associate parent';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Associate Parent with Student</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent ID *
          </label>
          <input
            type="text"
            name="parent_id"
            value={formData.parent_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter parent ID (e.g., -OYg_VczZBzBfmw7K0Y4)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship Type *
          </label>
          <select
            name="relationship_type"
            value={formData.relationship_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select relationship type</option>
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Guardian">Guardian</option>
            <option value="Grandfather">Grandfather</option>
            <option value="Grandmother">Grandmother</option>
            <option value="Uncle">Uncle</option>
            <option value="Aunt">Aunt</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_primary_contact"
              checked={formData.is_primary_contact}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Primary Contact</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_emergency_contact"
              checked={formData.is_emergency_contact}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Emergency Contact</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="can_pick_up"
              checked={formData.can_pick_up}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Can Pick Up</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes (optional)"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Associating...' : 'Associate Parent'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Example Request:</h3>
        <pre className="text-xs text-gray-600 overflow-x-auto">
{`POST /api/v1/students/admissions/${studentId}/parents
{
  "parent_id": "-OYg_VczZBzBfmw7K0Y4",
  "relationship_type": "Father",
  "is_primary_contact": true,
  "is_emergency_contact": false,
  "can_pick_up": false,
  "notes": "none"
}`}
        </pre>
      </div>
    </div>
  );
};

export default AssociateParentExample;
