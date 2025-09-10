import React, { useState } from 'react';
import { FaSearch, FaFilter, FaTimes, FaList, FaChartBar } from 'react-icons/fa';
import ActivityLogs from './ActivityLogs';
import { useDebounce } from '../../hooks/useDebounce';

const ActivityLog: React.FC = () => {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter state
  const [actionFilter, setActionFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // UI state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('activity-logs');

  // Filter options
  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'view', label: 'View' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'download', label: 'Download' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' },
    { value: 'approve', label: 'Approve' },
    { value: 'reject', label: 'Reject' },
    { value: 'other', label: 'Other' },
  ];

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' },
  ];

  const contentTypeOptions = [
    { value: '', label: 'All Content Types' },
    { value: 'student', label: 'Student' },
    { value: 'user', label: 'User' },
    { value: 'school', label: 'School' },
    { value: 'fee', label: 'Fee' },
    { value: 'payment', label: 'Payment' },
    { value: 'class', label: 'Class' },
    { value: 'stream', label: 'Stream' },
    { value: 'parent', label: 'Parent' },
  ];

  const userOptions = [
    { value: '', label: 'All Users' },
    { value: 'admin', label: 'Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' },
    { value: 'parent', label: 'Parent' },
  ];

  const schoolOptions = [
    { value: '', label: 'All Schools' },
    { value: 'school1', label: 'School 1' },
    { value: 'school2', label: 'School 2' },
    { value: 'school3', label: 'School 3' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Warning' },
  ];

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('');
    setLevelFilter('');
    setContentTypeFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setUserFilter('');
    setSchoolFilter('');
    setStatusFilter('');
    setSortBy('timestamp');
    setSortDirection('desc');
  };

  const hasActiveFilters = searchQuery || actionFilter || levelFilter || contentTypeFilter || startDateFilter || endDateFilter || userFilter || schoolFilter || statusFilter;

  const tabs = [
    { id: 'activity-logs', label: 'Activity Logs', icon: FaList },
    { id: 'statistics', label: 'Statistics', icon: FaChartBar },
    { id: 'reports', label: 'Reports', icon: FaChartBar },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Tabs and Search Bar */}
      <div className="mb-4 bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 py-1.5 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {Icon({ className: "w-3.5 h-3.5" })}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search and Filter Dropdowns */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                {FaSearch({ className: "h-3.5 w-3.5 text-gray-400" })}
              </div>
              <input
                type="text"
                placeholder="Search activity logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-56 pl-8 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Filter Dropdowns */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-28"
            >
              {userOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-28"
            >
              {schoolOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-28"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
            {actionFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Action: {actionOptions.find(opt => opt.value === actionFilter)?.label}
                <button
                  onClick={() => setActionFilter('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
            {levelFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Level: {levelOptions.find(opt => opt.value === levelFilter)?.label}
                <button
                  onClick={() => setLevelFilter('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
            {contentTypeFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Type: {contentTypeOptions.find(opt => opt.value === contentTypeFilter)?.label}
                <button
                  onClick={() => setContentTypeFilter('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
            {startDateFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                From: {startDateFilter}
                <button
                  onClick={() => setStartDateFilter('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
            {endDateFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                To: {endDateFilter}
                <button
                  onClick={() => setEndDateFilter('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-cyan-400 hover:bg-cyan-200 hover:text-cyan-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
            {userFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                User: {userOptions.find(opt => opt.value === userFilter)?.label}
                <button
                  onClick={() => setUserFilter('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
            {schoolFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                School: {schoolOptions.find(opt => opt.value === schoolFilter)?.label}
                <button
                  onClick={() => setSchoolFilter('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-emerald-400 hover:bg-emerald-200 hover:text-emerald-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                Status: {statusOptions.find(opt => opt.value === statusFilter)?.label}
                <button
                  onClick={() => setStatusFilter('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-rose-400 hover:bg-rose-200 hover:text-rose-500"
                >
                  {FaTimes({ className: "w-2 h-2" })}
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'activity-logs' && (
          <ActivityLogs
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            debouncedSearchQuery={debouncedSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            actionFilter={actionFilter}
            setActionFilter={setActionFilter}
            levelFilter={levelFilter}
            setLevelFilter={setLevelFilter}
            contentTypeFilter={contentTypeFilter}
            setContentTypeFilter={setContentTypeFilter}
            startDateFilter={startDateFilter}
            setStartDateFilter={setStartDateFilter}
            endDateFilter={endDateFilter}
            setEndDateFilter={setEndDateFilter}
            clearFilters={clearFilters}
          />
        )}
        {activeTab === 'statistics' && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-gray-400 mb-4">
              {FaChartBar({ className: "w-12 h-12 mx-auto mb-2" })}
              <p className="text-lg font-medium text-gray-600">Statistics Coming Soon</p>
              <p className="text-sm text-gray-500 mt-1">Activity log statistics and analytics will be available here</p>
            </div>
          </div>
        )}
        {activeTab === 'reports' && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-gray-400 mb-4">
              {FaChartBar({ className: "w-12 h-12 mx-auto mb-2" })}
              <p className="text-lg font-medium text-gray-600">Reports Coming Soon</p>
              <p className="text-sm text-gray-500 mt-1">Activity log reports and exports will be available here</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300 ease-out z-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  {FaFilter({ className: "w-5 h-5 text-blue-600" })}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Filter Activity Logs</h2>
                  <p className="text-sm text-gray-500">Refine your search with advanced filters</p>
                </div>
              </div>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Action Filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    Action Type
                  </label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    {actionOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Level Filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Security Level
                  </label>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    {levelOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Content Type Filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                    Content Type
                  </label>
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    {contentTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* User Filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                    User Type
                  </label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    {userOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* School Filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                    School
                  </label>
                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    {schoolOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
