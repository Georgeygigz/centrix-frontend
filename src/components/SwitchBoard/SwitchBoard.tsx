import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';
import { FeatureFlag } from '../../types/featureFlags';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Collapsible Section Component (same as Students)
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isActive?: boolean;
  onSectionClick?: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children, 
  defaultExpanded = true,
  isActive = false,
  onSectionClick
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    if (onSectionClick) {
      onSectionClick();
    }
  };

  return (
    <div className={`border rounded-lg transition-all duration-200 ${
      isActive 
        ? 'border-blue-300 bg-blue-50/30' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <button
        onClick={handleClick}
        className={`w-full px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all duration-200 rounded-t-lg ${
          isActive
            ? 'text-blue-900 bg-blue-100/50 hover:bg-blue-100'
            : 'text-gray-900 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <span>{title}</span>
        {isExpanded ? 
          FaChevronUp({ className: `w-4 h-4 transition-colors duration-200 ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }` }) : 
          FaChevronDown({ className: `w-4 h-4 transition-colors duration-200 ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }` })
        }
      </button>
      {isExpanded && (
        <div className={`p-4 space-y-4 transition-all duration-200 ${
          isActive ? 'bg-blue-50/20' : ''
        }`}>
          {children}
        </div>
      )}
    </div>
  );
};

// Feature interface removed - using FeatureFlag from types instead

const SwitchBoard: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('features');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureFlag | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  const [editActiveSection, setEditActiveSection] = useState<string>('basic-info');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string[] }>({});

  const [newFeature, setNewFeature] = useState<Partial<FeatureFlag>>({
    name: '',
    display_name: '',
    description: '',
    feature_type: '',
    is_active: true
  });

  // Feature flags data from API
  const [features, setFeatures] = useState<FeatureFlag[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  // Load feature flags from API
  useEffect(() => {
    // Only load feature flags if user is authenticated and auth loading is complete
    if (!authLoading && isAuthenticated) {
      console.log('User is authenticated, loading feature flags...');
      console.log('Auth token:', apiService.getToken());
      
      const loadFeatureFlags = async () => {
        setIsLoading(true);
        try {
          console.log('Loading feature flags...');
          const data = await apiService.featureFlags.getAll();
          console.log('API Response:', data); // Debug log
          
          // Handle different response structures
          let featureFlags: FeatureFlag[] = [];
          if (data && data.status === 'success' && data.data && data.data.results) {
            // Correct API response structure
            console.log('Using correct API response structure');
            featureFlags = data.data.results;
          } else if (Array.isArray(data)) {
            console.log('Using direct array response');
            featureFlags = data;
          } else if (data && Array.isArray(data.data)) {
            console.log('Using data array response');
            featureFlags = data.data;
          } else if (data && data.features && Array.isArray(data.features)) {
            console.log('Using features array response');
            featureFlags = data.features;
          } else if (data && data.status === 'error') {
            console.warn('API returned error:', data.message);
            // API returned an error (like authentication required)
            throw new Error(data.message || 'API Error');
          } else {
            console.warn('Unexpected API response structure:', data);
            console.log('Response type:', typeof data);
            console.log('Response keys:', data ? Object.keys(data) : 'null/undefined');
            // Don't use fallback data - show empty state instead
            featureFlags = [];
            throw new Error('Unexpected API response structure');
          }
          
          console.log('Final feature flags:', featureFlags);
          setFeatures(featureFlags);
        } catch (error) {
          console.error('Error loading feature flags:', error);
          setFeatures([]);
          setToast({
            message: `Failed to load feature flags: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
          setTimeout(() => {
            setToast(null);
          }, 5000);
        } finally {
          setIsLoading(false);
        }
      };

      loadFeatureFlags();
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, show empty state or redirect
      console.log('User not authenticated, showing empty state');
      setFeatures([]);
    }
  }, [isAuthenticated, authLoading]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredAndSortedFeatures = useMemo(() => {
    // Ensure features is always an array
    if (!Array.isArray(features)) {
      console.warn('Features is not an array:', features);
      return [];
    }

    let filtered = features.filter(feature =>
      feature.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      feature.display_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      feature.feature_type.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof FeatureFlag];
        const bValue = b[sortBy as keyof FeatureFlag];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          // For boolean values, true comes first in ascending order
          const comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [features, debouncedSearchQuery, sortBy, sortDirection]);

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

  const openAddDrawer = () => {
    setIsAddDrawerOpen(true);
    setActiveSection('basic-info');
    setFormErrors({});
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    setNewFeature({
      name: '',
      display_name: '',
      description: '',
      feature_type: '',
      is_active: true
    });
  };

  const handleAddFeature = async () => {
    try {
      const featureData = {
        name: newFeature.name || '',
        display_name: newFeature.display_name || '',
        description: newFeature.description || '',
        feature_type: newFeature.feature_type || '',
        is_active: newFeature.is_active ?? true
      };

      const newFeatureFlag = await apiService.featureFlags.create(featureData);
      setFeatures(prev => [...prev, newFeatureFlag]);
      
      setToast({
        message: 'Feature flag added successfully!',
        type: 'success'
      });
      
      setFormErrors({});
      
      setNewFeature({
        name: '',
        display_name: '',
        description: '',
        feature_type: '',
        is_active: true
      });
      
      setTimeout(() => {
        closeAddDrawer();
      }, 100);
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error adding feature flag:', error);
      setToast({
        message: 'Failed to add feature flag. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const handleNewFeatureInputChange = (field: keyof FeatureFlag, value: string | boolean) => {
    setNewFeature(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEditFeature = (feature: FeatureFlag) => {
    setEditingFeature(feature);
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
    setEditActiveSection('basic-info');
    setEditFormErrors({});
  };

  const handleDeleteFeature = async (feature: FeatureFlag) => {
    try {
      await apiService.featureFlags.delete(feature.id);
      setFeatures(prev => prev.filter(f => f.id !== feature.id));
      setOpenDropdownId(null);
      setToast({
        message: 'Feature flag deleted successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      setToast({
        message: 'Failed to delete feature flag. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingFeature(null);
    setEditFormErrors({});
  };

  const handleSaveFeature = async () => {
    if (editingFeature) {
      try {
        const updatedFeature = await apiService.featureFlags.update(editingFeature.id, {
          name: editingFeature.name,
          display_name: editingFeature.display_name,
          description: editingFeature.description,
          feature_type: editingFeature.feature_type,
          is_active: editingFeature.is_active
        });
        
        setFeatures(prev => prev.map(f => 
          f.id === editingFeature.id ? updatedFeature : f
        ));
        
        setToast({
          message: 'Feature flag updated successfully!',
          type: 'success'
        });
        
        setEditFormErrors({});
        closeEditDrawer();
        
        setTimeout(() => {
          setToast(null);
        }, 3000);
        
      } catch (error) {
        console.error('Error updating feature flag:', error);
        setToast({
          message: 'Failed to update feature flag. Please try again.',
          type: 'error'
        });
        
        setTimeout(() => {
          setToast(null);
        }, 5000);
      }
    }
  };

  const handleInputChange = (field: keyof FeatureFlag, value: string | boolean) => {
    if (editingFeature) {
      setEditingFeature({
        ...editingFeature,
        [field]: value
      });
      
      if (editFormErrors[field]) {
        setEditFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown-container]') && !target.closest('[data-portal-dropdown]')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (featureId: string, event: React.MouseEvent) => {
    if (openDropdownId === featureId) {
      setOpenDropdownId(null);
    } else {
      const button = event.currentTarget as HTMLElement;
      const buttonRect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 80;
      const dropdownWidth = 128;
      
      let x = buttonRect.right - dropdownWidth;
      let y = buttonRect.bottom + 4;
      
      if (buttonRect.bottom + dropdownHeight > viewportHeight) {
        y = buttonRect.top - dropdownHeight - 4;
      }
      
      if (x < 0) x = 0;
      if (x + dropdownWidth > viewportWidth) x = viewportWidth - dropdownWidth;
      
      setDropdownCoords({ x, y });
      setOpenDropdownId(featureId);
    }
  };

// getStatusBadge function removed - no longer needed since we show raw boolean values

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4">
        {/* Header with tabs, search and filters */}
        <div className="bg-white rounded-md shadow-sm p-4 mb-4">
          {/* Tabs and Controls Row */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <nav className="flex space-x-6">
                <button 
                  onClick={() => setActiveTab('features')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'features' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Feature Flags
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'settings' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Settings
                </button>
                <button 
                  onClick={() => setActiveTab('logs')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'logs' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Logs
                </button>
              </nav>

              {/* Search, Filter, and Sort Controls */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search feature flags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {FaSearch({ className: "h-3 w-3 text-gray-400" })}
                  </div>
                </div>

                {/* Filter */}
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200">
                  Filter
                </button>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">Sort by</option>
                  <option value="name">Name</option>
                  <option value="display_name">Display Name</option>
                  <option value="feature_type">Feature Type</option>
                  <option value="is_active">Is Active</option>
                  <option value="created_at">Created At</option>
                  <option value="updated_at">Updated At</option>
                </select>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      const loadFeatureFlags = async () => {
                        setIsLoading(true);
                        try {
                          const data = await apiService.featureFlags.getAll();
                          if (data && data.status === 'success' && data.data && data.data.results) {
                            setFeatures(data.data.results);
                            setToast({
                              message: 'Feature flags refreshed successfully!',
                              type: 'success'
                            });
                          }
                        } catch (error) {
                          console.error('Error refreshing feature flags:', error);
                          setToast({
                            message: 'Failed to refresh feature flags',
                            type: 'error'
                          });
                        } finally {
                          setIsLoading(false);
                          setTimeout(() => setToast(null), 3000);
                        }
                      };
                      loadFeatureFlags();
                    }
                  }}
                  disabled={!isAuthenticated || isLoading}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh feature flags"
                >
                  ↻ Refresh
                </button>

                {/* Add New Feature Button */}
                <PermissionGate permissions={['access_admin_panel']}>
                  <button
                    onClick={openAddDrawer}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    + Add Feature
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'features' && (
          <div className="bg-white rounded-md shadow-sm">
            {authLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading authentication...</p>
              </div>
            ) : !isAuthenticated ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Authentication Required</h3>
                <p className="text-xs text-gray-500">Please log in to view feature flags.</p>
              </div>
            ) : isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading feature flags...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('display_name')}>
                        <div className="flex items-center space-x-1">
                          <span>Display Name</span>
                          {getSortIcon('display_name')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Description</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('feature_type')}>
                        <div className="flex items-center space-x-1">
                          <span>Feature Type</span>
                          {getSortIcon('feature_type')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_active')}>
                        <div className="flex items-center space-x-1">
                          <span>Is Active</span>
                          {getSortIcon('is_active')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Created At</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('updated_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Updated At</span>
                          {getSortIcon('updated_at')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedFeatures.map((feature, index) => (
                      <tr key={feature.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {feature.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {feature.display_name}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-900 max-w-xs truncate">
                          {feature.description}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {feature.feature_type}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            feature.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {feature.is_active ? 'true' : 'false'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {feature.created_at}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {feature.updated_at}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 relative">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {/* View details */}}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                              title="View Details"
                            >
                              {FaEye({ className: "w-3 h-3" })}
                            </button>
                            
                            {/* Dropdown Menu */}
                            <PermissionGate permissions={['access_admin_panel']}>
                              <div className="relative" data-dropdown-container>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleDropdown(feature.id, e);
                                  }}
                                  className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
                                    openDropdownId === feature.id 
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
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Switch Board Settings</h3>
              <p className="text-xs text-gray-500">Configure system settings and preferences.</p>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">System Logs</h3>
              <p className="text-xs text-gray-500">View system activity and error logs.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Feature Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isAddDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isAddDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <>
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-elegant">Add New Feature</h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">Enter feature information</p>
              </div>
              <button
                onClick={closeAddDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Basic Info Section */}
                <CollapsibleSection 
                  title="Basic Information *" 
                  defaultExpanded={true}
                  isActive={activeSection === 'basic-info'}
                  onSectionClick={() => setActiveSection('basic-info')}
                >
                  {/* Feature Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Feature Name *
                    </label>
                    <input
                      type="text"
                      value={newFeature.name}
                      onChange={(e) => handleNewFeatureInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter feature name (e.g., student_admission_billing)"
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={newFeature.display_name}
                      onChange={(e) => handleNewFeatureInputChange('display_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter display name (e.g., Student Admission Billing Control)"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Description *
                    </label>
                    <textarea
                      value={newFeature.description}
                      onChange={(e) => handleNewFeatureInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs"
                      placeholder="Enter feature description"
                    />
                  </div>

                  {/* Feature Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Feature Type *
                    </label>
                    <select
                      value={newFeature.feature_type}
                      onChange={(e) => handleNewFeatureInputChange('feature_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="">Select feature type</option>
                      <option value="billing">Billing</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="test">Test</option>
                      <option value="core">Core</option>
                      <option value="academic">Academic</option>
                      <option value="financial">Financial</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Status *
                    </label>
                    <select
                      value={newFeature.is_active ? 'true' : 'false'}
                      onChange={(e) => handleNewFeatureInputChange('is_active', e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </CollapsibleSection>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={closeAddDrawer}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeature}
                disabled={!newFeature.name || !newFeature.display_name || !newFeature.description || !newFeature.feature_type}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Add Feature
              </button>
            </div>
          </>
        </div>
      </div>

      {/* Edit Feature Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isEditDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isEditDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {editingFeature && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-elegant">Edit Feature</h2>
                  <p className="text-xs text-gray-500 mt-1 font-modern">Update feature information</p>
                </div>
                <button
                  onClick={closeEditDrawer}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-4 h-4" })}
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-4">
                  {/* Basic Info Section */}
                  <CollapsibleSection 
                    title="Basic Information *" 
                    defaultExpanded={true}
                    isActive={editActiveSection === 'basic-info'}
                    onSectionClick={() => setEditActiveSection('basic-info')}
                  >
                    {/* Feature Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Feature Name *
                      </label>
                      <input
                        type="text"
                        value={editingFeature.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter feature name (e.g., student_admission_billing)"
                      />
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        value={editingFeature.display_name}
                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter display name (e.g., Student Admission Billing Control)"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Description *
                      </label>
                      <textarea
                        value={editingFeature.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs"
                        placeholder="Enter feature description"
                      />
                    </div>

                    {/* Feature Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Feature Type *
                      </label>
                      <select
                        value={editingFeature.feature_type}
                        onChange={(e) => handleInputChange('feature_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="">Select feature type</option>
                        <option value="billing">Billing</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="test">Test</option>
                        <option value="core">Core</option>
                        <option value="academic">Academic</option>
                        <option value="financial">Financial</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Status *
                      </label>
                      <select
                        value={editingFeature.is_active ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </CollapsibleSection>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={closeEditDrawer}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFeature}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Portal-based Dropdown */}
      {openDropdownId && createPortal(
        <div 
          className="fixed w-32 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
          data-portal-dropdown
          style={{
            left: `${dropdownCoords.x}px`,
            top: `${dropdownCoords.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <PermissionGate permissions={['access_admin_panel']}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const feature = features.find(f => f.id === openDropdownId);
                  if (feature) {
                    handleEditFeature(feature);
                  }
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
              >
                {FaEdit({ className: "w-3 h-3 mr-2" })}
                Edit
              </button>
            </PermissionGate>
            <PermissionGate permissions={['access_admin_panel']}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const feature = features.find(f => f.id === openDropdownId);
                  if (feature) {
                    handleDeleteFeature(feature);
                  }
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
              >
                {FaTrash({ className: "w-3 h-3 mr-2" })}
                Delete
              </button>
            </PermissionGate>
          </div>
        </div>,
        document.body
      )}
      
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

export default SwitchBoard;
