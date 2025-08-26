import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaTimes, FaCheckCircle, FaCreditCard, FaCalendarAlt, FaCog, FaExchangeAlt, FaBan, FaDownload, FaPrint, FaEnvelope } from 'react-icons/fa';

import { billingService } from '../../services/billing';
import { SchoolSubscription, Invoice, BillingPlan } from '../../types/billing';

interface SuperAdminBillingDashboardProps {
  // Add any props if needed
}

const SuperAdminBillingDashboard: React.FC<SuperAdminBillingDashboardProps> = () => {
  // State for subscription data
  const [subscription, setSubscription] = useState<SchoolSubscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
  
  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Modal states
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Mock data for development
  const mockSubscription = useMemo((): SchoolSubscription => ({
    id: '1',
    school: '1',
    plan: '1',
    custom_plan_name: 'Premium Plan',
    interval: 'monthly',
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    auto_renew: true,
    student_count: 500,
    base_price: '150000',
    custom_price: '120000',
    discount_percent: '20',
    pricing_option: 'student_based',
    notes: 'Premium subscription with student-based pricing',
    plan_details: {
      id: '1',
      name: 'Premium Plan',
      plan_type: 'premium',
      description: 'Advanced features for large schools',
      is_active: true,
      is_default: false,
      features: [],
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    school_details: {
      id: '1',
      name: 'Excellence Academy',
      domain: 'excellence.edu',
      email: 'admin@excellence.edu',
      phone: '+254700000000',
      max_students: 1000
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }), []);

  const mockInvoices = useMemo((): Invoice[] => [
    {
      id: '1',
      school: '1',
      subscription: '1',
      amount: 120000,
      status: 'paid',
      due_date: '2024-01-15',
      paid_date: '2024-01-10',
      created_at: '2024-01-01',
      updated_at: '2024-01-10'
    },
    {
      id: '2',
      school: '1',
      subscription: '1',
      amount: 120000,
      status: 'pending',
      due_date: '2024-02-15',
      paid_date: null,
      created_at: '2024-02-01',
      updated_at: '2024-02-01'
    },
    {
      id: '3',
      school: '1',
      subscription: '1',
      amount: 120000,
      status: 'overdue',
      due_date: '2023-12-15',
      paid_date: null,
      created_at: '2023-12-01',
      updated_at: '2023-12-01'
    }
  ], []);

  const mockPlans = useMemo((): BillingPlan[] => [
    {
      id: '1',
      name: 'Basic Plan',
      plan_type: 'basic',
      description: 'Essential features for small schools',
      is_active: true,
      is_default: true,
      features: [],
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '2',
      name: 'Standard Plan',
      plan_type: 'standard',
      description: 'Standard features for medium schools',
      is_active: true,
      is_default: false,
      features: [],
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '3',
      name: 'Premium Plan',
      plan_type: 'premium',
      description: 'Advanced features for large schools',
      is_active: true,
      is_default: false,
      features: [],
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ], []);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using mock data for now
        setSubscription(mockSubscription);
        setInvoices(mockInvoices);
        setAvailablePlans(mockPlans);
        
        setTotalCount(mockInvoices.length);
        setTotalPages(Math.ceil(mockInvoices.length / pageSize));
        setHasNext(false);
        setHasPrevious(false);
        
      } catch (err) {
        console.error('Error loading billing data:', err);
        setError('Failed to load billing data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [pageSize, mockInvoices, mockPlans, mockSubscription]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search and sorting
  useEffect(() => {
    if (debouncedSearchQuery === '' && sortBy === '' && sortDirection === 'asc') {
      return;
    }
    
    // Filter and sort invoices
    let filteredInvoices = [...mockInvoices];
    
    // Apply search filter
    if (debouncedSearchQuery) {
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        invoice.status.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortBy) {
      filteredInvoices.sort((a, b) => {
        const aValue = a[sortBy as keyof Invoice];
        const bValue = b[sortBy as keyof Invoice];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }
    
    setInvoices(filteredInvoices);
    setTotalCount(filteredInvoices.length);
    setTotalPages(Math.ceil(filteredInvoices.length / pageSize));
    setCurrentPage(1);
  }, [debouncedSearchQuery, sortBy, sortDirection, pageSize, mockInvoices]);

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

  const formatCurrency = (amount: number | string, currency: string = 'KES') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPricingOptionBadge = (option: string) => {
    const optionConfig = {
      feature_based: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Feature Based' },
      student_based: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Student Based' },
      custom_price: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Custom Price' }
    };
    
    const config = optionConfig[option as keyof typeof optionConfig] || optionConfig.custom_price;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleChangePlan = async () => {
    try {
      // API call to change plan
      await billingService.updateSchoolSubscription(subscription?.id || '', {
        plan: selectedPlan
      });
      
      setToast({
        message: 'Plan changed successfully!',
        type: 'success'
      });
      
      setIsChangePlanModalOpen(false);
      setSelectedPlan('');
      
    } catch (error) {
      setToast({
        message: 'Failed to change plan. Please try again.',
        type: 'error'
      });
    }
    
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancelSubscription = async () => {
    try {
      // API call to cancel subscription
      await billingService.updateSchoolSubscription(subscription?.id || '', {
        status: 'cancelled',
        auto_renew: false
      });
      
      setToast({
        message: 'Subscription cancelled successfully!',
        type: 'success'
      });
      
      setIsCancelModalOpen(false);
      
    } catch (error) {
      setToast({
        message: 'Failed to cancel subscription. Please try again.',
        type: 'error'
      });
    }
    
    setTimeout(() => setToast(null), 3000);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No subscription found for your school.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Billing Dashboard</h1>
              <p className="text-gray-600 text-sm">Manage your school's subscription and billing</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <span className="text-xs font-medium text-gray-500">School</span>
                <p className="text-sm font-semibold text-gray-900">{subscription.school_details.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Current Plan */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                {FaCog({ className: "w-5 h-5 text-white" })}
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Plan</span>
            </div>
            <div className="mb-3">
              <p className="text-lg font-bold text-gray-900 mb-1">
                {subscription.plan_details.name}
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {subscription.plan_details.description}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {subscription.status}
              </span>
            </div>
          </div>

          {/* Payment Due */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                {FaCalendarAlt({ className: "w-5 h-5 text-white" })}
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Payment</span>
            </div>
            <div className="mb-3">
              <p className="text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(subscription.custom_price || subscription.base_price)}
              </p>
              <p className="text-xs text-gray-600">
                Due on {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Auto-renew</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                subscription.auto_renew 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {subscription.auto_renew ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Pricing Option */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                {FaCreditCard({ className: "w-5 h-5 text-white" })}
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pricing Model</span>
            </div>
            <div className="mb-3">
              {getPricingOptionBadge(subscription.pricing_option)}
              <p className="text-xs text-gray-600 mt-2">
                {subscription.student_count} students
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Discount</span>
              <span className="text-sm font-semibold text-green-600">
                {subscription.discount_percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Subscription Actions</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsChangePlanModalOpen(true)}
                className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs font-medium shadow-sm"
              >
                {FaExchangeAlt({ className: "w-3 h-3 mr-1.5" })}
                Change Plan
              </button>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs font-medium shadow-sm"
              >
                {FaBan({ className: "w-3 h-3 mr-1.5" })}
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header with Search and Filters */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Invoices</h3>
              <div className="flex items-center space-x-2">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {FaSearch({ className: "h-3 w-3 text-gray-400" })}
                  </div>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    if (e.target.value) {
                      setSortDirection('asc');
                    }
                  }}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white"
                >
                  <option value="">Sort by</option>
                  <option value="created_at">Date</option>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                  <option value="due_date">Due Date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => handleSort('id')}>
                    <div className="flex items-center space-x-1">
                      <span>Invoice #</span>
                      {getSortIcon('id')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => handleSort('amount')}>
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => handleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => handleSort('due_date')}>
                    <div className="flex items-center space-x-1">
                      <span>Due Date</span>
                      {getSortIcon('due_date')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => handleSort('paid_date')}>
                    <div className="flex items-center space-x-1">
                      <span>Paid Date</span>
                      {getSortIcon('paid_date')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {invoices.map((invoice, index) => (
                  <tr key={invoice.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                      INV-{invoice.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                      {invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 relative">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === invoice.id ? null : invoice.id);
                              if (openDropdownId !== invoice.id) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownCoords({
                                  x: rect.left,
                                  y: rect.bottom + window.scrollY
                                });
                              }
                            }}
                            className={`p-1 rounded-md transition-colors duration-200 ${
                              openDropdownId === invoice.id
                                ? 'text-blue-600 bg-blue-100' 
                                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
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

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-600">
                Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!hasPrevious}
                  className="px-2 py-1 text-xs font-medium border rounded-lg transition-colors duration-200 text-white border-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500"
                >
                  Previous
                </button>
                <span className="px-2 py-1 text-xs font-medium text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasNext}
                  className="px-2 py-1 text-xs font-medium border rounded-lg transition-colors duration-200 text-white border-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Plan Modal */}
      {isChangePlanModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change Subscription Plan</h3>
              <button
                onClick={() => setIsChangePlanModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Choose a plan...</option>
                {availablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsChangePlanModalOpen(false)}
                className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePlan}
                disabled={!selectedPlan}
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
              >
                Change Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  {FaBan({ className: "w-4 h-4 text-red-600" })}
                </div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to cancel your subscription? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Actions Dropdown */}
      {openDropdownId && (
        <div 
          className="fixed w-28 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]"
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
                setOpenDropdownId(null);
                // Handle view invoice
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
            >
              {FaEye({ className: "w-3 h-3 mr-2" })}
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(null);
                // Handle download invoice
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
            >
              {FaDownload({ className: "w-3 h-3 mr-2" })}
              Download
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(null);
                // Handle print invoice
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200"
            >
              {FaPrint({ className: "w-3 h-3 mr-2" })}
              Print
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(null);
                // Handle send invoice
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200"
            >
              {FaEnvelope({ className: "w-3 h-3 mr-2" })}
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center transition-all duration-300">
          <div className={`flex items-center space-x-2 ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          } px-4 py-3 rounded-xl shadow-xl`}>
            {toast.type === 'success' ? (
              FaCheckCircle({ className: "w-4 h-4 text-green-600" })
            ) : (
              FaTimes({ className: "w-4 h-4 text-red-600" })
            )}
            <span className="text-xs font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              {FaTimes({ className: "w-3 h-3" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminBillingDashboard;
