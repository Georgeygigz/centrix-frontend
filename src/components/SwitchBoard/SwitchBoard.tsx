import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';
import { FeatureFlag, FeatureFlagState } from '../../types/featureFlags';
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
  const [activeTab, setActiveTab] = useState('features');
  
  // Tab-specific sort states
  const [featuresSortBy, setFeaturesSortBy] = useState('');
  const [featuresSortDirection, setFeaturesSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statesSortBy, setStatesSortBy] = useState('');
  const [statesSortDirection, setStatesSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureFlag | null>(null);
  const [editingState, setEditingState] = useState<FeatureFlagState | null>(null);
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

  const [newState, setNewState] = useState<Partial<FeatureFlagState>>({
    feature_flag: '',
    scope_type: '',
    scope_id: null,
    is_enabled: false,
    percentage: 100,
    start_date: null,
    end_date: null
  });

  // Feature flags data from API
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  
  // Feature flag states data from API
  const [featureFlagStates, setFeatureFlagStates] = useState<FeatureFlagState[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  // Load feature flags and feature flag states from API
  useEffect(() => {
    // Only load data if user is authenticated and auth loading is complete
    if (!authLoading && isAuthenticated) {
      console.log('User is authenticated, loading feature flags and states...');
      console.log('Auth token:', apiService.getToken());
      
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Load feature flags
          console.log('Loading feature flags...');
          const featureFlagsData = await apiService.featureFlags.getAll();
          console.log('Feature Flags API Response:', featureFlagsData);
          
          // Handle different response structures for feature flags
          let featureFlags: FeatureFlag[] = [];
          if (featureFlagsData && featureFlagsData.status === 'success' && featureFlagsData.data && featureFlagsData.data.results) {
            console.log('Using correct feature flags API response structure');
            featureFlags = featureFlagsData.data.results;
          } else if (Array.isArray(featureFlagsData)) {
            console.log('Using direct feature flags array response');
            featureFlags = featureFlagsData;
          } else if (featureFlagsData && Array.isArray(featureFlagsData.data)) {
            console.log('Using feature flags data array response');
            featureFlags = featureFlagsData.data;
          } else if (featureFlagsData && featureFlagsData.features && Array.isArray(featureFlagsData.features)) {
            console.log('Using feature flags features array response');
            featureFlags = featureFlagsData.features;
          } else if (featureFlagsData && featureFlagsData.status === 'error') {
            console.warn('Feature flags API returned error:', featureFlagsData.message);
            throw new Error(featureFlagsData.message || 'Feature Flags API Error');
          } else {
            console.warn('Unexpected feature flags API response structure:', featureFlagsData);
            featureFlags = [];
            throw new Error('Unexpected feature flags API response structure');
          }
          
          console.log('Final feature flags:', featureFlags);
          setFeatures(featureFlags);

          // Load feature flag states
          console.log('Loading feature flag states...');
          const featureFlagStatesData = await apiService.featureFlagStates.getAll();
          console.log('Feature Flag States API Response:', featureFlagStatesData);
          
          // Handle different response structures for feature flag states
          let states: FeatureFlagState[] = [];
          if (featureFlagStatesData && featureFlagStatesData.status === 'success' && featureFlagStatesData.data && featureFlagStatesData.data.results) {
            console.log('Using correct feature flag states API response structure');
            states = featureFlagStatesData.data.results;
          } else if (Array.isArray(featureFlagStatesData)) {
            console.log('Using direct feature flag states array response');
            states = featureFlagStatesData;
          } else if (featureFlagStatesData && Array.isArray(featureFlagStatesData.data)) {
            console.log('Using feature flag states data array response');
            states = featureFlagStatesData.data;
          } else if (featureFlagStatesData && featureFlagStatesData.states && Array.isArray(featureFlagStatesData.states)) {
            console.log('Using feature flag states states array response');
            states = featureFlagStatesData.states;
          } else if (featureFlagStatesData && featureFlagStatesData.status === 'error') {
            console.warn('Feature flag states API returned error:', featureFlagStatesData.message);
            // Don't throw error for states, just set empty array
            states = [];
          } else {
            console.warn('Unexpected feature flag states API response structure:', featureFlagStatesData);
            states = [];
          }
          
          console.log('Final feature flag states:', states);
          setFeatureFlagStates(states);
          
        } catch (error) {
          console.error('Error loading data:', error);
          setFeatures([]);
          setFeatureFlagStates([]);
          setToast({
            message: `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
          setTimeout(() => {
            setToast(null);
          }, 5000);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, show empty state or redirect
      console.log('User not authenticated, showing empty state');
      setFeatures([]);
      setFeatureFlagStates([]);
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

    if (featuresSortBy) {
      filtered.sort((a, b) => {
        const aValue = a[featuresSortBy as keyof FeatureFlag];
        const bValue = b[featuresSortBy as keyof FeatureFlag];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return featuresSortDirection === 'asc' ? comparison : -comparison;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          // For boolean values, true comes first in ascending order
          const comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
          return featuresSortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [features, debouncedSearchQuery, featuresSortBy, featuresSortDirection]);

  const filteredAndSortedFeatureFlagStates = useMemo(() => {
    // Ensure feature flag states is always an array
    if (!Array.isArray(featureFlagStates)) {
      console.warn('Feature flag states is not an array:', featureFlagStates);
      return [];
    }

    let filtered = featureFlagStates.filter(state =>
      state.scope_type.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (state.scope_id && state.scope_id.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
      state.feature_flag_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      state.feature_flag_display_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    if (statesSortBy) {
      filtered.sort((a, b) => {
        const aValue = a[statesSortBy as keyof FeatureFlagState];
        const bValue = b[statesSortBy as keyof FeatureFlagState];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return statesSortDirection === 'asc' ? comparison : -comparison;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          // For boolean values, true comes first in ascending order
          const comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
          return statesSortDirection === 'asc' ? comparison : -comparison;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue;
          return statesSortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [featureFlagStates, debouncedSearchQuery, statesSortBy, statesSortDirection]);

  const handleSort = (column: string) => {
    if (activeTab === 'features') {
      if (featuresSortBy === column) {
        setFeaturesSortDirection(featuresSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setFeaturesSortBy(column);
        setFeaturesSortDirection('asc');
      }
    } else if (activeTab === 'feature-flag-states') {
      if (statesSortBy === column) {
        setStatesSortDirection(statesSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setStatesSortBy(column);
        setStatesSortDirection('asc');
      }
    }
  };

  const getSortIcon = (column: string) => {
    if (activeTab === 'features') {
      if (featuresSortBy !== column) {
        return null;
      }
      return featuresSortDirection === 'asc' ? 
        FaChevronUp({ className: "w-3 h-3" }) : 
        FaChevronDown({ className: "w-3 h-3" });
    } else if (activeTab === 'feature-flag-states') {
      if (statesSortBy !== column) {
        return null;
      }
      return statesSortDirection === 'asc' ? 
        FaChevronUp({ className: "w-3 h-3" }) : 
        FaChevronDown({ className: "w-3 h-3" });
    }
    return null;
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

  const openAddStateDrawer = () => {
    setIsAddDrawerOpen(true);
    setActiveSection('basic-info');
    setFormErrors({});
  };

  const closeAddStateDrawer = () => {
    setIsAddDrawerOpen(false);
    setNewState({
      feature_flag: '',
      scope_type: '',
      scope_id: null,
      is_enabled: false,
      percentage: 100,
      start_date: null,
      end_date: null
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

  const handleAddState = async () => {
    try {
      // Format dates properly for the API
      const formatDateForAPI = (dateString: string | null): string | null => {
        if (!dateString) return null;
        // Convert datetime-local format to ISO string
        const date = new Date(dateString);
        return date.toISOString();
      };

      const stateData = {
        feature_flag: newState.feature_flag || '',
        scope_type: newState.scope_type || '',
        scope_id: newState.scope_id ?? null,
        is_enabled: newState.is_enabled ?? false,
        percentage: newState.percentage ?? 100,
        start_date: formatDateForAPI(newState.start_date ?? null),
        end_date: formatDateForAPI(newState.end_date ?? null)
      };

      console.log('Creating new feature flag state with data:', stateData);

      const response = await apiService.featureFlagStates.create(stateData);
      console.log('API Response:', response);
      
      // Handle different response structures
      let newFeatureFlagState: FeatureFlagState;
      if (response && response.status === 'success' && response.data) {
        // Response wrapped in success object
        newFeatureFlagState = response.data;
      } else if (response && response.id) {
        // Direct feature flag state object
        newFeatureFlagState = response;
      } else {
        // Fallback - create a temporary object with the form data
        const relatedFeature = features.find(f => f.id === stateData.feature_flag);
        newFeatureFlagState = {
          id: 'temp-' + Date.now(), // Temporary ID
          feature_flag: stateData.feature_flag,
          feature_flag_name: relatedFeature?.name || '',
          feature_flag_display_name: relatedFeature?.display_name || '',
          scope_type: stateData.scope_type,
          scope_id: stateData.scope_id,
          is_enabled: stateData.is_enabled,
          percentage: stateData.percentage,
          start_date: stateData.start_date,
          end_date: stateData.end_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      setFeatureFlagStates(prev => [...prev, newFeatureFlagState]);
      
      setToast({
        message: 'Feature flag state added successfully!',
        type: 'success'
      });
      
      setFormErrors({});
      
      setNewState({
        feature_flag: '',
        scope_type: '',
        scope_id: null,
        is_enabled: false,
        percentage: 100,
        start_date: null,
        end_date: null
      });
      
      setTimeout(() => {
        closeAddStateDrawer();
      }, 100);
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error adding feature flag state:', error);
      setToast({
        message: 'Failed to add feature flag state. Please try again.',
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

  const handleNewStateInputChange = (field: keyof FeatureFlagState, value: string | boolean | number | null) => {
    setNewState(prev => ({
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

  const handleEditState = (state: FeatureFlagState) => {
    setEditingState(state);
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

  const handleDeleteState = async (state: FeatureFlagState) => {
    try {
      await apiService.featureFlagStates.delete(state.id);
      setFeatureFlagStates(prev => prev.filter(s => s.id !== state.id));
      setOpenDropdownId(null);
      setToast({
        message: 'Feature flag state deleted successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting feature flag state:', error);
      setToast({
        message: 'Failed to delete feature flag state. Please try again.',
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
    setEditingState(null);
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

  const handleSaveState = async () => {
    if (editingState) {
      try {
        // Format dates properly for the API
        const formatDateForAPI = (dateString: string | null): string | null => {
          if (!dateString) return null;
          // Convert datetime-local format to ISO string
          const date = new Date(dateString);
          return date.toISOString();
        };

        const updateData = {
          feature_flag: editingState.feature_flag,
          scope_type: editingState.scope_type,
          scope_id: editingState.scope_id,
          is_enabled: editingState.is_enabled,
          percentage: editingState.percentage,
          start_date: formatDateForAPI(editingState.start_date),
          end_date: formatDateForAPI(editingState.end_date)
        };

        console.log('Updating feature flag state:', editingState.id, 'with data:', updateData);

        const updatedState = await apiService.featureFlagStates.update(editingState.id, updateData);
        
        setFeatureFlagStates(prev => prev.map(s => 
          s.id === editingState.id ? updatedState : s
        ));
        
        setToast({
          message: 'Feature flag state updated successfully!',
          type: 'success'
        });
        
        setEditFormErrors({});
        closeEditDrawer();
        
        setTimeout(() => {
          setToast(null);
        }, 3000);
        
      } catch (error) {
        console.error('Error updating feature flag state:', error);
        setToast({
          message: 'Failed to update feature flag state. Please try again.',
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

  const handleStateInputChange = (field: keyof FeatureFlagState, value: string | boolean | number | null) => {
    if (editingState) {
      setEditingState({
        ...editingState,
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
                  onClick={() => setActiveTab('feature-flag-states')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'feature-flag-states' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Feature Flag States
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
                    placeholder={activeTab === 'feature-flag-states' ? "Search feature flag states..." : "Search feature flags..."}
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
                  value={activeTab === 'features' ? featuresSortBy : activeTab === 'feature-flag-states' ? statesSortBy : ''}
                  onChange={(e) => {
                    if (activeTab === 'features') {
                      setFeaturesSortBy(e.target.value);
                    } else if (activeTab === 'feature-flag-states') {
                      setStatesSortBy(e.target.value);
                    }
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">Sort by</option>
                  {activeTab === 'features' ? (
                    <>
                      <option value="name">Name</option>
                      <option value="display_name">Display Name</option>
                      <option value="feature_type">Feature Type</option>
                      <option value="is_active">Is Active</option>
                      <option value="created_at">Created At</option>
                      <option value="updated_at">Updated At</option>
                    </>
                  ) : activeTab === 'feature-flag-states' ? (
                    <>
                      <option value="feature_flag_name">Feature Flag Name</option>
                      <option value="scope_type">Scope Type</option>
                      <option value="scope_id">Scope Id</option>
                      <option value="is_enabled">Is Enabled</option>
                      <option value="percentage">Percentage</option>
                      <option value="start_date">Start Date</option>
                      <option value="end_date">End Date</option>
                      <option value="updated_at">Updated At</option>
                    </>
                  ) : null}
                </select>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      const loadData = async () => {
                        setIsLoading(true);
                        try {
                          // Refresh feature flags
                          const featureFlagsData = await apiService.featureFlags.getAll();
                          if (featureFlagsData && featureFlagsData.status === 'success' && featureFlagsData.data && featureFlagsData.data.results) {
                            setFeatures(featureFlagsData.data.results);
                          }
                          
                          // Refresh feature flag states
                          const featureFlagStatesData = await apiService.featureFlagStates.getAll();
                          if (featureFlagStatesData && featureFlagStatesData.status === 'success' && featureFlagStatesData.data && featureFlagStatesData.data.results) {
                            setFeatureFlagStates(featureFlagStatesData.data.results);
                          }
                          
                          setToast({
                            message: 'Data refreshed successfully!',
                            type: 'success'
                          });
                        } catch (error) {
                          console.error('Error refreshing data:', error);
                          setToast({
                            message: 'Failed to refresh data',
                            type: 'error'
                          });
                        } finally {
                          setIsLoading(false);
                          setTimeout(() => setToast(null), 3000);
                        }
                      };
                      loadData();
                    }
                  }}
                  disabled={!isAuthenticated || isLoading}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh data"
                >
                  ↻ Refresh
                </button>

                {/* Add New Button */}
                <PermissionGate permissions={['access_admin_panel']}>
                  {activeTab === 'features' && (
                    <button
                      onClick={openAddDrawer}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      + Add Feature
                    </button>
                  )}
                  {activeTab === 'feature-flag-states' && (
                    <button
                      onClick={openAddStateDrawer}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      + Add State
                    </button>
                  )}
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

        {/* Feature Flag States Tab */}
        {activeTab === 'feature-flag-states' && (
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
                <p className="text-xs text-gray-500">Please log in to view feature flag states.</p>
              </div>
            ) : isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading feature flag states...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('feature_flag_name')}>
                        <div className="flex items-center space-x-1">
                          <span>Feature Flag Name</span>
                          {getSortIcon('feature_flag_name')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('scope_type')}>
                        <div className="flex items-center space-x-1">
                          <span>Scope Type</span>
                          {getSortIcon('scope_type')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('scope_id')}>
                        <div className="flex items-center space-x-1">
                          <span>Scope Id</span>
                          {getSortIcon('scope_id')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_enabled')}>
                        <div className="flex items-center space-x-1">
                          <span>Is Enabled</span>
                          {getSortIcon('is_enabled')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('percentage')}>
                        <div className="flex items-center space-x-1">
                          <span>Percentage</span>
                          {getSortIcon('percentage')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('start_date')}>
                        <div className="flex items-center space-x-1">
                          <span>Start Date</span>
                          {getSortIcon('start_date')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('end_date')}>
                        <div className="flex items-center space-x-1">
                          <span>End Date</span>
                          {getSortIcon('end_date')}
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
                    {filteredAndSortedFeatureFlagStates.map((state, index) => (
                      <tr key={state.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {state.feature_flag_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {state.scope_type}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {state.scope_id || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            state.is_enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {state.is_enabled ? 'true' : 'false'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {state.percentage}%
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {state.start_date || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {state.end_date || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {state.updated_at}
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
                                    toggleDropdown(state.id, e);
                                  }}
                                  className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
                                    openDropdownId === state.id 
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
                <h2 className="text-xl font-bold text-gray-900 font-elegant">
                  {activeTab === 'features' ? 'Add New Feature' : 'Add New Feature Flag State'}
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">
                  {activeTab === 'features' ? 'Enter feature information' : 'Enter feature flag state information'}
                </p>
              </div>
              <button
                onClick={activeTab === 'features' ? closeAddDrawer : closeAddStateDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {activeTab === 'features' ? (
                  /* Feature Form */
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
                ) : (
                  /* Feature Flag State Form */
                  <CollapsibleSection 
                    title="Basic Information *" 
                    defaultExpanded={true}
                    isActive={activeSection === 'basic-info'}
                    onSectionClick={() => setActiveSection('basic-info')}
                  >
                    {/* Feature Flag */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Feature Flag *
                      </label>
                      <select
                        value={newState.feature_flag}
                        onChange={(e) => handleNewStateInputChange('feature_flag', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="">Select feature flag</option>
                        {features.map(feature => (
                          <option key={feature.id} value={feature.id}>
                            {feature.display_name} ({feature.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Scope Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Scope Type *
                      </label>
                      <select
                        value={newState.scope_type}
                        onChange={(e) => handleNewStateInputChange('scope_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="">Select scope type</option>
                        <option value="global">Global</option>
                        <option value="school">School</option>
                        <option value="user">User</option>
                      </select>
                    </div>

                    {/* Scope ID */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Scope ID
                      </label>
                      <input
                        type="text"
                        value={newState.scope_id || ''}
                        onChange={(e) => handleNewStateInputChange('scope_id', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter scope ID (optional)"
                      />
                    </div>

                    {/* Is Enabled */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Is Enabled *
                      </label>
                      <select
                        value={newState.is_enabled ? 'true' : 'false'}
                        onChange={(e) => handleNewStateInputChange('is_enabled', e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>

                    {/* Percentage */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Percentage *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newState.percentage}
                        onChange={(e) => handleNewStateInputChange('percentage', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter percentage (0-100)"
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={newState.start_date || ''}
                        onChange={(e) => handleNewStateInputChange('start_date', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={newState.end_date || ''}
                        onChange={(e) => handleNewStateInputChange('end_date', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      />
                    </div>
                  </CollapsibleSection>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={activeTab === 'features' ? closeAddDrawer : closeAddStateDrawer}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={activeTab === 'features' ? handleAddFeature : handleAddState}
                disabled={
                  activeTab === 'features' 
                    ? (!newFeature.name || !newFeature.display_name || !newFeature.description || !newFeature.feature_type)
                    : (!newState.feature_flag || !newState.scope_type)
                }
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {activeTab === 'features' ? 'Add Feature' : 'Add State'}
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
          {(editingFeature || editingState) && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-elegant">
                    {editingFeature ? 'Edit Feature' : 'Edit Feature Flag State'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-modern">
                    {editingFeature ? 'Update feature information' : 'Update feature flag state information'}
                  </p>
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
                  {editingFeature ? (
                    /* Edit Feature Form */
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
                  ) : editingState ? (
                    /* Edit Feature Flag State Form */
                    <CollapsibleSection 
                      title="Basic Information *" 
                      defaultExpanded={true}
                      isActive={editActiveSection === 'basic-info'}
                      onSectionClick={() => setEditActiveSection('basic-info')}
                    >
                      {/* Feature Flag */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Feature Flag *
                        </label>
                        <select
                          value={editingState.feature_flag}
                          onChange={(e) => handleStateInputChange('feature_flag', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        >
                          <option value="">Select feature flag</option>
                          {features.map(feature => (
                            <option key={feature.id} value={feature.id}>
                              {feature.display_name} ({feature.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Scope Type */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Scope Type *
                        </label>
                        <select
                          value={editingState.scope_type}
                          onChange={(e) => handleStateInputChange('scope_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        >
                          <option value="">Select scope type</option>
                          <option value="global">Global</option>
                          <option value="school">School</option>
                          <option value="user">User</option>
                        </select>
                      </div>

                      {/* Scope ID */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Scope ID
                        </label>
                        <input
                          type="text"
                          value={editingState.scope_id || ''}
                          onChange={(e) => handleStateInputChange('scope_id', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                          placeholder="Enter scope ID (optional)"
                        />
                      </div>

                      {/* Is Enabled */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Is Enabled *
                        </label>
                        <select
                          value={editingState.is_enabled ? 'true' : 'false'}
                          onChange={(e) => handleStateInputChange('is_enabled', e.target.value === 'true')}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        >
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      </div>

                      {/* Percentage */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Percentage *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingState.percentage}
                          onChange={(e) => handleStateInputChange('percentage', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                          placeholder="Enter percentage (0-100)"
                        />
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={editingState.start_date ? editingState.start_date.slice(0, 16) : ''}
                          onChange={(e) => handleStateInputChange('start_date', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        />
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          End Date
                        </label>
                        <input
                          type="datetime-local"
                          value={editingState.end_date ? editingState.end_date.slice(0, 16) : ''}
                          onChange={(e) => handleStateInputChange('end_date', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        />
                      </div>
                    </CollapsibleSection>
                  ) : null}
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
                  onClick={editingFeature ? handleSaveFeature : handleSaveState}
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
              {activeTab === 'features' && (
                <>
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
                </>
              )}
              {activeTab === 'feature-flag-states' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const state = featureFlagStates.find(s => s.id === openDropdownId);
                      if (state) {
                        handleEditState(state);
                      }
                    }}
                    className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  >
                    {FaEdit({ className: "w-3 h-3 mr-2" })}
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const state = featureFlagStates.find(s => s.id === openDropdownId);
                      if (state) {
                        handleDeleteState(state);
                      }
                    }}
                    className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    {FaTrash({ className: "w-3 h-3 mr-2" })}
                    Delete
                  </button>
                </>
              )}
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
