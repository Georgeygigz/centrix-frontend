import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaFileAlt, FaDownload, FaEye, FaTimes, FaEllipsisV, FaCreditCard, FaEdit, FaTrash } from 'react-icons/fa';
import { feesService } from '../../services/fees';
import { FeeInvoice as FeeInvoiceType, InvoiceQueryParams } from '../../types/fees';
import { apiService } from '../../services/api';
import FeeInvoiceDetailModal from './FeeInvoiceDetailModal';
import PaymentDrawer from './PaymentDrawer';

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
  const [invoices, setInvoices] = useState<FeeInvoiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoiceType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<FeeInvoiceType | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchInvoices = async (params?: InvoiceQueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await feesService.getAllInvoices(params);
      setInvoices(response.results);
    } catch (err) {
      setError('Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params: InvoiceQueryParams = {
      search: debouncedSearchQuery || undefined,
      ordering: sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined,
    };
    fetchInvoices(params);
  }, [debouncedSearchQuery, sortBy, sortDirection]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const target = event.target as Element;
        // Check if click is outside the dropdown portal and the button
        if (!target.closest('[data-dropdown-portal]') && !target.closest('[data-dropdown-button]')) {
          closeDropdown();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'partially_paid':
        return 'bg-orange-100 text-orange-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewInvoice = (invoice: FeeInvoiceType) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const toggleDropdown = (invoiceId: string, event: React.MouseEvent) => {
    if (openDropdownId === invoiceId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 192, // 192px is the width of the dropdown (w-48)
      });
      setOpenDropdownId(invoiceId);
    }
  };

  const closeDropdown = () => {
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handlePayFees = (invoice: FeeInvoiceType) => {
    setPaymentInvoice(invoice);
    setIsPaymentDrawerOpen(true);
    closeDropdown();
  };

  const handleClosePaymentDrawer = () => {
    setIsPaymentDrawerOpen(false);
    setPaymentInvoice(null);
  };

  const handlePaymentSuccess = () => {
    // Refresh the invoices list after successful payment
    fetchInvoices();
  };

  const handleEditInvoice = (invoice: FeeInvoiceType) => {
    // TODO: Implement edit functionality
    console.log('Edit invoice:', invoice.id);
    alert(`Edit invoice ${invoice.invoice_number}`);
    closeDropdown();
  };

  const handleDeleteInvoice = (invoice: FeeInvoiceType) => {
    // TODO: Implement delete functionality
    console.log('Delete invoice:', invoice.id);
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      alert(`Delete invoice ${invoice.invoice_number}`);
    }
    closeDropdown();
  };

  const handleDownloadPDF = async (invoice: FeeInvoiceType) => {
    setDownloadingInvoiceId(invoice.id);
    try {
      const headers = apiService.getAuthHeaders();
      
      // Ensure proper URL construction
      const cleanUrl = `/fees/invoices/${invoice.id}/download_pdf/`.startsWith('/') ? `/fees/invoices/${invoice.id}/download_pdf/`.substring(1) : `/fees/invoices/${invoice.id}/download_pdf/`;
      const baseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').endsWith('/') ? (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').slice(0, -1) : (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1');
      const fullUrl = `${baseUrl}/${cleanUrl}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading && (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-xs text-gray-600">Loading fee invoices...</p>
          </div>
        )}

        {error && (
          <div className="p-4 text-center">
            <div className="text-red-600 mb-3">
              {FaTimes({ className: "w-8 h-8 mx-auto mb-2" })}
              <p className="text-sm font-medium">Error Loading Fee Invoices</p>
              <p className="text-xs text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchInvoices()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Invoice
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Academic year
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Issue date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Due date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-xs text-gray-500">
                          Term {invoice.term}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {invoice.student_details.pupil_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.student_details.admission_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {invoice.academic_year}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {formatDate(invoice.due_date)}
                      </div>
                      {invoice.is_overdue && (
                        <div className="text-xs text-red-600 font-medium">
                          Overdue
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(invoice.net_amount)}
                      </div>
                      {parseFloat(invoice.balance_due) > 0 && (
                        <div className="text-xs text-gray-500">
                          Bal: {formatCurrency(invoice.balance_due)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status_display}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          {FaEye({ className: "w-3 h-3" })}
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          disabled={downloadingInvoiceId === invoice.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={downloadingInvoiceId === invoice.id ? "Downloading..." : "Download PDF"}
                        >
                          {downloadingInvoiceId === invoice.id ? (
                            <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            FaDownload({ className: "w-3 h-3" })
                          )}
                        </button>
                        
                        {/* Three dots menu */}
                        <div className="relative" ref={(el) => { dropdownRefs.current[invoice.id] = el; }}>
                          <button
                            onClick={(e) => toggleDropdown(invoice.id, e)}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none"
                            title="More actions"
                            data-dropdown-button
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

          {/* Empty State */}
          {invoices.length === 0 && (
            <div className="text-center py-8">
              {FaFileAlt({ className: "mx-auto h-8 w-8 text-gray-400" })}
              <h3 className="mt-2 text-xs font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-xs text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by generating invoices for students.'}
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Fee Invoice Detail Modal */}
      {selectedInvoice && (
        <FeeInvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Action Dropdown Portal */}
      {openDropdownId && dropdownPosition && createPortal(
        <div
          className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-48"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
          data-dropdown-portal
        >
          <button
            onClick={() => handlePayFees(invoices.find(inv => inv.id === openDropdownId)!)}
            className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
          >
            {FaCreditCard({ className: "mr-2 text-green-600" })}
            Pay Fees
          </button>
          <button
            onClick={() => handleViewInvoice(invoices.find(inv => inv.id === openDropdownId)!)}
            className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
          >
            {FaEye({ className: "mr-2 text-blue-600" })}
            View Details
          </button>
          <button
            onClick={() => handleDownloadPDF(invoices.find(inv => inv.id === openDropdownId)!)}
            disabled={downloadingInvoiceId === openDropdownId}
            className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {FaDownload({ className: "mr-2 text-green-600" })}
            Download PDF
          </button>
          <button
            onClick={() => handleEditInvoice(invoices.find(inv => inv.id === openDropdownId)!)}
            className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
          >
            {FaEdit({ className: "mr-2 text-blue-600" })}
            Edit Invoice
          </button>
          <button
            onClick={() => handleDeleteInvoice(invoices.find(inv => inv.id === openDropdownId)!)}
            className="flex items-center w-full px-3 py-2 text-xs text-red-700 hover:bg-red-50"
          >
            {FaTrash({ className: "mr-2 text-red-600" })}
            Delete Invoice
          </button>
        </div>,
        document.body
      )}

      {/* Payment Drawer */}
      <PaymentDrawer
        isOpen={isPaymentDrawerOpen}
        onClose={handleClosePaymentDrawer}
        invoice={paymentInvoice}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default FeeInvoice;
