import React from 'react';
import { FaEye, FaEllipsisV } from 'react-icons/fa';
import { StudentAssessment } from '../../types/assessment';
import { PermissionGate } from '../RBAC';

const StudentAssessments: React.FC = () => {
  const [assessments] = React.useState<StudentAssessment[]>([]);
  const [isLoading] = React.useState(false);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
      case 'A-':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
      case 'B-':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
      case 'C-':
        return 'bg-yellow-100 text-yellow-800';
      case 'D+':
      case 'D':
      case 'D-':
        return 'bg-orange-100 text-orange-800';
      case 'E':
        return 'bg-red-100 text-red-800';
      case 'AB':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Table */}
        <div className="bg-white rounded-md shadow-sm relative">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading student assessments...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Student</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Assessment</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Score</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Grade</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Points</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Assessed By</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Assessed</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {assessments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-500">
                        No student assessments found. Create some assessments and add student results to see them here.
                      </td>
                    </tr>
                  ) : (
                    assessments.map((assessment, index) => (
                      <tr key={assessment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                          <div>
                            <div className="font-medium">{assessment.student_details?.pupil_name || 'Unknown Student'}</div>
                            <div className="text-gray-500">{assessment.student_details?.admission_number || assessment.student}</div>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <div>
                            <div className="font-medium">{assessment.assessment_details?.name || 'Unknown Assessment'}</div>
                            <div className="text-gray-500">{assessment.assessment_details?.assessment_type || ''}</div>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{assessment.score}</span>
                            <span className="text-gray-500">/ {assessment.assessment_details?.maximum_score || '100'}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {assessment.percentage_score}%
                          </div>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(assessment.grade)}`}>
                            {assessment.grade}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {assessment.points}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <div className="flex flex-col space-y-1">
                            {assessment.is_absent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Absent
                              </span>
                            )}
                            {assessment.is_exempt && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Exempt
                              </span>
                            )}
                            {!assessment.is_absent && !assessment.is_exempt && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Present
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {assessment.assessed_by_details ? (
                            <div>
                              <div className="font-medium">{assessment.assessed_by_details.first_name} {assessment.assessed_by_details.last_name}</div>
                              <div className="text-gray-500">{assessment.assessed_by_details.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {formatDateTime(assessment.assessed_at)}
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

export default StudentAssessments;