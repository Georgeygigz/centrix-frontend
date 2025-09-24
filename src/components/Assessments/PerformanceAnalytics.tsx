import React from 'react';
import { FaChartBar, FaUsers, FaTrophy, FaChartLine } from 'react-icons/fa';
import { PerformanceAnalytics as PerformanceAnalyticsType } from '../../types/assessment';

const PerformanceAnalytics: React.FC = () => {
  const [analytics] = React.useState<PerformanceAnalyticsType | null>(null);
  const [isLoading] = React.useState(false);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
      case 'A-':
        return 'bg-green-500';
      case 'B+':
      case 'B':
      case 'B-':
        return 'bg-blue-500';
      case 'C+':
      case 'C':
      case 'C-':
        return 'bg-yellow-500';
      case 'D+':
      case 'D':
      case 'D-':
        return 'bg-orange-500';
      case 'E':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getGradeDistribution = () => {
    if (!analytics) return [];
    
    const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
    const totalStudents = analytics.performance_summary.total_students;
    
    return grades.map(grade => ({
      grade,
      count: analytics.grade_distribution[grade as keyof typeof analytics.grade_distribution] || 0,
      percentage: totalStudents > 0 ? ((analytics.grade_distribution[grade as keyof typeof analytics.grade_distribution] || 0) / totalStudents) * 100 : 0
    }));
  };

  return (
    <div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading performance analytics...</p>
          </div>
        ) : analytics ? (
          <>
            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-md shadow-sm p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {FaChartLine({ className: "w-4 h-4 text-blue-600" })}
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Average Score</p>
                    <p className="text-lg font-semibold text-gray-900">{analytics.performance_summary.average_score.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    {FaUsers({ className: "w-4 h-4 text-green-600" })}
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Total Students</p>
                    <p className="text-lg font-semibold text-gray-900">{analytics.performance_summary.total_students}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    {FaChartBar({ className: "w-4 h-4 text-yellow-600" })}
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Highest Score</p>
                    <p className="text-lg font-semibold text-gray-900">{analytics.performance_summary.max_score}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    {FaChartBar({ className: "w-4 h-4 text-red-600" })}
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-600">Lowest Score</p>
                    <p className="text-lg font-semibold text-gray-900">{analytics.performance_summary.min_score}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grade Distribution */}
              <div className="bg-white rounded-md shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Grade Distribution</h3>
                <div className="space-y-2">
                  {getGradeDistribution().map(({ grade, count, percentage }) => (
                    <div key={grade} className="flex items-center">
                      <div className="w-8 text-xs font-medium text-gray-600">{grade}</div>
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getGradeColor(grade)}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-xs text-gray-600 text-right">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Performance */}
              <div className="bg-white rounded-md shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Subject Performance</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.subject_performance).map(([subjectId, subjectData]) => (
                    <div key={subjectId} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{subjectData.subject_name}</p>
                        <p className="text-xs text-gray-600">
                          {subjectData.min_score}% - {subjectData.max_score}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">{subjectData.average_score.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-md shadow-sm p-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Performers</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Position</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Student Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Average Score</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Average Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {analytics.top_performers.map((performer, index) => (
                      <tr key={performer.student_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <div className="flex items-center">
                            {index < 3 && (
                              <div className="mr-2">
                                {FaTrophy({ className: `w-3 h-3 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-500'}` })}
                              </div>
                            )}
                            <span className="font-medium">{performer.position}</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                          {performer.student_name}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {performer.average_score.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(performer.average_grade)} text-white`}>
                            {performer.average_grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-md shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-3">
              {FaChartBar({ className: "mx-auto h-12 w-12" })}
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No Analytics Data</h3>
            <p className="text-xs text-gray-500">Select a class and term to view performance analytics.</p>
          </div>
        )}
    </div>
  );
};

export default PerformanceAnalytics;