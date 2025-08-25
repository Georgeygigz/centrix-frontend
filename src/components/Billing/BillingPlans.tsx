import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaEye, FaPlus } from 'react-icons/fa';
import { BillingPlan } from '../../types/billing';
import billingService from '../../services/billing';

// Mock data for development (keeping as fallback)
const mockBillingPlans: BillingPlan[] = [
  {
    id: '1',
    name: 'Basic Plan',
    plan_type: 'basic',
    description: 'Essential features for small schools',
    is_active: true,
    is_default: false,
    features: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Standard Plan',
    plan_type: 'standard',
    description: 'Comprehensive features for medium schools',
    is_active: true,
    is_default: true,
    features: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const BillingPlans: React.FC = () => {
  // const { isAuthenticated, user } = useAuth(); // Removed unused variables
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('plans');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [showAddFeatureDrawer, setShowAddFeatureDrawer] = useState(false);
  const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [includedQuantity, setIncludedQuantity] = useState('');
  const [overagePrice, setOveragePrice] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

  // State for add subscription drawer
  const [showAddSubscriptionDrawer, setShowAddSubscriptionDrawer] = useState(false);
  const [addDrawerAnimating, setAddDrawerAnimating] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [billingPlansForSubscription, setBillingPlansForSubscription] = useState<any[]>([]);
  const [subscriptionForm, setSubscriptionForm] = useState({
    school: '',
    start_date: '',
    interval: 'monthly',
    status: 'active',
    end_date: '',
    auto_renew: true,
    base_price: '',
    custom_price: '',
    discount_percent: '',
    notes: '',
    plan: '',
    custom_plan_name: ''
  });
  const [subscriptionErrors, setSubscriptionErrors] = useState<{[key: string]: string}>({});
  const [subscriptionGeneralError, setSubscriptionGeneralError] = useState<string>('');
  
  // State for edit subscription drawer
  const [showEditSubscriptionDrawer, setShowEditSubscriptionDrawer] = useState(false);
  const [editDrawerAnimating, setEditDrawerAnimating] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [editSubscriptionErrors, setEditSubscriptionErrors] = useState<{[key: string]: string}>({});
  const [editSubscriptionGeneralError, setEditSubscriptionGeneralError] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Features state
  const [features, setFeatures] = useState<any[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  const [featuresCurrentPage, setFeaturesCurrentPage] = useState(1);
  const [featuresTotalCount, setFeaturesTotalCount] = useState(0);
  const [featuresTotalPages, setFeaturesTotalPages] = useState(0);
  const [featuresHasNext, setFeaturesHasNext] = useState(false);
  const [featuresHasPrevious, setFeaturesHasPrevious] = useState(false);

  // School Subscriptions state
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);

  // Fetch plans
  const fetchPlans = useCallback(async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(page);
      
      // Check if user is authenticated
      const token = sessionStorage.getItem('authToken');
      console.log('Auth token exists:', !!token);
      
      // Build query parameters
      const params: any = { page };
      if (search) params.search = search;
      if (sortBy) {
        const ordering = sortDirection === 'desc' ? `-${sortBy}` : sortBy;
        params.ordering = ordering;
      }
      
      console.log('Fetching plans with params:', params);
      
      // Make API call
      const response = await billingService.getBillingPlans(params);
      
      console.log('Full response:', response);
      
      // Handle both wrapped and direct response formats
      if (response.status === 'success' && response.data) {
        // Wrapped response format
        setPlans(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(Math.ceil(response.data.count / pageSize));
        setHasNext(!!response.data.next);
        setHasPrevious(!!response.data.previous);
      } else if (response.results && response.count !== undefined) {
        // Direct response format (Django REST Framework pagination)
        setPlans(response.results);
        setTotalCount(response.count);
        setTotalPages(Math.ceil(response.count / pageSize));
        setHasNext(!!response.next);
        setHasPrevious(!!response.previous);
      } else {
        throw new Error('Failed to fetch billing plans');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to fetch billing plans');
      // Fallback to mock data for development
      setPlans(mockBillingPlans);
      setTotalCount(mockBillingPlans.length);
      setTotalPages(Math.ceil(mockBillingPlans.length / pageSize));
      setHasNext(false);
      setHasPrevious(false);
    } finally {
      setLoading(false);
    }
  }, [pageSize, sortBy, sortDirection]);

  // Fetch features
  const fetchFeatures = useCallback(async (page: number = 1, search?: string) => {
    try {
      setFeaturesLoading(true);
      setFeaturesError(null);
      setFeaturesCurrentPage(page);
      
      // Check if user is authenticated
      const token = sessionStorage.getItem('authToken');
      console.log('Auth token exists for features:', !!token);
      
      // Build query parameters
      const params: any = { page };
      if (search) params.search = search;
      if (sortBy) {
        const ordering = sortDirection === 'desc' ? `-${sortBy}` : sortBy;
        params.ordering = ordering;
      }
      
      console.log('Fetching features with params:', params);
      
      // Make API call
      const response = await billingService.getBillingFeatures(params);
      
      console.log('Features response:', response);
      
      // Handle both wrapped and direct response formats
      if (response.status === 'success' && response.data) {
        // Wrapped response format
        setFeatures(response.data.results);
        setFeaturesTotalCount(response.data.count);
        setFeaturesTotalPages(Math.ceil(response.data.count / pageSize));
        setFeaturesHasNext(!!response.data.next);
        setFeaturesHasPrevious(!!response.data.previous);
      } else if (response.results && response.count !== undefined) {
        // Direct response format (Django REST Framework pagination)
        setFeatures(response.results);
        setFeaturesTotalCount(response.count);
        setFeaturesTotalPages(Math.ceil(response.count / pageSize));
        setFeaturesHasNext(!!response.next);
        setFeaturesHasPrevious(!!response.previous);
      } else {
        throw new Error('Failed to fetch billing features');
      }
    } catch (err) {
      console.error('Error fetching features:', err);
      setFeaturesError('Failed to fetch billing features');
      setFeatures([]);
      setFeaturesTotalCount(0);
      setFeaturesTotalPages(0);
      setFeaturesHasNext(false);
      setFeaturesHasPrevious(false);
    } finally {
      setFeaturesLoading(false);
    }
  }, [pageSize, sortBy, sortDirection]);

  // Fetch school subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setSubscriptionsLoading(true);
      setSubscriptionsError(null);
      
      // Check if user is authenticated
      const token = sessionStorage.getItem('authToken');
      console.log('Auth token exists for subscriptions:', !!token);
      
      console.log('Fetching school subscriptions...');
      
      // Make API call
      const response = await billingService.getSchoolSubscriptions();
      
      console.log('Subscriptions response:', response);
      
      // Handle response format
      if (response.status === 'success' && response.data) {
        setSubscriptions(response.data.results);
      } else if (response.results && response.results.length > 0) {
        setSubscriptions(response.results);
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setSubscriptionsError('Failed to fetch school subscriptions');
      setSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, []);

  // Load plans on component mount
  useEffect(() => {
    // Test API connectivity first
    const testAPI = async () => {
      try {
        console.log('Testing API connectivity...');
        const testResponse = await fetch('http://127.0.0.1:8000/api/v1/billing/plans/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
          }
        });
        console.log('Test API response status:', testResponse.status);
        console.log('Test API response headers:', testResponse.headers);
        
        if (!testResponse.ok) {
          console.error('Test API failed:', testResponse.status, testResponse.statusText);
        }
      } catch (error) {
        console.error('Test API error:', error);
      }
    };
    
    testAPI();
    fetchPlans(1);
  }, [fetchPlans]);

  // Load features when features tab is active
  useEffect(() => {
    if (activeTab === 'features') {
      fetchFeatures(1);
    }
  }, [activeTab, fetchFeatures]);

  // Load subscriptions when subscriptions tab is active
  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    }
  }, [activeTab, fetchSubscriptions]);

  // Debounce search query and fetch data based on active tab
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (activeTab === 'plans') {
        fetchPlans(1, searchQuery);
      } else if (activeTab === 'features') {
        fetchFeatures(1, searchQuery);
      }
      // Note: Subscriptions search would be implemented here if needed
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchPlans, fetchFeatures, activeTab]);

  const getPlanTypeBadge = (planType: string) => {
    const colors: { [key: string]: string } = {
      'basic': 'bg-gray-100 text-gray-800',
      'standard': 'bg-blue-100 text-blue-800',
      'premium': 'bg-purple-100 text-purple-800',
      'enterprise': 'bg-green-100 text-green-800'
    };
    
    const displayName = planType.charAt(0).toUpperCase() + planType.slice(1);
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[planType] || 'bg-gray-100 text-gray-800'}`}>
        {displayName}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Use plans directly since filtering and sorting is now handled server-side
  const displayPlans = plans;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    // Fetch plans with new sorting
    fetchPlans(1, debouncedSearchQuery);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      FaChevronUp({ className: "w-3 h-3" }) : 
      FaChevronDown({ className: "w-3 h-3" });
  };

  const handleEditPlan = (plan: BillingPlan) => {
    setOpenDropdownId(null);
    setToast({ message: 'Edit functionality coming soon!', type: 'success' });
  };

  const handleDeletePlan = async (plan: BillingPlan) => {
    try {
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      setOpenDropdownId(null);
      setToast({ message: 'Plan deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting plan:', error);
      setToast({ message: 'Failed to delete plan. Please try again.', type: 'error' });
    }
  };

  const handleViewPlan = (plan: BillingPlan) => {
    setSelectedPlan(plan);
    setShowFeaturesModal(true);
  };

  const handleAddFeature = async (plan: BillingPlan) => {
    try {
      // Fetch available features
      const response = await billingService.getBillingFeatures();
      if (response.results && response.results.length > 0) {
        setAvailableFeatures(response.results);
      } else if (response.data && response.data.results) {
        setAvailableFeatures(response.data.results);
      } else {
        setAvailableFeatures([]);
      }
      
      // Reset form fields
      setSelectedFeature('');
      setPricePerUnit('');
      setIncludedQuantity('');
      setOveragePrice('');
      
      // Open drawer
      setShowAddFeatureDrawer(true);
    } catch (error) {
      console.error('Error fetching features:', error);
      setToast({ message: 'Failed to load available features', type: 'error' });
    }
  };

  const handleRemoveFeature = (plan: BillingPlan, featureId: string) => {
    setToast({ message: `Remove feature functionality coming soon!`, type: 'success' });
    // TODO: Implement remove feature confirmation and API call
    console.log('Removing feature from plan:', plan, 'Feature ID:', featureId);
  };

  const handleSubmitAddFeature = async () => {
    if (!selectedFeature || !selectedPlan) {
      setToast({ message: 'Please select a feature', type: 'error' });
      return;
    }

    try {
      const featureData = {
        plan: selectedPlan.id,
        feature: selectedFeature,
        included_quantity: parseInt(includedQuantity) || 0,
        price_per_unit: parseFloat(pricePerUnit) || 0,
        overage_price_per_unit: parseFloat(overagePrice) || 0
      };

      // TODO: Implement API call to add feature to plan
      console.log('Adding feature to plan:', featureData);
      setToast({ message: 'Feature added successfully!', type: 'success' });
      
      // Close drawer and refresh features
      setShowAddFeatureDrawer(false);
      // Refresh the features modal
      if (selectedPlan) {
        // Re-fetch the plan to get updated features
        const updatedPlan = plans.find(p => p.id === selectedPlan.id);
        if (updatedPlan) {
          setSelectedPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error('Error adding feature:', error);
      setToast({ message: 'Failed to add feature', type: 'error' });
    }
  };

  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setShowSubscriptionModal(true);
  };

  // Fetch schools for subscription form
  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/schools', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Schools API response:', data);
        
        if (data.data && data.data.results && Array.isArray(data.data.results)) {
          console.log('Setting schools from data.data.results:', data.data.results);
          setSchools(data.data.results);
        } else if (data.results && Array.isArray(data.results)) {
          console.log('Setting schools from data.results:', data.results);
          setSchools(data.results);
        } else if (Array.isArray(data)) {
          console.log('Setting schools from direct array:', data);
          setSchools(data);
        } else {
          console.error('Unexpected schools data format:', data);
          setSchools([]);
        }
      } else {
        console.error('Failed to fetch schools:', response.status);
        setSchools([]);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools([]);
    }
  }, []);

  // Fetch billing plans for subscription form
  const fetchBillingPlansForSubscription = useCallback(async () => {
    try {
      const response = await billingService.getBillingPlans();
      console.log('Billing plans API response:', response);
      
      if (response.results && Array.isArray(response.results)) {
        setBillingPlansForSubscription(response.results);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setBillingPlansForSubscription(response.data.results);
      } else {
        console.error('Unexpected billing plans data format:', response);
        setBillingPlansForSubscription([]);
      }
    } catch (error) {
      console.error('Error fetching billing plans for subscription:', error);
      setBillingPlansForSubscription([]);
    }
  }, []);

  // Handle opening add subscription drawer
  const handleAddSubscription = async () => {
    try {
      console.log('Opening subscription drawer, current schools state:', schools);
      // Fetch schools and billing plans
      await Promise.all([fetchSchools(), fetchBillingPlansForSubscription()]);
      
      // Reset form and errors
      setSubscriptionForm({
        school: '',
        start_date: '',
        interval: 'monthly',
        status: 'active',
        end_date: '',
        auto_renew: true,
        base_price: '',
        custom_price: '',
        discount_percent: '',
        notes: '',
        plan: '',
        custom_plan_name: ''
      });
      setSubscriptionErrors({});
      setSubscriptionGeneralError('');
      
      // Open drawer with animation
      setShowAddSubscriptionDrawer(true);
      // Trigger animation after component mounts
      setTimeout(() => {
        setAddDrawerAnimating(true);
      }, 10);
    } catch (error) {
      console.error('Error preparing subscription form:', error);
      setToast({ message: 'Failed to load form data. Please try again.', type: 'error' });
    }
  };

  // Handle edit subscription
  const handleEditSubscription = async (subscription: any) => {
    try {
      console.log('Opening edit subscription drawer for:', subscription);
      
      // Fetch schools and billing plans if not already loaded
      if (schools.length === 0) {
        await fetchSchools();
      }
      if (billingPlansForSubscription.length === 0) {
        await fetchBillingPlansForSubscription();
      }
      
      // Set the subscription being edited
      setEditingSubscription(subscription);
      
      // Populate form with existing data
      setSubscriptionForm({
        school: subscription.school,
        start_date: subscription.start_date,
        interval: subscription.interval,
        status: subscription.status,
        end_date: subscription.end_date || '',
        auto_renew: subscription.auto_renew,
        base_price: subscription.base_price || '',
        custom_price: subscription.custom_price || '',
        discount_percent: subscription.discount_percent || '',
        notes: subscription.notes || '',
        plan: subscription.plan,
        custom_plan_name: subscription.custom_plan_name || ''
      });
      
      // Clear any previous errors
      setEditSubscriptionErrors({});
      setEditSubscriptionGeneralError('');
      
      // Open edit drawer with animation
      setShowEditSubscriptionDrawer(true);
      // Trigger animation after component mounts
      setTimeout(() => {
        setEditDrawerAnimating(true);
      }, 10);
    } catch (error) {
      console.error('Error preparing edit subscription form:', error);
      setToast({ message: 'Failed to load subscription data. Please try again.', type: 'error' });
    }
  };

  // Handle drawer closing with animation
  const handleCloseAddDrawer = () => {
    setAddDrawerAnimating(false);
    setTimeout(() => {
      setShowAddSubscriptionDrawer(false);
    }, 300);
  };

  const handleCloseEditDrawer = () => {
    setEditDrawerAnimating(false);
    setTimeout(() => {
      setShowEditSubscriptionDrawer(false);
    }, 300);
  };

  // Handle subscription form submission
  const handleSubmitSubscription = async () => {
    try {
      console.log('Submitting subscription:', subscriptionForm);
      
      // Validate required fields
      if (!subscriptionForm.school || !subscriptionForm.plan || !subscriptionForm.start_date) {
        setToast({ message: 'Please fill in all required fields (School, Plan, Start Date)', type: 'error' });
        return;
      }
      
      // Make API call to create subscription
      const response = await fetch('http://127.0.0.1:8000/api/v1/billing/subscriptions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          school: subscriptionForm.school,
          start_date: subscriptionForm.start_date,
          custom_plan_name: subscriptionForm.custom_plan_name || '',
          interval: subscriptionForm.interval,
          status: subscriptionForm.status,
          end_date: subscriptionForm.end_date || null,
          auto_renew: subscriptionForm.auto_renew,
          base_price: subscriptionForm.base_price || '',
          custom_price: subscriptionForm.custom_price || '',
          discount_percent: subscriptionForm.discount_percent || '',
          notes: subscriptionForm.notes || '',
          plan: subscriptionForm.plan
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Subscription created successfully:', result);
        setToast({ message: 'Subscription created successfully!', type: 'success' });
        handleCloseAddDrawer();
        
        // Refresh subscriptions
        fetchSubscriptions();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create subscription:', response.status, errorData);
        
        // Clear previous errors
        setSubscriptionErrors({});
        setSubscriptionGeneralError('');
        
        // Handle validation errors
        if (errorData.errors) {
          const fieldErrors: {[key: string]: string} = {};
          
          // Process field-specific errors
          Object.keys(errorData.errors).forEach(key => {
            if (key === 'non_field_errors') {
              // Handle general errors
              if (Array.isArray(errorData.errors[key])) {
                setSubscriptionGeneralError(errorData.errors[key].join(', '));
              } else {
                setSubscriptionGeneralError(errorData.errors[key]);
              }
            } else {
              // Handle field-specific errors
              if (Array.isArray(errorData.errors[key])) {
                fieldErrors[key] = errorData.errors[key].join(', ');
              } else {
                fieldErrors[key] = errorData.errors[key];
              }
            }
          });
          
          setSubscriptionErrors(fieldErrors);
        } else {
          // Handle general error message
          setSubscriptionGeneralError(errorData.message || response.statusText || 'Failed to create subscription');
        }
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      setToast({ message: 'Failed to create subscription. Please try again.', type: 'error' });
    }
  };

  // Handle edit subscription form submission
  const handleUpdateSubscription = async () => {
    try {
      console.log('Updating subscription:', subscriptionForm);
      
      if (!editingSubscription) {
        setToast({ message: 'No subscription selected for editing', type: 'error' });
        return;
      }
      
      // Validate required fields
      if (!subscriptionForm.school || !subscriptionForm.plan || !subscriptionForm.start_date) {
        setToast({ message: 'Please fill in all required fields (School, Plan, Start Date)', type: 'error' });
        return;
      }
      
      // Make API call to update subscription
      const response = await fetch(`http://127.0.0.1:8000/api/v1/billing/subscriptions/${editingSubscription.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          school: subscriptionForm.school,
          start_date: subscriptionForm.start_date,
          custom_plan_name: subscriptionForm.custom_plan_name || '',
          interval: subscriptionForm.interval,
          status: subscriptionForm.status,
          end_date: subscriptionForm.end_date || null,
          auto_renew: subscriptionForm.auto_renew,
          base_price: subscriptionForm.base_price || '',
          custom_price: subscriptionForm.custom_price || '',
          discount_percent: subscriptionForm.discount_percent || '',
          notes: subscriptionForm.notes || '',
          plan: subscriptionForm.plan
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Subscription updated successfully:', result);
        setToast({ message: 'Subscription updated successfully!', type: 'success' });
        handleCloseEditDrawer();
        
        // Refresh subscriptions
        fetchSubscriptions();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update subscription:', response.status, errorData);
        
        // Clear previous errors
        setEditSubscriptionErrors({});
        setEditSubscriptionGeneralError('');
        
        // Handle validation errors
        if (errorData.errors) {
          const fieldErrors: {[key: string]: string} = {};
          
          // Process field-specific errors
          Object.keys(errorData.errors).forEach(key => {
            if (key === 'non_field_errors') {
              // Handle general errors
              if (Array.isArray(errorData.errors[key])) {
                setEditSubscriptionGeneralError(errorData.errors[key].join(', '));
              } else {
                setEditSubscriptionGeneralError(errorData.errors[key]);
              }
            } else {
              // Handle field-specific errors
              if (Array.isArray(errorData.errors[key])) {
                fieldErrors[key] = errorData.errors[key].join(', ');
              } else {
                fieldErrors[key] = errorData.errors[key];
              }
            }
          });
          
          setEditSubscriptionErrors(fieldErrors);
        } else {
          // Handle general error message
          setEditSubscriptionGeneralError(errorData.message || response.statusText || 'Failed to update subscription');
        }
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setToast({ message: 'Failed to update subscription. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="p-6">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing Plans</h1>
        <p className="text-gray-600">Create and manage global billing plans</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('plans')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'plans'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Plans
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'features'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Features
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'subscriptions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                School Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'pricing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pricing
              </button>
            </nav>

            {/* Search, Filter, and Sort Controls */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    activeTab === 'features' ? "Search features..." : 
                    activeTab === 'subscriptions' ? "Search subscriptions..." :
                    "Search plans..."
                  }
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
              <option value="plan_type">Plan Type</option>
              <option value="is_active">Status</option>
              <option value="created_at">Created Date</option>
              </select>

              {/* Add New Plan/Subscription Button */}
              <button
                onClick={activeTab === 'subscriptions' ? handleAddSubscription : () => setToast({ message: 'Add plan functionality coming soon!', type: 'success' })}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                + Add {activeTab === 'subscriptions' ? 'Subscription' : 'Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' && (
        <div className="bg-white rounded-md shadow-sm">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading plans...</span>
            </div>
          )}
          
          {error && (
            <div className="p-4 text-center">
              <div className="text-red-600 text-sm mb-2">{error}</div>
              <button
                onClick={() => fetchPlans(1)}
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('plan_type')}>
                          <div className="flex items-center space-x-1">
                            <span>Plan Type</span>
                            {getSortIcon('plan_type')}
                          </div>
                        </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Description</span>
                      </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_active')}>
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {getSortIcon('is_active')}
                          </div>
                        </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Features</span>
                      </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                          <div className="flex items-center space-x-1">
                            <span>Created At</span>
                            {getSortIcon('created_at')}
                          </div>
                        </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayPlans.map((plan, index) => (
                      <tr key={plan.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                            {plan.is_default && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 ml-2">
                                Default
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {getPlanTypeBadge(plan.plan_type)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={plan.description}>
                            {plan.description || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {getStatusBadge(plan.is_active)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {plan.features.length} features
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 relative">
                          <div className="flex items-center justify-center space-x-2">
                            {/* View Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPlan(plan);
                              }}
                              className="p-1 rounded-md transition-colors duration-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="View Plan Details"
                            >
                              {FaEye({ className: "w-3 h-3" })}
                            </button>
                            
                            {/* More Options Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === plan.id ? null : plan.id);
                                  if (openDropdownId !== plan.id) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownCoords({
                                      x: rect.left,
                                      y: rect.bottom + window.scrollY
                                    });
                                  }
                                }}
                                className={`p-1 rounded-md transition-colors duration-200 ${
                                  openDropdownId === plan.id
                                    ? 'text-blue-600 bg-blue-50' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                                title="More Options"
                              >
                                {FaEllipsisV({ className: "w-3 h-3" })}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          {/* Pagination - Outside table container */}
          {!loading && !error && totalCount > 0 && (
            <>
              {/* Gray row above pagination */}
              <div className="h-4 mt-8 rounded-t-lg" style={{ backgroundColor: 'rgb(249,250,251)' }}></div>
              <div className="flex items-center justify-between p-4 rounded-b-lg border-0" style={{ backgroundColor: 'rgb(249,250,251)' }}>
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => fetchPlans(currentPage - 1)}
                    disabled={!hasPrevious}
                    className="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors duration-200 text-gray-500 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'rgb(249,250,251)' }}
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
                    Page {currentPage} of {totalPages} ({totalPages > 1 ? `${totalPages} pages` : '1 page'})
                  </span>
                  <button 
                    onClick={() => fetchPlans(currentPage + 1)}
                    disabled={!hasNext}
                    className="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors duration-200 text-gray-500 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'rgb(249,250,251)' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="bg-white rounded-md shadow-sm">
          {featuresLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading features...</span>
            </div>
          )}
          
          {featuresError && (
            <div className="p-4 text-center">
              <div className="text-red-600 text-sm mb-2">{featuresError}</div>
              <button
                onClick={() => fetchFeatures(1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}
          
          {!featuresLoading && !featuresError && (
            <>
              <div className="overflow-x-auto border-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Name</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Code</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Description</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Is Active</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Is Billable</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {features.map((feature, index) => (
                      <tr key={feature.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">{feature.code}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={feature.description}>
                            {feature.description || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            feature.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {feature.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            feature.is_billable ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {feature.is_billable ? 'Billable' : 'Non-Billable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination for features */}
              {featuresTotalPages > 1 && (
                <>
                  {/* Gray row above pagination */}
                  <div className="h-4 mt-8 rounded-t-lg" style={{ backgroundColor: 'rgb(249,250,251)' }}></div>
                  <div className="flex items-center justify-between p-4 rounded-b-lg border-0" style={{ backgroundColor: 'rgb(249,250,251)' }}>
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((featuresCurrentPage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(featuresCurrentPage * pageSize, featuresTotalCount)}</span> of <span className="font-medium">{featuresTotalCount}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => fetchFeatures(featuresCurrentPage - 1)}
                        disabled={!featuresHasPrevious}
                        className="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors duration-200 text-gray-500 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'rgb(249,250,251)' }}
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
                        Page {featuresCurrentPage} of {featuresTotalPages} ({featuresTotalPages > 1 ? `${featuresTotalPages} pages` : '1 page'})
                      </span>
                      <button 
                        onClick={() => fetchFeatures(featuresCurrentPage + 1)}
                        disabled={!featuresHasNext}
                        className="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors duration-200 text-gray-500 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'rgb(249,250,251)' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* School Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-md shadow-sm">
          {subscriptionsLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading subscriptions...</span>
            </div>
          )}
          
          {subscriptionsError && (
            <div className="p-4 text-center">
              <div className="text-red-600 text-sm mb-2">{subscriptionsError}</div>
              <button
                onClick={() => fetchSubscriptions()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}
          
          {!subscriptionsLoading && !subscriptionsError && (
            <>
              <div className="overflow-x-auto border-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>School Name</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Plan Name</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Interval</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Status</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Start Date</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>End Date</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Auto Renew</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Students Count</span>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        <span>Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.length > 0 ? (
                      subscriptions.map((subscription, index) => (
                        <tr key={subscription.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{subscription.school_details?.name || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{subscription.plan_details?.name || subscription.custom_plan_name || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">{subscription.interval || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              subscription.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : subscription.status === 'canceled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {subscription.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {subscription.start_date 
                              ? new Date(subscription.start_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {subscription.end_date 
                              ? new Date(subscription.end_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              subscription.auto_renew 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {subscription.auto_renew ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {subscription.student_count || '0'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 relative">
                            <div className="flex items-center justify-center space-x-2">
                              {/* View Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSubscription(subscription);
                                }}
                                className="p-1 rounded-md transition-colors duration-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="View Subscription Details"
                              >
                                {FaEye({ className: "w-3 h-3" })}
                              </button>
                              
                              {/* More Options Dropdown */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(openDropdownId === subscription.id ? null : subscription.id);
                                    if (openDropdownId !== subscription.id) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownCoords({
                                        x: rect.left,
                                        y: rect.bottom + window.scrollY
                                      });
                                    }
                                  }}
                                  className={`p-1 rounded-md transition-colors duration-200 ${
                                    openDropdownId === subscription.id
                                      ? 'text-blue-600 bg-blue-50' 
                                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                  }`}
                                  title="More Options"
                                >
                                  {FaEllipsisV({ className: "w-3 h-3" })}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                          No school subscriptions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-md shadow-sm p-6">
          <div className="text-center">
            <div className="text-gray-400 mb-3">
              <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Pricing Management</h3>
            <p className="text-xs text-gray-500">Configure pricing and billing settings.</p>
          </div>
        </div>
      )}

      {/* Portal-based Dropdown for Plans */}
      {openDropdownId && activeTab === 'plans' && createPortal(
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                const plan = plans.find(p => p.id === openDropdownId);
                if (plan) {
                  handleEditPlan(plan);
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
                const plan = plans.find(p => p.id === openDropdownId);
                if (plan) {
                  handleDeletePlan(plan);
                }
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              {FaTrash({ className: "w-3 h-3 mr-2" })}
              Delete
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Portal-based Dropdown for Subscriptions */}
      {openDropdownId && activeTab === 'subscriptions' && createPortal(
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                const subscription = subscriptions.find(s => s.id === openDropdownId);
                if (subscription) {
                  handleEditSubscription(subscription);
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
                const subscription = subscriptions.find(s => s.id === openDropdownId);
                if (subscription) {
                  setToast({ message: 'Delete subscription functionality coming soon!', type: 'success' });
                }
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              {FaTrash({ className: "w-3 h-3 mr-2" })}
              Delete
            </button>
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

      {/* Features Modal */}
      {showFeaturesModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-purple-50 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[70vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-200">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-purple-900">{selectedPlan.name}</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAddFeature(selectedPlan)}
                  className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors duration-200"
                  title="Add Feature"
                >
                  {FaPlus({ className: "w-3 h-3" })}
                </button>
                <button
                  onClick={() => setShowFeaturesModal(false)}
                  className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-120px)]">
              {selectedPlan.features && selectedPlan.features.length > 0 ? (
                <div className="space-y-3">
                  {selectedPlan.features.map((feature: any, index: number) => (
                    <div key={feature.id} className="bg-white rounded-lg p-3 border border-purple-200 relative">
                      {/* Feature Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-purple-900">
                            {feature.feature_details?.name || 'Unknown Feature'}
                          </h3>
                          <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {feature.feature_details?.code || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Feature Description */}
                      <div className="mb-2 pb-2 border-b border-purple-100">
                        <p className="text-xs text-gray-600">
                          {feature.feature_details?.description || 'No description available'}
                        </p>
                      </div>
                      
                      {/* Feature Details */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center py-1 border-b border-purple-100">
                          <span className="text-xs font-medium text-purple-900">Included Quantity:</span>
                          <span className="text-xs text-gray-700 font-semibold">
                            {feature.included_quantity?.toLocaleString() || '0'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-1 border-b border-purple-100">
                          <span className="text-xs font-medium text-purple-900">Price Per Unit:</span>
                          <span className="text-xs text-gray-700 font-semibold">
                            ${feature.price_per_unit || '0.00'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs font-medium text-purple-900">Overage Price:</span>
                          <span className="text-xs text-gray-700 font-semibold">
                            ${feature.overage_price_per_unit || '0.00'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Remove Feature Button */}
                      <button
                        onClick={() => handleRemoveFeature(selectedPlan, feature.id)}
                        className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors duration-200"
                        title="Remove Feature"
                      >
                        {FaTrash({ className: "w-2.5 h-2.5" })}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-purple-400 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-purple-900 mb-1">No Features Found</h3>
                  <p className="text-xs text-gray-500">This plan doesn't have any features configured yet.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-4 border-t border-purple-200 bg-purple-50">
              <button
                onClick={() => setShowFeaturesModal(false)}
                className="px-4 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Feature Drawer */}
      {showAddFeatureDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-[10002]">
          <div className="bg-white h-full w-96 shadow-xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Feature to Plan</h2>
              <button
                onClick={() => setShowAddFeatureDrawer(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {FaTimes({ className: "w-6 h-6" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Plan Selection (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan
                </label>
                <input
                  type="text"
                  value={selectedPlan?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>

              {/* Feature Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature *
                </label>
                <select
                  value={selectedFeature}
                  onChange={(e) => setSelectedFeature(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a feature</option>
                  {availableFeatures.map((feature) => (
                    <option key={feature.id} value={feature.id}>
                      {feature.name} ({feature.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Included Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Included Quantity
                </label>
                <input
                  type="number"
                  value={includedQuantity}
                  onChange={(e) => setIncludedQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Price Per Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Unit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Overage Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overage Price Per Unit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={overagePrice}
                  onChange={(e) => setOveragePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddFeatureDrawer(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAddFeature}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
              >
                Add Feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscription Drawer */}
      {showAddSubscriptionDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className={`bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out ${
            addDrawerAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Add New Subscription</h2>
              </div>
              <button
                onClick={handleCloseAddDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* General Error Banner */}
              {subscriptionGeneralError && (
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
                      <p className="text-sm font-medium text-red-800">{subscriptionGeneralError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* School & Plan Selection */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    School *
                  </label>
                  <select
                    value={subscriptionForm.school}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, school: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.school ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select a school</option>
                    {Array.isArray(schools) && schools.length > 0 ? (
                      schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading schools...</option>
                    )}
                  </select>
                  {subscriptionErrors.school && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.school}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Plan *
                  </label>
                  <select
                    value={subscriptionForm.plan}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, plan: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.plan ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select a plan</option>
                    {Array.isArray(billingPlansForSubscription) && billingPlansForSubscription.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.plan_type})
                      </option>
                    ))}
                  </select>
                  {subscriptionErrors.plan && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.plan}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                    Custom Plan Name
                  </label>
                  <input
                    type="text"
                    value={subscriptionForm.custom_plan_name}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, custom_plan_name: e.target.value})}
                    placeholder="Enter custom plan name..."
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.custom_plan_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {subscriptionErrors.custom_plan_name && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.custom_plan_name}</p>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={subscriptionForm.start_date}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, start_date: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {subscriptionErrors.start_date && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.start_date}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={subscriptionForm.end_date}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, end_date: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {subscriptionErrors.end_date && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.end_date}</p>
                  )}
                </div>
              </div>

              {/* Billing Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                    Billing Interval *
                  </label>
                  <select
                    value={subscriptionForm.interval}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, interval: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.interval ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                  {subscriptionErrors.interval && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.interval}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                    Status *
                  </label>
                  <select
                    value={subscriptionForm.status}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, status: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.status ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="canceled">Canceled</option>
                    <option value="expired">Expired</option>
                    <option value="trial">Trial</option>
                  </select>
                  {subscriptionErrors.status && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.status}</p>
                  )}
                </div>
              </div>

              {/* Auto Renew */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={subscriptionForm.auto_renew}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, auto_renew: e.target.checked})}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-700">Auto Renew</span>
                </label>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                    Base Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subscriptionForm.base_price}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, base_price: e.target.value})}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.base_price ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {subscriptionErrors.base_price && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.base_price}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                    Custom Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subscriptionForm.custom_price}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, custom_price: e.target.value})}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.custom_price ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {subscriptionErrors.custom_price && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.custom_price}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                    Discount %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subscriptionForm.discount_percent}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, discount_percent: e.target.value})}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                      subscriptionErrors.discount_percent ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {subscriptionErrors.discount_percent && (
                    <p className="mt-1 text-xs text-red-600">{subscriptionErrors.discount_percent}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                  Notes
                </label>
                <textarea
                  value={subscriptionForm.notes}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, notes: e.target.value})}
                  placeholder="Enter notes..."
                  rows={2}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white resize-none ${
                    subscriptionErrors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {subscriptionErrors.notes && (
                  <p className="mt-1 text-xs text-red-600">{subscriptionErrors.notes}</p>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={handleCloseAddDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSubscription}
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Create Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Drawer */}
      {showEditSubscriptionDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className={`bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out ${
            editDrawerAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Edit Subscription</h2>
              </div>
              <button
                onClick={handleCloseEditDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* General Error Banner */}
              {editSubscriptionGeneralError && (
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
                      <p className="text-sm font-medium text-red-800">{editSubscriptionGeneralError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* School & Plan Selection */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    School *
                  </label>
                  <select
                    value={subscriptionForm.school}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, school: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.school ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select a school</option>
                    {Array.isArray(schools) && schools.length > 0 ? (
                      schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading schools...</option>
                    )}
                  </select>
                  {editSubscriptionErrors.school && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.school}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Plan *
                  </label>
                  <select
                    value={subscriptionForm.plan}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, plan: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.plan ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select a plan</option>
                    {Array.isArray(billingPlansForSubscription) && billingPlansForSubscription.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.plan_type})
                      </option>
                    ))}
                  </select>
                  {editSubscriptionErrors.plan && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.plan}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                    Custom Plan Name
                  </label>
                  <input
                    type="text"
                    value={subscriptionForm.custom_plan_name}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, custom_plan_name: e.target.value})}
                    placeholder="Enter custom plan name..."
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.custom_plan_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editSubscriptionErrors.custom_plan_name && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.custom_plan_name}</p>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={subscriptionForm.start_date}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, start_date: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editSubscriptionErrors.start_date && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.start_date}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={subscriptionForm.end_date}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, end_date: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editSubscriptionErrors.end_date && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.end_date}</p>
                  )}
                </div>
              </div>

              {/* Billing Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                    Billing Interval *
                  </label>
                  <select
                    value={subscriptionForm.interval}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, interval: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.interval ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                  {editSubscriptionErrors.interval && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.interval}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                    Status *
                  </label>
                  <select
                    value={subscriptionForm.status}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, status: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.status ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="canceled">Canceled</option>
                    <option value="expired">Expired</option>
                    <option value="trial">Trial</option>
                  </select>
                  {editSubscriptionErrors.status && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.status}</p>
                  )}
                </div>
              </div>

              {/* Auto Renew */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={subscriptionForm.auto_renew}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, auto_renew: e.target.checked})}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-700">Auto Renew</span>
                </label>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                    Base Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subscriptionForm.base_price}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, base_price: e.target.value})}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.base_price ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editSubscriptionErrors.base_price && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.base_price}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                    Custom Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subscriptionForm.custom_price}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, custom_price: e.target.value})}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.custom_price ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editSubscriptionErrors.custom_price && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.custom_price}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                    Discount %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subscriptionForm.discount_percent}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, discount_percent: e.target.value})}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                      editSubscriptionErrors.discount_percent ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editSubscriptionErrors.discount_percent && (
                    <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.discount_percent}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                  Notes
                </label>
                <textarea
                  value={subscriptionForm.notes}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, notes: e.target.value})}
                  placeholder="Enter notes..."
                  rows={2}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white resize-none ${
                    editSubscriptionErrors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {editSubscriptionErrors.notes && (
                  <p className="mt-1 text-xs text-red-600">{editSubscriptionErrors.notes}</p>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={handleCloseEditDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubscription}
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Update Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {showSubscriptionModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-purple-50 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[70vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-200">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-purple-900">{selectedSubscription.school_details?.name} - Subscription</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setToast({ message: 'Add feature functionality coming soon!', type: 'success' })}
                  className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors duration-200"
                  title="Add Feature"
                >
                  {FaPlus({ className: "w-3 h-3" })}
                </button>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-120px)] space-y-4">
              {/* Card 1: School Details */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-blue-900">School Details</h3>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                      selectedSubscription.school_details?.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedSubscription.school_details?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-xs font-medium text-blue-900">School Name:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.school_details?.name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-xs font-medium text-blue-900">Domain:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.school_details?.domain || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-xs font-medium text-blue-900">Email:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.school_details?.email || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-xs font-medium text-blue-900">Phone:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.school_details?.phone || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-medium text-blue-900">Max Students:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.school_details?.max_students?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Subscription Details */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-green-900">Subscription Details</h3>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                      selectedSubscription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedSubscription.status === 'canceled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedSubscription.status || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center py-1 border-b border-green-100">
                    <span className="text-xs font-medium text-green-900">Billing Interval:</span>
                    <span className="text-xs text-gray-700 font-semibold capitalize">
                      {selectedSubscription.interval || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-green-100">
                    <span className="text-xs font-medium text-green-900">Start Date:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.start_date 
                        ? new Date(selectedSubscription.start_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-green-100">
                    <span className="text-xs font-medium text-green-900">End Date:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.end_date 
                        ? new Date(selectedSubscription.end_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-green-100">
                    <span className="text-xs font-medium text-green-900">Auto Renew:</span>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                      selectedSubscription.auto_renew 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSubscription.auto_renew ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-green-100">
                    <span className="text-xs font-medium text-green-900">Student Count:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.student_count?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-green-100">
                    <span className="text-xs font-medium text-green-900">Pricing Option:</span>
                    <span className="text-xs text-gray-700 font-semibold capitalize">
                      {selectedSubscription.pricing_option?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-medium text-green-900">Notes:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.notes || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Plan Details */}
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-purple-900">Plan Details</h3>
                    <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {selectedSubscription.plan_details?.plan_type || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-2 pb-2 border-b border-purple-100">
                  <p className="text-xs text-gray-600">
                    {selectedSubscription.plan_details?.description || 'No description available'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center py-1 border-b border-purple-100">
                    <span className="text-xs font-medium text-purple-900">Plan Name:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      {selectedSubscription.plan_details?.name || selectedSubscription.custom_plan_name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-purple-100">
                    <span className="text-xs font-medium text-purple-900">Plan Status:</span>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                      selectedSubscription.plan_details?.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedSubscription.plan_details?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-purple-100">
                    <span className="text-xs font-medium text-purple-900">Is Default:</span>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                      selectedSubscription.plan_details?.is_default 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSubscription.plan_details?.is_default ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-purple-100">
                    <span className="text-xs font-medium text-purple-900">Base Price:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      ${selectedSubscription.base_price || '0.00'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-medium text-purple-900">Custom Price:</span>
                    <span className="text-xs text-gray-700 font-semibold">
                      ${selectedSubscription.custom_price || '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Features */}
              {selectedSubscription.plan_details?.features && selectedSubscription.plan_details.features.length > 0 ? (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-orange-900">Plan Features</h3>
                    <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                      {selectedSubscription.plan_details.features.length} features
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedSubscription.plan_details.features.map((feature: any, index: number) => (
                      <div key={feature.id} className="bg-white rounded-lg p-3 border border-orange-200 relative">
                        {/* Feature Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {feature.feature_details?.name || 'Unknown Feature'}
                            </h4>
                            <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              {feature.feature_details?.code || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Feature Description */}
                        <div className="mb-2 pb-2 border-b border-orange-200">
                          <p className="text-xs text-gray-600">
                            {feature.feature_details?.description || 'No description available'}
                          </p>
                        </div>
                        
                        {/* Feature Details */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center py-1 border-b border-orange-200">
                            <span className="text-xs font-medium text-orange-900">Included Quantity:</span>
                            <span className="text-xs text-gray-900 font-semibold">
                              {feature.included_quantity?.toLocaleString() || '0'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center py-1 border-b border-orange-200">
                            <span className="text-xs font-medium text-orange-900">Price Per Unit:</span>
                            <span className="text-xs text-gray-900 font-semibold">
                              ${feature.price_per_unit || '0.00'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs font-medium text-orange-900">Overage Price:</span>
                            <span className="text-xs text-gray-900 font-semibold">
                              ${feature.overage_price_per_unit || '0.00'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Remove Feature Button */}
                        <button
                          onClick={() => setToast({ message: 'Remove feature functionality coming soon!', type: 'success' })}
                          className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors duration-200"
                          title="Remove Feature"
                        >
                          {FaTrash({ className: "w-2.5 h-2.5" })}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="text-center py-6">
                    <div className="text-orange-400 mb-2">
                      <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-orange-900 mb-1">No Features Found</h3>
                    <p className="text-xs text-gray-500">This subscription doesn't have any features configured yet.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-4 border-t border-purple-200 bg-purple-50">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-4 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPlans;
