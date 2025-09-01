import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';
import { FeatureFlag, FeatureFlagState } from '../../types/featureFlags';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';



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
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Load feature flags
          const featureFlagsData = await apiService.featureFlags.getAll();
          
          // Handle different response structures for feature flags
          let featureFlags: FeatureFlag[] = [];
          if (featureFlagsData && featureFlagsData.status === 'success' && featureFlagsData.data && featureFlagsData.data.results) {
            featureFlags = featureFlagsData.data.results;
          } else if (Array.isArray(featureFlagsData)) {
            featureFlags = featureFlagsData;
          } else if (featureFlagsData && Array.isArray(featureFlagsData.data)) {
            featureFlags = featureFlagsData.data;
          } else if (featureFlagsData && featureFlagsData.features && Array.isArray(featureFlagsData.features)) {
            featureFlags = featureFlagsData.features;
          } else if (featureFlagsData && featureFlagsData.status === 'error') {
            throw new Error(featureFlagsData.message || 'Feature Flags API Error');
          } else {
            featureFlags = [];
            throw new Error('Unexpected feature flags API response structure');
          }
          
          setFeatures(featureFlags);

          // Load feature flag states
          const featureFlagStatesData = await apiService.featureFlagStates.getAll();
          
          // Handle different response structures for feature flag states
          let states: FeatureFlagState[] = [];
          if (featureFlagStatesData && featureFlagStatesData.status === 'success' && featureFlagStatesData.data && featureFlagStatesData.data.results) {
            states = featureFlagStatesData.data.results;
          } else if (Array.isArray(featureFlagStatesData)) {
            states = featureFlagStatesData;
          } else if (featureFlagStatesData && Array.isArray(featureFlagStatesData.data)) {
            states = featureFlagStatesData.data;
          } else if (featureFlagStatesData && featureFlagStatesData.states && Array.isArray(featureFlagStatesData.states)) {
            states = featureFlagStatesData.states;
          } else if (featureFlagStatesData && featureFlagStatesData.status === 'error') {
            // Don't throw error for states, just set empty array
            states = [];
          } else {
            states = [];
          }
          
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

    console.log('Filtering features:', features.length, 'features');
    console.log('Search query:', debouncedSearchQuery);
    
    let filtered = features.filter(feature => {
      const searchQuery = debouncedSearchQuery.toLowerCase();
      
      const matches = (
        (feature.name && feature.name.toLowerCase().includes(searchQuery)) ||
        (feature.display_name && feature.display_name.toLowerCase().includes(searchQuery)) ||
        (feature.description && feature.description.toLowerCase().includes(searchQuery)) ||
        (feature.feature_type && feature.feature_type.toLowerCase().includes(searchQuery))
      );
      
      if (!matches) {
        console.log('Feature filtered out:', feature.name, 'search query:', searchQuery);
      }
      
      return matches;
    });

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

    let filtered = featureFlagStates.filter(state => {
      const searchQuery = debouncedSearchQuery.toLowerCase();
      
      return (
        (state.scope_type && state.scope_type.toLowerCase().includes(searchQuery)) ||
        (state.scope_id && state.scope_id.toString().toLowerCase().includes(searchQuery)) ||
        (state.feature_flag_name && state.feature_flag_name.toLowerCase().includes(searchQuery)) ||
        (state.feature_flag_display_name && state.feature_flag_display_name.toLowerCase().includes(searchQuery))
      );
    });

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

      const response: any = await apiService.featureFlags.create(featureData);
      
      // Debug logging to understand the response structure
      console.log('Create response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'No response');
      
      // Extract the created feature data from the response
      let newFeatureFlagData: FeatureFlag;
      if (response && typeof response === 'object' && 'status' in response) {
        if (response.status === 'success' && response.data) {
          newFeatureFlagData = response.data as FeatureFlag;
        } else if (response.status === 'error') {
          throw new Error(response.message || 'API returned error status');
        } else if (response.data) {
          newFeatureFlagData = response.data as FeatureFlag;
        } else {
          throw new Error('API response missing data');
        }
      } else if (response && typeof response === 'object') {
        newFeatureFlagData = response as FeatureFlag;
      } else {
        throw new Error('Invalid response format received from API');
      }
      
      console.log('Extracted new feature data:', newFeatureFlagData);
      
      // Validate that the new feature has required fields
      if (!newFeatureFlagData.id || !newFeatureFlagData.name || !newFeatureFlagData.display_name) {
        console.error('New feature missing required fields:', newFeatureFlagData);
        throw new Error('New feature is missing required fields');
      }
      
      setFeatures(prev => [...prev, newFeatureFlagData]);
      
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
      
      // Clear search query to ensure the new feature is visible
      setSearchQuery('');
      
      setTimeout(() => {
        closeAddDrawer();
      }, 100);
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error adding feature flag:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
        setToast({
          message: error.response.data.message || 'Please fix the validation errors below.',
          type: 'error'
        });
      } else {
        setFormErrors({});
        setToast({
          message: 'Failed to add feature flag. Please try again.',
          type: 'error'
        });
      }
      
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

      const response = await apiService.featureFlagStates.create(stateData);
      
      // Log the response for debugging
      console.log('Feature flag state creation response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'No response');
      console.log('Response status:', response?.status);
      console.log('Response data:', response?.data);
      console.log('Response has id:', response?.id);
      
      // Handle different response structures
      let newFeatureFlagState: FeatureFlagState;
      
      if (response && response.status === 'success' && response.data) {
        // Response wrapped in success object
        newFeatureFlagState = response.data;
        console.log('Using response.data:', newFeatureFlagState);
        
        // If the response.data doesn't have an ID, we need to fetch the created feature flag state
        if (!newFeatureFlagState.id) {
          console.log('Response data missing ID, attempting to fetch created feature flag state...');
          
          try {
            // Try to fetch the feature flag states to get the newly created one
            const allStates = await apiService.featureFlagStates.getAll();
            console.log('All feature flag states:', allStates);
            
                         // Find the most recently created state that matches our data
             if (allStates && allStates.data && Array.isArray(allStates.data)) {
               const matchingState = allStates.data.find((state: any) => 
                 state.feature_flag === stateData.feature_flag &&
                 state.scope_type === stateData.scope_type &&
                 state.scope_id === stateData.scope_id &&
                 state.is_enabled === stateData.is_enabled &&
                 state.percentage === stateData.percentage
               );
              
              if (matchingState && matchingState.id) {
                newFeatureFlagState = matchingState;
                console.log('Found matching feature flag state with ID:', newFeatureFlagState);
              } else {
                console.error('Could not find matching feature flag state in the list');
                throw new Error('Feature flag state created but could not retrieve ID. Please refresh the page.');
              }
            } else {
              console.error('Could not fetch feature flag states list');
              throw new Error('Feature flag state created but could not retrieve ID. Please refresh the page.');
            }
          } catch (fetchError) {
            console.error('Error fetching feature flag states:', fetchError);
            throw new Error('Feature flag state created but could not retrieve ID. Please refresh the page.');
          }
        }
      } else if (response && response.id) {
        // Direct feature flag state object
        newFeatureFlagState = response;
        console.log('Using direct response:', newFeatureFlagState);
      } else {
        // Log error details
        console.error('Unexpected API response structure:', response);
        console.error('Response structure details:', {
          hasResponse: !!response,
          responseType: typeof response,
          isArray: Array.isArray(response),
          keys: response ? Object.keys(response) : [],
          hasId: response && response.id,
          hasStatus: response && response.status,
          hasData: response && response.data
        });
        throw new Error('Invalid response from server. Please try again.');
      }
      
      // Final validation that we have a proper ID
      if (!newFeatureFlagState.id || newFeatureFlagState.id.toString().startsWith('temp-')) {
        console.error('Invalid feature flag state ID:', newFeatureFlagState.id);
        throw new Error('Server returned invalid ID. Please try again.');
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
      
    } catch (error: any) {
      console.error('Error adding feature flag state:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
        setToast({
          message: error.response.data.message || 'Please fix the validation errors below.',
          type: 'error'
        });
      } else {
        setFormErrors({});
        setToast({
          message: 'Failed to add feature flag state. Please try again.',
          type: 'error'
        });
      }
      
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
    setEditFormErrors({});
  };

  const handleEditState = (state: FeatureFlagState) => {
    setEditingState(state);
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
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
        const response: any = await apiService.featureFlags.update(editingFeature.id, {
          name: editingFeature.name,
          display_name: editingFeature.display_name,
          description: editingFeature.description,
          feature_type: editingFeature.feature_type,
          is_active: editingFeature.is_active
        });
        
        // Debug logging to understand the response structure
        console.log('Update response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'No response');
        
        // Extract the updated feature data from the response
        let updatedFeatureData: Partial<FeatureFlag>;
        if (response && typeof response === 'object' && 'status' in response) {
          if (response.status === 'success' && response.data) {
            updatedFeatureData = response.data as Partial<FeatureFlag>;
          } else if (response.status === 'error') {
            throw new Error(response.message || 'API returned error status');
          } else if (response.data) {
            updatedFeatureData = response.data as Partial<FeatureFlag>;
          } else {
            throw new Error('API response missing data');
          }
        } else if (response && typeof response === 'object') {
          updatedFeatureData = response as Partial<FeatureFlag>;
        } else {
          throw new Error('Invalid response format received from API');
        }
        
        console.log('Extracted updated feature data:', updatedFeatureData);
        
        // Create a complete updated feature by merging existing data with updates
        const completeUpdatedFeature: FeatureFlag = {
          ...editingFeature,
          ...updatedFeatureData,
          // Ensure these fields are explicitly updated
          name: editingFeature.name,
          display_name: editingFeature.display_name,
          description: editingFeature.description,
          feature_type: editingFeature.feature_type,
          is_active: editingFeature.is_active,
          // Update timestamp to show it was just modified
          updated_at: new Date().toISOString()
        };
        
        // Validate that all required fields are present
        if (!completeUpdatedFeature.id || !completeUpdatedFeature.name || !completeUpdatedFeature.display_name) {
          console.error('Updated feature missing required fields:', completeUpdatedFeature);
          throw new Error('Updated feature is missing required fields');
        }
        
        console.log('Complete updated feature:', completeUpdatedFeature);
        
        console.log('Previous features state:', features);
        console.log('Editing feature ID:', editingFeature.id);
        console.log('Editing feature ID type:', typeof editingFeature.id);
        
        setFeatures(prev => {
          const updated = prev.map(f => {
            console.log('Comparing feature ID:', f.id, 'with editing ID:', editingFeature.id, 'match:', f.id === editingFeature.id);
            return f.id === editingFeature.id ? completeUpdatedFeature : f;
          });
          console.log('Updated features state:', updated);
          return updated;
        });
        
        setToast({
          message: 'Feature flag updated successfully!',
          type: 'success'
        });
        
        setEditFormErrors({});
        closeEditDrawer();
        
        // Clear search query to ensure the updated feature is visible
        setSearchQuery('');
        
        setTimeout(() => {
          setToast(null);
        }, 3000);
        
      } catch (error: any) {
        console.error('Error updating feature flag:', error);
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          setEditFormErrors(error.response.data.errors);
          setToast({
            message: error.response.data.message || 'Please fix the validation errors below.',
            type: 'error'
          });
        } else {
          setEditFormErrors({});
          setToast({
            message: 'Failed to update feature flag. Please try again.',
            type: 'error'
          });
        }
        
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



        const updatedState = await apiService.featureFlagStates.update(editingState.id, updateData);
        
        // Create a complete updated state by merging existing data with updates
        const completeUpdatedState = {
          ...editingState,
          ...updatedState,
          // Ensure these fields are explicitly updated
          scope_type: updateData.scope_type,
          scope_id: updateData.scope_id,
          is_enabled: updateData.is_enabled,
          percentage: updateData.percentage,
          start_date: updateData.start_date,
          end_date: updateData.end_date,
          // Update timestamp to show it was just modified
          updated_at: new Date().toISOString()
        };
        
        // Update the state with the complete object
        setFeatureFlagStates(prev => prev.map(s => 
          s.id === editingState.id ? completeUpdatedState : s
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
        
      } catch (error: any) {
        console.error('Error updating feature flag state:', error);
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          setEditFormErrors(error.response.data.errors);
          setToast({
            message: error.response.data.message || 'Please fix the validation errors below.',
            type: 'error'
          });
        } else {
          setEditFormErrors({});
          setToast({
            message: 'Failed to update feature flag state. Please try again.',
            type: 'error'
          });
        }
        
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('display_name')}>
                        <div className="flex items-center space-x-1">
                          <span>Display Name</span>
                          {getSortIcon('display_name')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Description</span>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('feature_type')}>
                        <div className="flex items-center space-x-1">
                          <span>Feature Type</span>
                          {getSortIcon('feature_type')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_active')}>
                        <div className="flex items-center space-x-1">
                          <span>Is Active</span>
                          {getSortIcon('is_active')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Created At</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('updated_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Updated At</span>
                          {getSortIcon('updated_at')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredAndSortedFeatures.map((feature, index) => (
                      <tr key={feature.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                          {feature.name}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                          {feature.display_name}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-900 max-w-xs truncate">
                          {feature.description}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {feature.feature_type}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            feature.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {feature.is_active ? 'true' : 'false'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {feature.created_at}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {feature.updated_at}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('feature_flag_name')}>
                        <div className="flex items-center space-x-1">
                          <span>Feature Flag Name</span>
                          {getSortIcon('feature_flag_name')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('scope_type')}>
                        <div className="flex items-center space-x-1">
                          <span>Scope Type</span>
                          {getSortIcon('scope_type')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('scope_id')}>
                        <div className="flex items-center space-x-1">
                          <span>Scope Id</span>
                          {getSortIcon('scope_id')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('school_name')}>
                        <div className="flex items-center space-x-1">
                          <span>School Name</span>
                          {getSortIcon('school_name')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('username')}>
                        <div className="flex items-center space-x-1">
                          <span>Username</span>
                          {getSortIcon('username')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_enabled')}>
                        <div className="flex items-center space-x-1">
                          <span>Is Enabled</span>
                          {getSortIcon('is_enabled')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('percentage')}>
                        <div className="flex items-center space-x-1">
                          <span>Percentage</span>
                          {getSortIcon('percentage')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('start_date')}>
                        <div className="flex items-center space-x-1">
                          <span>Start Date</span>
                          {getSortIcon('start_date')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('end_date')}>
                        <div className="flex items-center space-x-1">
                          <span>End Date</span>
                          {getSortIcon('end_date')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('updated_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Updated At</span>
                          {getSortIcon('updated_at')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredAndSortedFeatureFlagStates.map((state, index) => (
                      <tr key={state.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                          {state.feature_flag_name}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {state.scope_type}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {state.scope_id || '-'}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {state.school_name || '-'}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {state.username || '-'}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            state.is_enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {state.is_enabled ? 'true' : 'false'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {state.percentage}%
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {state.start_date || '-'}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {state.end_date || '-'}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {state.updated_at}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
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
      {isAddDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeTab === 'features' ? 'Add New Feature' : 'Add New Feature Flag State'}
                </h2>
              </div>
              <button
                onClick={activeTab === 'features' ? closeAddDrawer : closeAddStateDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* General Error Banner */}
              {Object.keys(formErrors).length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="p-1 bg-red-100 rounded-full">
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">Please fix the errors below</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'features' ? (
                /* Feature Form */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                      Feature Name *
                    </label>
                    <input
                      type="text"
                      value={newFeature.name}
                      onChange={(e) => handleNewFeatureInputChange('name', e.target.value)}
                      placeholder="Enter feature name (e.g., student_admission_billing)"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                        formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={newFeature.display_name}
                      onChange={(e) => handleNewFeatureInputChange('display_name', e.target.value)}
                      placeholder="Enter display name (e.g., Student Admission Billing Control)"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                        formErrors.display_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.display_name && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.display_name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                      Description *
                    </label>
                    <textarea
                      value={newFeature.description}
                      onChange={(e) => handleNewFeatureInputChange('description', e.target.value)}
                      placeholder="Enter feature description"
                      rows={3}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white resize-none ${
                        formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.description[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                        Feature Type *
                      </label>
                      <select
                        value={newFeature.feature_type}
                        onChange={(e) => handleNewFeatureInputChange('feature_type', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                          formErrors.feature_type ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select feature type</option>
                        <option value="billing">Billing</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="test">Test</option>
                        <option value="core">Core</option>
                        <option value="academic">Academic</option>
                        <option value="financial">Financial</option>
                      </select>
                      {formErrors.feature_type && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.feature_type[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                        Status *
                      </label>
                      <select
                        value={newFeature.is_active ? 'true' : 'false'}
                        onChange={(e) => handleNewFeatureInputChange('is_active', e.target.value === 'true')}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                          formErrors.is_active ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      {formErrors.is_active && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.is_active[0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Feature Flag State Form */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                      Feature Flag *
                    </label>
                    <select
                      value={newState.feature_flag}
                      onChange={(e) => handleNewStateInputChange('feature_flag', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                        formErrors.feature_flag ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="">Select feature flag</option>
                      {features.map(feature => (
                        <option key={feature.id} value={feature.id}>
                          {feature.display_name} ({feature.name})
                        </option>
                      ))}
                    </select>
                    {formErrors.feature_flag && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.feature_flag[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Scope Type *
                      </label>
                      <select
                        value={newState.scope_type}
                        onChange={(e) => handleNewStateInputChange('scope_type', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          formErrors.scope_type ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select scope type</option>
                        <option value="global">Global</option>
                        <option value="school">School</option>
                        <option value="user">User</option>
                      </select>
                      {formErrors.scope_type && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.scope_type[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                        Is Enabled *
                      </label>
                      <select
                        value={newState.is_enabled ? 'true' : 'false'}
                        onChange={(e) => handleNewStateInputChange('is_enabled', e.target.value === 'true')}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                          formErrors.is_enabled ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                      {formErrors.is_enabled && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.is_enabled[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                      Scope ID
                    </label>
                    <input
                      type="text"
                      value={newState.scope_id || ''}
                      onChange={(e) => handleNewStateInputChange('scope_id', e.target.value || null)}
                      placeholder="Enter scope ID (optional)"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                        formErrors.scope_id ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.scope_id && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.scope_id[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                        Percentage *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newState.percentage}
                        onChange={(e) => handleNewStateInputChange('percentage', parseInt(e.target.value) || 0)}
                        placeholder="Enter percentage (0-100)"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                          formErrors.percentage ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.percentage && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.percentage[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={newState.start_date || ''}
                        onChange={(e) => handleNewStateInputChange('start_date', e.target.value || null)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                          formErrors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.start_date && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.start_date[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={newState.end_date || ''}
                      onChange={(e) => handleNewStateInputChange('end_date', e.target.value || null)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                        formErrors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.end_date && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.end_date[0]}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={activeTab === 'features' ? closeAddDrawer : closeAddStateDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
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
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                {activeTab === 'features' ? 'Create Feature' : 'Create State'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Feature Drawer */}
      {isEditDrawerOpen && (editingFeature || editingState) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingFeature ? 'Edit Feature' : 'Edit Feature Flag State'}
                </h2>
              </div>
              <button
                onClick={closeEditDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* General Error Banner */}
              {Object.keys(editFormErrors).length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="p-1 bg-red-100 rounded-full">
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">Please fix the errors below</p>
                    </div>
                  </div>
                </div>
              )}

              {editingFeature ? (
                /* Edit Feature Form */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                      Feature Name *
                    </label>
                    <input
                      type="text"
                      value={editingFeature.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter feature name (e.g., student_admission_billing)"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                        editFormErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.name && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={editingFeature.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      placeholder="Enter display name (e.g., Student Admission Billing Control)"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                        editFormErrors.display_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.display_name && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.display_name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                      Description *
                    </label>
                    <textarea
                      value={editingFeature.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter feature description"
                      rows={3}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white resize-none ${
                        editFormErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.description && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.description[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                        Feature Type *
                      </label>
                      <select
                        value={editingFeature.feature_type}
                        onChange={(e) => handleInputChange('feature_type', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                          editFormErrors.feature_type ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select feature type</option>
                        <option value="billing">Billing</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="test">Test</option>
                        <option value="core">Core</option>
                        <option value="academic">Academic</option>
                        <option value="financial">Financial</option>
                      </select>
                      {editFormErrors.feature_type && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.feature_type[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                        Status *
                      </label>
                      <select
                        value={editingFeature.is_active ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                          editFormErrors.is_active ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      {editFormErrors.is_active && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.is_active[0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : editingState ? (
                /* Edit Feature Flag State Form */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                      Feature Flag *
                    </label>
                    <select
                      value={editingState.feature_flag}
                      onChange={(e) => handleStateInputChange('feature_flag', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                        editFormErrors.feature_flag ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="">Select feature flag</option>
                      {features.map(feature => (
                        <option key={feature.id} value={feature.id}>
                          {feature.display_name} ({feature.name})
                        </option>
                      ))}
                    </select>
                    {editFormErrors.feature_flag && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.feature_flag[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Scope Type *
                      </label>
                      <select
                        value={editingState.scope_type}
                        onChange={(e) => handleStateInputChange('scope_type', e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                          editFormErrors.scope_type ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select scope type</option>
                        <option value="global">Global</option>
                        <option value="school">School</option>
                        <option value="user">User</option>
                      </select>
                      {editFormErrors.scope_type && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.scope_type[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                        Is Enabled *
                      </label>
                      <select
                        value={editingState.is_enabled ? 'true' : 'false'}
                        onChange={(e) => handleStateInputChange('is_enabled', e.target.value === 'true')}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                          editFormErrors.is_enabled ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                      {editFormErrors.is_enabled && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.is_enabled[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                      Scope ID
                    </label>
                    <input
                      type="text"
                      value={editingState.scope_id || ''}
                      onChange={(e) => handleStateInputChange('scope_id', e.target.value || null)}
                      placeholder="Enter scope ID (optional)"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                        editFormErrors.scope_id ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.scope_id && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.scope_id[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                        Percentage *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingState.percentage}
                        onChange={(e) => handleStateInputChange('percentage', parseInt(e.target.value) || 0)}
                        placeholder="Enter percentage (0-100)"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                          editFormErrors.percentage ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.percentage && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.percentage[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={editingState.start_date ? editingState.start_date.slice(0, 16) : ''}
                        onChange={(e) => handleStateInputChange('start_date', e.target.value || null)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                          editFormErrors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {editFormErrors.start_date && (
                        <p className="mt-1 text-xs text-red-600">{editFormErrors.start_date[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={editingState.end_date ? editingState.end_date.slice(0, 16) : ''}
                      onChange={(e) => handleStateInputChange('end_date', e.target.value || null)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                        editFormErrors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.end_date && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.end_date[0]}</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={closeEditDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingFeature ? handleSaveFeature : handleSaveState}
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Update {editingFeature ? 'Feature' : 'State'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
