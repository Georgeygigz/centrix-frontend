import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { UpdateUserRequest } from '../../types/users';

const UserUpdateExample: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [updateData, setUpdateData] = useState<UpdateUserRequest>({
    first_name: '',
    last_name: '',
    surname: '',
    phone_number: '',
    role: '',
    is_active: true,
    is_staff: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateUser = async () => {
    if (!userId) {
      setMessage({ text: 'Please enter a user ID', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Filter out empty fields to only send what's actually being updated
      const filteredData: UpdateUserRequest = {};
      
      if (updateData.first_name) filteredData.first_name = updateData.first_name;
      if (updateData.last_name) filteredData.last_name = updateData.last_name;
      if (updateData.surname) filteredData.surname = updateData.surname;
      if (updateData.phone_number) filteredData.phone_number = updateData.phone_number;
      if (updateData.role) filteredData.role = updateData.role;
      filteredData.is_active = updateData.is_active;
      filteredData.is_staff = updateData.is_staff;

      await apiService.users.update(userId, filteredData);
      
      setMessage({ 
        text: `User ${userId} updated successfully!`, 
        type: 'success' 
      });
      
      // Clear form
      setUpdateData({
        first_name: '',
        last_name: '',
        surname: '',
        phone_number: '',
        role: '',
        is_active: true,
        is_staff: false
      });
      
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ 
        text: 'Failed to update user. Please check the user ID and try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateUserRequest, value: string | boolean) => {
    setUpdateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Update Example</h2>
      
      <div className="space-y-4">
        {/* User ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User ID *
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter user ID to update"
          />
        </div>

        {/* Update Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={updateData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={updateData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter last name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surname
            </label>
            <input
              type="text"
              value={updateData.surname}
              onChange={(e) => handleInputChange('surname', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter surname"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={updateData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+254 700000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={updateData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="root">Root</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Status
            </label>
            <select
              value={updateData.is_active ? 'true' : 'false'}
              onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Status
            </label>
            <select
              value={updateData.is_staff ? 'true' : 'false'}
              onChange={(e) => handleInputChange('is_staff', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="false">Regular User</option>
              <option value="true">Staff Member</option>
            </select>
          </div>
        </div>

        {/* Update Button */}
        <div className="pt-4">
          <button
            onClick={handleUpdateUser}
            disabled={loading || !userId}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Updating...' : 'Update User'}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* API Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">API Endpoint Information</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Method:</strong> PUT</p>
            <p><strong>URL:</strong> http://localhost:8000/api/v1/users/users/{'{id}'}</p>
            <p><strong>Updatable Fields:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>first_name</li>
              <li>last_name</li>
              <li>surname</li>
              <li>phone_number</li>
              <li>role</li>
              <li>is_active</li>
              <li>is_staff</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserUpdateExample;
