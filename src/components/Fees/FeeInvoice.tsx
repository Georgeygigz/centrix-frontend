import React from 'react';
import { FaFileAlt } from 'react-icons/fa';

interface FeeInvoiceProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  feeTypeFilter: string;
  setFeeTypeFilter: (filter: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  clearFilters: () => void;
  isAddDrawerOpen: boolean;
  openAddDrawer: () => void;
  closeAddDrawer: () => void;
}

const FeeInvoice: React.FC<FeeInvoiceProps> = ({
  searchQuery,
  setSearchQuery,
  debouncedSearchQuery,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  feeTypeFilter,
  setFeeTypeFilter,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  clearFilters,
  isAddDrawerOpen,
  openAddDrawer,
  closeAddDrawer
}) => {
  return (
    <div className="p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {FaFileAlt({ className: "w-8 h-8 text-green-600" })}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fee Invoice</h3>
        <p className="text-gray-600">This feature will allow you to manage and generate fee invoices for students.</p>
        <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
        
        {/* Debug info to show props are being passed */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-left">
          <p><strong>Search Query:</strong> {searchQuery}</p>
          <p><strong>Debounced Search:</strong> {debouncedSearchQuery}</p>
          <p><strong>Sort By:</strong> {sortBy}</p>
          <p><strong>Sort Direction:</strong> {sortDirection}</p>
          <p><strong>Fee Type Filter:</strong> {feeTypeFilter}</p>
          <p><strong>Category Filter:</strong> {categoryFilter}</p>
          <p><strong>Status Filter:</strong> {statusFilter}</p>
          <p><strong>Add Drawer Open:</strong> {isAddDrawerOpen ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default FeeInvoice;
