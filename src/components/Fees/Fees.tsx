import React, { useState, useEffect } from 'react';
import { FaList, FaUserGraduate, FaFileAlt, FaCreditCard, FaSearch, FaPlus } from 'react-icons/fa';
import FeeStructure from './FeeStructure';
import StudentFeeAssignment from './StudentFeeAssignment';
import FeeInvoice from './FeeInvoice';
import FeePayment from './FeePayment';
import GenerateTermInvoicesDrawer from './GenerateTermInvoicesDrawer';

const Fees: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fee-structure');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [feeTypeFilter, setFeeTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearFilters = () => {
    setFeeTypeFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setMethodFilter('');
    setSearchQuery('');
    setSortBy('');
    setSortDirection('asc');
  };

  // Add Fee Structure drawer state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const openAddDrawer = () => {
    setIsAddDrawerOpen(true);
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
  };

  // Generate Term Invoices drawer state
  const [isGenerateDrawerOpen, setIsGenerateDrawerOpen] = useState(false);

  const openGenerateDrawer = () => {
    setIsGenerateDrawerOpen(true);
  };

  const closeGenerateDrawer = () => {
    setIsGenerateDrawerOpen(false);
  };

  // Helper functions for dynamic UI
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'fee-structure':
        return 'Search fee structures...';
      case 'student-assignment':
        return 'Search students...';
      case 'fee-invoice':
        return 'Search invoices...';
      case 'fee-payment':
        return 'Search payments...';
      default:
        return 'Search...';
    }
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case 'fee-structure':
        return '+ Add Fee Structure';
      case 'student-assignment':
        return '+ Add Assignment';
      case 'fee-invoice':
        return '+ Add Invoice';
      case 'fee-payment':
        return '+ Add Payment';
      default:
        return '+ Add';
    }
  };

  const getFilterOptions = () => {
    switch (activeTab) {
      case 'fee-structure':
        return (
          <>
            {/* Fee Type Filter */}
            <select
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Types</option>
              <option value="tuition">Tuition</option>
              <option value="development">Development</option>
              <option value="library">Library</option>
              <option value="laboratory">Laboratory</option>
              <option value="sports">Sports</option>
              <option value="transport">Transport</option>
              <option value="hostel">Hostel</option>
              <option value="exam">Exam</option>
              <option value="miscellaneous">Miscellaneous</option>
              <option value="fine">Fine</option>
              <option value="discount">Discount</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Categories</option>
              <option value="academic">Academic</option>
              <option value="non_academic">Non-Academic</option>
              <option value="fine">Fine</option>
              <option value="discount">Discount</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </>
        );
      case 'student-assignment':
        return (
          <>
            {/* Class Filter */}
            <select
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Classes</option>
              <option value="class1">Class 1</option>
              <option value="class2">Class 2</option>
              <option value="class3">Class 3</option>
            </select>

            {/* Stream Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Streams</option>
              <option value="science">Science</option>
              <option value="commerce">Commerce</option>
              <option value="arts">Arts</option>
            </select>

            {/* Assignment Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </>
        );
      case 'fee-invoice':
        return (
          <>
            {/* Invoice Status Filter */}
            <select
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Fee Type Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Types</option>
              <option value="tuition">Tuition</option>
              <option value="development">Development</option>
              <option value="library">Library</option>
              <option value="laboratory">Laboratory</option>
            </select>

            {/* Month Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Months</option>
              <option value="january">January</option>
              <option value="february">February</option>
              <option value="march">March</option>
              <option value="april">April</option>
            </select>
          </>
        );
      case 'fee-payment':
        return (
          <>
            {/* Payment Status Filter */}
            <select
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>

            {/* Amount Range Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">All Amounts</option>
              <option value="0-1000">KSh 0 - KSh 1,000</option>
              <option value="1000-5000">KSh 1,000 - KSh 5,000</option>
              <option value="5000-10000">KSh 5,000 - KSh 10,000</option>
              <option value="10000+">KSh 10,000+</option>
            </select>
          </>
        );
      default:
        return null;
    }
  };

  const tabs = [
    {
      id: 'fee-structure',
      label: 'Fee Structure',
      icon: FaList,
      component: <FeeStructure 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        feeTypeFilter={feeTypeFilter}
        setFeeTypeFilter={setFeeTypeFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        clearFilters={clearFilters}
        isAddDrawerOpen={isAddDrawerOpen}
        openAddDrawer={openAddDrawer}
        closeAddDrawer={closeAddDrawer}
      />
    },
    {
      id: 'student-assignment',
      label: 'Student Fee Assignment',
      icon: FaUserGraduate,
      component: <StudentFeeAssignment 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        feeTypeFilter={feeTypeFilter}
        setFeeTypeFilter={setFeeTypeFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        clearFilters={clearFilters}
        isAddDrawerOpen={isAddDrawerOpen}
        openAddDrawer={openAddDrawer}
        closeAddDrawer={closeAddDrawer}
      />
    },
    {
      id: 'fee-invoice',
      label: 'Fee Invoice',
      icon: FaFileAlt,
      component: <FeeInvoice 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        feeTypeFilter={feeTypeFilter}
        setFeeTypeFilter={setFeeTypeFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        clearFilters={clearFilters}
        isAddDrawerOpen={isAddDrawerOpen}
        openAddDrawer={openAddDrawer}
        closeAddDrawer={closeAddDrawer}
      />
    },
    {
      id: 'fee-payment',
      label: 'Fee Payment',
      icon: FaCreditCard,
      component: <FeePayment 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        methodFilter={methodFilter}
        setMethodFilter={setMethodFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        clearFilters={clearFilters}
      />
    }
  ];

  return (
    <div className="p-6">

      {/* Tabs and Controls Row */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex justify-between items-center">
          {/* Tabs */}
          <nav className="-mb-px flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  {tab.icon({ className: "w-3.5 h-3.5" })}
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* Search, Filters, and Add Button - Show for all tabs */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 pl-6 pr-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                {FaSearch({ className: "w-3 h-3" })}
              </div>
            </div>

            {/* Dynamic Filters based on active tab */}
            {getFilterOptions()}

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Clear Filters
            </button>

            {/* Dynamic Add Button */}
            <button 
              onClick={openAddDrawer}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
            >
              {getAddButtonText()}
            </button>

            {/* Generate Term Invoices Button - Only show for Fee Invoice tab */}
            {activeTab === 'fee-invoice' && (
              <button 
                onClick={openGenerateDrawer}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
              >
                {FaPlus({ className: "w-3 h-3 mr-1" })}
                Generate Term Invoices
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>

      {/* Generate Term Invoices Drawer */}
      <GenerateTermInvoicesDrawer
        isOpen={isGenerateDrawerOpen}
        onClose={closeGenerateDrawer}
        onSuccess={() => {
          // Refresh the current tab content if it's the fee-invoice tab
          if (activeTab === 'fee-invoice') {
            // The FeeInvoice component will handle its own refresh
          }
        }}
      />
    </div>
  );
};

export default Fees;
