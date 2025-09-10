import React, { useState, useEffect, useCallback } from 'react';
import { FaChevronUp, FaChevronDown, FaEye, FaTimes, FaList, FaUser, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import { auditService } from '../../services/audit';
import { AuditLog, AuditLogParams, ACTION_TYPES, SECURITY_LEVELS } from '../../types/audit';
import ActivityLogDetailModal from './ActivityLogDetailModal';

interface ActivityLogsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  actionFilter: string;
  setActionFilter: (filter: string) => void;
  levelFilter: string;
  setLevelFilter: (filter: string) => void;
  contentTypeFilter: string;
  setContentTypeFilter: (filter: string) => void;
  startDateFilter: string;
  setStartDateFilter: (filter: string) => void;
  endDateFilter: string;
  setEndDateFilter: (filter: string) => void;
  clearFilters: () => void;
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({
  searchQuery,
  setSearchQuery,
  debouncedSearchQuery,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  actionFilter,
  setActionFilter,
  levelFilter,
  setLevelFilter,
  contentTypeFilter,
  setContentTypeFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  clearFilters
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: AuditLogParams = {
        page,
        page_size: pageSize,
        search: debouncedSearchQuery || undefined,
        ordering: sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined,
        action: actionFilter || undefined,
        level: levelFilter || undefined,
        content_type: contentTypeFilter || undefined,
        start_date: startDateFilter || undefined,
        end_date: endDateFilter || undefined,
      };
      
      const response = await auditService.getAuditLogs(params);
      
      setAuditLogs(response.results || []);
      setTotalCount(response.count || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [pageSize, debouncedSearchQuery, sortBy, sortDirection, actionFilter, levelFilter, contentTypeFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

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

  const getActionBadge = (action: string) => {
    const actionType = ACTION_TYPES.find(t => t.value === action);
    const colors = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-gray-100 text-gray-800',
      login: 'bg-purple-100 text-purple-800',
      logout: 'bg-orange-100 text-orange-800',
      download: 'bg-indigo-100 text-indigo-800',
      export: 'bg-cyan-100 text-cyan-800',
      import: 'bg-teal-100 text-teal-800',
      approve: 'bg-emerald-100 text-emerald-800',
      reject: 'bg-rose-100 text-rose-800',
      other: 'bg-slate-100 text-slate-800',
    };
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${colors[action as keyof typeof colors] || colors.other}`}>
        {actionType?.label || action}
      </span>
    );
  };

  const getLevelBadge = (level: string) => {
    const levelType = SECURITY_LEVELS.find(l => l.value === level);
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900',
    };
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${colors[level as keyof typeof colors] || colors.info}`}>
        {levelType?.label || level}
      </span>
    );
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return FaInfoCircle({ className: "w-2.5 h-2.5 text-blue-600" });
      case 'warning':
        return FaExclamationTriangle({ className: "w-2.5 h-2.5 text-yellow-600" });
      case 'error':
        return FaTimesCircle({ className: "w-2.5 h-2.5 text-red-600" });
      case 'critical':
        return FaExclamationTriangle({ className: "w-2.5 h-2.5 text-red-800" });
      default:
        return FaInfoCircle({ className: "w-2.5 h-2.5 text-gray-600" });
    }
  };

  const getStatusBadge = (statusCode: number) => {
    const isSuccess = statusCode >= 200 && statusCode < 300;
    const isError = statusCode >= 400;
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
        isSuccess 
          ? 'bg-green-100 text-green-800' 
          : isError
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {statusCode}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedLog(null);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading && (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading activity logs...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">
              {FaTimes({ className: "w-12 h-12 mx-auto mb-2" })}
              <p className="text-lg font-medium">Error Loading Activity Logs</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchAuditLogs()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto border-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('timestamp')}>
                      <div className="flex items-center space-x-1">
                        <span>Timestamp</span>
                        {getSortIcon('timestamp')}
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('user_details__username')}>
                      <div className="flex items-center space-x-1">
                        <span>User</span>
                        {getSortIcon('user_details__username')}
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('action')}>
                      <div className="flex items-center space-x-1">
                        <span>Action</span>
                        {getSortIcon('action')}
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('content_type')}>
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {getSortIcon('content_type')}
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('content_object')}>
                      <div className="flex items-center space-x-1">
                        <span>Object</span>
                        {getSortIcon('content_object')}
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('level')}>
                      <div className="flex items-center space-x-1">
                        <span>Level</span>
                        {getSortIcon('level')}
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status_code')}>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status_code')}
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('message')}>
                      <div className="flex items-center space-x-1">
                        <span>Message</span>
                        {getSortIcon('message')}
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 tracking-wider">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {auditLogs.map((log, index) => (
                    <tr key={log.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                            {FaUser({ className: "w-2.5 h-2.5 text-blue-600" })}
                          </div>
                          <div>
                            <div className="font-medium text-xs">{log.user_details?.username || 'Unknown User'}</div>
                            <div className="text-gray-500 text-xs">{log.user_details?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {log.content_type}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        <div className="max-w-xs truncate" title={log.content_object}>
                          {log.content_object || 'N/A'}
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        <div className="flex items-center space-x-1">
                          {getLevelIcon(log.level)}
                          {getLevelBadge(log.level)}
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        {getStatusBadge(log.status_code)}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-900">
                        <div className="max-w-xs truncate" title={log.message}>
                          {log.message}
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        <button
                          onClick={() => handleViewLog(log)}
                          className="p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                          title="View Details"
                        >
                          {FaEye({ className: "w-3 h-3" })}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchAuditLogs(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchAuditLogs(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && auditLogs.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  {FaList({ className: "w-12 h-12 mx-auto mb-2" })}
                  <p className="text-lg font-medium text-gray-600">No Activity Logs Found</p>
                  <p className="text-sm text-gray-500 mt-1">No activity logs match your current filters</p>
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedLog && (
        <ActivityLogDetailModal
          log={selectedLog}
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
};

export default ActivityLogs;
