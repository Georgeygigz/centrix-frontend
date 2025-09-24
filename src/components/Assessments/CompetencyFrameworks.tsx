import React from 'react';
import { FaEye, FaEllipsisV } from 'react-icons/fa';
import { CompetencyFramework } from '../../types/assessment';
import { PermissionGate } from '../RBAC';

const CompetencyFrameworks: React.FC = () => {
  const [frameworks] = React.useState<CompetencyFramework[]>([]);
  const [isLoading] = React.useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatGradeLevel = (gradeLevel: string) => {
    return gradeLevel.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const getGradeLevelColor = (gradeLevel: string) => {
    const colors = {
      'pp1': 'bg-purple-100 text-purple-800',
      'pp2': 'bg-purple-100 text-purple-800',
      'grade1': 'bg-blue-100 text-blue-800',
      'grade2': 'bg-blue-100 text-blue-800',
      'grade3': 'bg-green-100 text-green-800',
      'grade4': 'bg-green-100 text-green-800',
      'grade5': 'bg-yellow-100 text-yellow-800',
      'grade6': 'bg-yellow-100 text-yellow-800',
      'grade7': 'bg-orange-100 text-orange-800',
      'grade8': 'bg-orange-100 text-orange-800',
      'grade9': 'bg-red-100 text-red-800',
      'grade10': 'bg-red-100 text-red-800',
      'grade11': 'bg-indigo-100 text-indigo-800',
      'grade12': 'bg-indigo-100 text-indigo-800'
    };
    return colors[gradeLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      {/* Table */}
        <div className="bg-white rounded-md shadow-sm relative">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading competency frameworks...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Grade Level</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Order</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Created</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {frameworks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-500">
                        No competency frameworks found. Create some frameworks to see them here.
                      </td>
                    </tr>
                  ) : (
                    frameworks.map((framework, index) => (
                      <tr key={framework.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                          {framework.name}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {framework.code}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-900 max-w-xs">
                          <div className="truncate" title={framework.description}>
                            {framework.description}
                          </div>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGradeLevelColor(framework.grade_level)}`}>
                            {formatGradeLevel(framework.grade_level)}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {framework.order}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            framework.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {framework.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {formatDate(framework.created_at)}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
                          <div className="flex items-center space-x-1">
                            <button
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                              title="View Details"
                            >
                              {FaEye({ className: "w-3 h-3" })}
                            </button>
                            
                            <PermissionGate permissions={['create_assessment']}>
                              <div className="relative" data-dropdown-container>
                                <button
                                  className="p-1 rounded-md transition-colors duration-200 cursor-pointer text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                  title="More Options"
                                >
                                  {FaEllipsisV({ className: "w-3 h-3" })}
                                </button>
                              </div>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
};

export default CompetencyFrameworks;