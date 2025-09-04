import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaList, FaUserGraduate, FaFileAlt, FaCreditCard, FaSearch } from 'react-icons/fa';
import FeeStructure from './FeeStructure';
import StudentFeeAssignment from './StudentFeeAssignment';
import FeeInvoice from './FeeInvoice';
import FeePayment from './FeePayment';

const Fees: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fee-structure');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [feeTypeFilter, setFeeTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      component: <StudentFeeAssignment />
    },
    {
      id: 'fee-invoice',
      label: 'Fee Invoice',
      icon: FaFileAlt,
      component: <FeeInvoice />
    },
    {
      id: 'fee-payment',
      label: 'Fee Payment',
      icon: FaCreditCard,
      component: <FeePayment />
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            {FaMoneyBillWave({ className: "w-6 h-6 text-white" })}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Fees Management</h1>
        </div>
        <p className="text-gray-600">Manage fee structures, assignments, invoices, and payments</p>
      </div>

      {/* Tabs and Controls Row */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex justify-between items-center">
          {/* Tabs */}
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon({ className: "w-4 h-4" })}
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* Search, Filters, and Add Button - Only show for Fee Structure tab */}
          {activeTab === 'fee-structure' && (
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search fee structures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {FaSearch({ className: "w-3 h-3" })}
                </div>
              </div>

              {/* Fee Type Filter */}
              <select
                value={feeTypeFilter}
                onChange={(e) => setFeeTypeFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Clear Filters
              </button>

              {/* Add Fee Structure Button */}
              <button 
                onClick={openAddDrawer}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                + Add Fee Structure
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default Fees;
