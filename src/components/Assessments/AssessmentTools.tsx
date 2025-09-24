import React, { useState, useEffect } from 'react';
import { FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { AssessmentTool, AssessmentToolFilters } from '../../types/assessment';
import { assessmentService } from '../../services/assessment';
import { PermissionGate } from '../RBAC';

const AssessmentTools: React.FC = () => {
  // State management
  const [searchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination state
  const [assessments, setAssessments] = useState<AssessmentTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const itemsPerPage = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load assessments data from API
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setIsLoading(true);
        const filters: AssessmentToolFilters = {
          search: debouncedSearchQuery || undefined,
          page: currentPage,
          page_size: itemsPerPage,
          ordering: sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined
        };
        
        const data = await assessmentService.getAssessmentTools(filters);
        setAssessments(data.results || []);
        setTotalCount(data.count || 0);
        setHasNextPage(!!data.next);
        setHasPreviousPage(!!data.previous);
      } catch (error) {
        console.error('Error loading assessments:', error);
        setAssessments([]);
        setTotalCount(0);
        setHasNextPage(false);
        setHasPreviousPage(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAssessments();
  }, [currentPage, debouncedSearchQuery, sortBy, sortDirection]);

  // Reset to first page when debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      FaChevronUp({ className: "w-3 h-3" }) : 
      FaChevronDown({ className: "w-3 h-3" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAssessmentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

    return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4">

        {/* Assessment Tools Table */}
        <div className="bg-white rounded-md shadow-sm relative">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading assessments...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('assessment_type')}>
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {getSortIcon('assessment_type')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Subject
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Class
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('term')}>
                      <div className="flex items-center space-x-1">
                        <span>Term</span>
                        {getSortIcon('term')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('year')}>
                      <div className="flex items-center space-x-1">
                        <span>Year</span>
                        {getSortIcon('year')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Max Score
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {assessments.map((assessment, index) => (
                    <tr key={assessment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                        {assessment.name}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formatAssessmentType(assessment.assessment_type)}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {assessment.subject_details?.name || assessment.subject}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {assessment.class_level_details?.name || assessment.class_level}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Term {assessment.term}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {assessment.year}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {assessment.maximum_score}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          assessment.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assessment.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {formatDate(assessment.created_at)}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setToast({ message: 'View details functionality coming soon!', type: 'success' })}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                            title="View Details"
                          >
                            {FaEye({ className: "w-3 h-3" })}
                          </button>
                          
                          {/* Dropdown Menu */}
                          <PermissionGate permissions={['create_assessment']}>
                            <div className="relative" data-dropdown-container>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (openDropdownId === assessment.id) {
                                    setOpenDropdownId(null);
                                  } else {
                                    setOpenDropdownId(assessment.id);
                                  }
                                }}
                                className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
                                  openDropdownId === assessment.id 
                                    ? 'text-blue-600 bg-blue-50' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                                title="More Options"
                              >
                                {FaEllipsisV({ className: "w-3 h-3" })}
                              </button>
                            </div>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 rounded-lg mt-4 mb-4" style={{ backgroundColor: 'rgb(249,250,251)', position: 'relative', zIndex: 10 }}>
          <div className="text-xs text-gray-600">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalCount}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePreviousPage}
              disabled={!hasPreviousPage}
              className="px-2.5 py-1 text-xs font-medium border rounded transition-colors duration-200 text-gray-500 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-2.5 py-1 text-xs font-medium text-gray-600">
              Page {currentPage} of {totalPages} ({totalPages > 1 ? `${totalPages} pages` : '1 page'})
            </span>
            <button 
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className="px-2.5 py-1 text-xs font-medium border rounded transition-colors duration-200 text-gray-500 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center p-4 rounded-lg shadow-lg transition-all duration-300">
          <div className={`flex items-center space-x-3 ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          } px-6 py-4 rounded-lg shadow-xl`}>
            {toast.type === 'success' ? (
              FaCheckCircle({ className: "w-5 h-5 text-green-600" })
            ) : (
              FaTimes({ className: "w-5 h-5 text-red-600" })
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 text-gray-400 hover:text-gray-600"
            >
              {FaTimes({ className: "w-4 h-4" })}
            </button>
          </div>
      </div>
      )}
    </div>
  );
};

export default AssessmentTools;