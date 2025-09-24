import React, { useState } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import AssessmentTools from './AssessmentTools';
import AssessmentToolsDrawer from './AssessmentToolsDrawer';
import Subjects from './Subjects';
import StudentAssessments from './StudentAssessments';
import PerformanceAnalytics from './PerformanceAnalytics';
import CompetencyFrameworks from './CompetencyFrameworks';
import { PermissionGate } from '../RBAC';
import { Permission } from '../../types/rbac';

// Tab-specific configurations
const tabConfigs: Record<string, {
  searchPlaceholder: string;
  filterOptions: string[];
  sortOptions: { value: string; label: string }[];
  actionButton: {
    text: string;
    permission: Permission;
  };
}> = {
  'assessment-tools': {
    searchPlaceholder: 'Search assessment tools...',
    filterOptions: ['All', 'Published', 'Draft', 'Exam', 'Test', 'Assignment', 'Project'],
    sortOptions: [
      { value: '', label: 'Sort by' },
      { value: 'name', label: 'Name' },
      { value: 'assessment_type', label: 'Type' },
      { value: 'date_administered', label: 'Date Administered' },
      { value: 'created_at', label: 'Created Date' },
      { value: 'updated_at', label: 'Updated Date' }
    ],
    actionButton: {
      text: 'Add Assessment Tool',
      permission: 'create_assessment' as const
    }
  },
  'subjects': {
    searchPlaceholder: 'Search subjects...',
    filterOptions: ['All', 'Active', 'Inactive'],
    sortOptions: [
      { value: '', label: 'Sort by' },
      { value: 'name', label: 'Name' },
      { value: 'code', label: 'Code' },
      { value: 'is_active', label: 'Status' },
      { value: 'created_at', label: 'Created Date' },
      { value: 'updated_at', label: 'Updated Date' }
    ],
    actionButton: {
      text: 'Add Subject',
      permission: 'create_assessment' as const
    }
  },
  'student-assessments': {
    searchPlaceholder: 'Search student assessments...',
    filterOptions: ['All', 'Completed', 'Pending', 'Absent', 'Exempt'],
    sortOptions: [
      { value: '', label: 'Sort by' },
      { value: 'student_name', label: 'Student Name' },
      { value: 'score', label: 'Score' },
      { value: 'assessment_name', label: 'Assessment' },
      { value: 'date_administered', label: 'Date' },
      { value: 'created_at', label: 'Created Date' }
    ],
    actionButton: {
      text: 'Record Assessment',
      permission: 'create_assessment' as const
    }
  },
  'performance-analytics': {
    searchPlaceholder: 'Search students or classes...',
    filterOptions: ['All', 'Grade A', 'Grade B', 'Grade C', 'Below Average', 'Above Average'],
    sortOptions: [
      { value: '', label: 'Sort by' },
      { value: 'student_name', label: 'Student Name' },
      { value: 'average_score', label: 'Average Score' },
      { value: 'rank', label: 'Rank' },
      { value: 'class_name', label: 'Class' },
      { value: 'term', label: 'Term' }
    ],
    actionButton: {
      text: 'Generate Report',
      permission: 'access_reports' as const
    }
  },
  'competency-frameworks': {
    searchPlaceholder: 'Search competency frameworks...',
    filterOptions: ['All', 'Active', 'Inactive', 'PP1', 'PP2', 'Grade 1-3', 'Grade 4-6', 'Grade 7-9', 'Grade 10-12'],
    sortOptions: [
      { value: '', label: 'Sort by' },
      { value: 'name', label: 'Name' },
      { value: 'code', label: 'Code' },
      { value: 'grade_level', label: 'Grade Level' },
      { value: 'order', label: 'Order' },
      { value: 'created_at', label: 'Created Date' }
    ],
    actionButton: {
      text: 'Add Framework',
      permission: 'create_assessment' as const
    }
  }
};

const Assessments: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('assessment-tools');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isAssessmentDrawerOpen, setIsAssessmentDrawerOpen] = useState(false);

  // Get current tab configuration
  const currentConfig = tabConfigs[activeTab as keyof typeof tabConfigs];

  // Handle tab change with context reset
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setSortBy('');
    setSelectedFilter('All');
  };

  // Handle action button click
  const handleActionButtonClick = () => {
    if (activeTab === 'assessment-tools') {
      setIsAssessmentDrawerOpen(true);
    }
    // Add other tab actions here as needed
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4">
        {/* Header with tabs, search and filters */}
        <div className="bg-white rounded-md shadow-sm p-4 mb-4">
          {/* Tabs and Controls Row */}
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <nav className="flex space-x-6">
              <button 
                onClick={() => handleTabChange('assessment-tools')}
                className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'assessment-tools' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Assessment Tools
              </button>
              <button 
                onClick={() => handleTabChange('subjects')}
                className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'subjects' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subjects
              </button>
              <button 
                onClick={() => handleTabChange('student-assessments')}
                className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'student-assessments' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Student Assessments
              </button>
              <button 
                onClick={() => handleTabChange('performance-analytics')}
                className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'performance-analytics' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance Analytics
              </button>
              <button 
                onClick={() => handleTabChange('competency-frameworks')}
                className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'competency-frameworks' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Competency Frameworks
              </button>
            </nav>

            {/* Search, Filter, Sort Controls and Add Button */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={currentConfig.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-colors duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  {FaSearch({ className: "h-3 w-3 text-gray-400" })}
                </div>
              </div>

              {/* Filter */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              >
                {currentConfig.filterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              >
                {currentConfig.sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Dynamic Action Button */}
              <PermissionGate permissions={[currentConfig.actionButton.permission]}>
                <button 
                  onClick={handleActionButtonClick}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center space-x-1"
                >
                  {FaPlus({ className: "w-3 h-3" })}
                  <span>{currentConfig.actionButton.text}</span>
                </button>
              </PermissionGate>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'assessment-tools' && <AssessmentTools />}
        {activeTab === 'subjects' && <Subjects />}
        {activeTab === 'student-assessments' && <StudentAssessments />}
        {activeTab === 'performance-analytics' && <PerformanceAnalytics />}
        {activeTab === 'competency-frameworks' && <CompetencyFrameworks />}

        {/* Assessment Tools Drawer */}
        <AssessmentToolsDrawer
          isOpen={isAssessmentDrawerOpen}
          onClose={() => setIsAssessmentDrawerOpen(false)}
          onSuccess={() => {
            setIsAssessmentDrawerOpen(false);
            // The AssessmentTools component will automatically refresh its data
          }}
        />
      </div>
    </div>
  );
};

export default Assessments;
