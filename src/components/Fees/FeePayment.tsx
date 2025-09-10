import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaDownload, FaEye, FaCreditCard } from 'react-icons/fa';
import { feesService } from '../../services/fees';
import { FeePayment as FeePaymentType, PaymentQueryParams } from '../../types/fees';
import PaymentDetailModal from './PaymentDetailModal';
import { apiService } from '../../services/api';

interface FeePaymentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  methodFilter: string;
  setMethodFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  clearFilters: () => void;
  onFilterOptionsUpdate?: (options: {
    paymentStatuses: Array<{ value: string; label: string }>;
    paymentMethods: Array<{ value: string; label: string }>;
    amountRanges: Array<{ value: string; label: string }>;
  }) => void;
}


const FeePayment: React.FC<FeePaymentProps> = ({
  searchQuery,
  setSearchQuery,
  debouncedSearchQuery,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  methodFilter,
  setMethodFilter,
  statusFilter,
  setStatusFilter,
  clearFilters,
  onFilterOptionsUpdate
}) => {
  const [payments, setPayments] = useState<FeePaymentType[]>([]);
  const allPaymentsRef = useRef<FeePaymentType[]>([]); // Store unfiltered data for filter options
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<FeePaymentType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<string | null>(null);

  // Function to extract unique filter options from payments
  const extractFilterOptions = (payments: FeePaymentType[]) => {
    const paymentStatusesMap = new Map<string, { value: string; label: string }>();
    const paymentMethodsMap = new Map<string, { value: string; label: string }>();
    const amountRangesMap = new Map<string, { value: string; label: string }>();

    payments.forEach(payment => {
      // Extract unique payment statuses
      if (payment.status) {
        const label = payment.status.charAt(0).toUpperCase() + payment.status.slice(1);
        paymentStatusesMap.set(payment.status, {
          value: payment.status,
          label: label
        });
      }

      // Extract unique payment methods
      if (payment.method) {
        const label = payment.method.charAt(0).toUpperCase() + payment.method.slice(1).replace('_', ' ');
        paymentMethodsMap.set(payment.method, {
          value: payment.method,
          label: label
        });
      }

      // Extract unique amount ranges
      if (payment.amount) {
        const amount = parseFloat(payment.amount);
        let range = '';
        let rangeLabel = '';
        
        if (amount >= 0 && amount <= 1000) {
          range = '0-1000';
          rangeLabel = 'KSh 0 - KSh 1,000';
        } else if (amount > 1000 && amount <= 5000) {
          range = '1000-5000';
          rangeLabel = 'KSh 1,000 - KSh 5,000';
        } else if (amount > 5000 && amount <= 10000) {
          range = '5000-10000';
          rangeLabel = 'KSh 5,000 - KSh 10,000';
        } else if (amount > 10000) {
          range = '10000+';
          rangeLabel = 'KSh 10,000+';
        }
        
        if (range) {
          amountRangesMap.set(range, {
            value: range,
            label: rangeLabel
          });
        }
      }
    });

    const filterOptions = {
      paymentStatuses: Array.from(paymentStatusesMap.values()),
      paymentMethods: Array.from(paymentMethodsMap.values()),
      amountRanges: Array.from(amountRangesMap.values())
    };

    // Call the callback to update parent component
    if (onFilterOptionsUpdate) {
      onFilterOptionsUpdate(filterOptions);
    }

    return filterOptions;
  };

  const fetchPayments = async (params?: PaymentQueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await feesService.getAllPayments(params);
      const paymentsData = response.results;
      setPayments(paymentsData);
      setTotalCount(response.count);
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
      
      // If this is the first load (no filters applied), store all data for filter options
      if (!methodFilter && !statusFilter && !debouncedSearchQuery) {
        allPaymentsRef.current = paymentsData;
        // Extract filter options from all unfiltered data
        extractFilterOptions(paymentsData);
      } else {
        // Extract filter options from the stored unfiltered data
        extractFilterOptions(allPaymentsRef.current);
      }
    } catch (err) {
      setError('Failed to fetch payments');
      console.error('Error fetching payments:', err);
      // Extract filter options from empty array on error
      extractFilterOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params: PaymentQueryParams = {
      search: debouncedSearchQuery || undefined,
      ordering: sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined,
      page: currentPage,
      page_size: 20,
    };
    fetchPayments(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, sortBy, sortDirection, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'reversed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'bank_transfer':
        return 'bg-blue-100 text-blue-800';
      case 'cheque':
        return 'bg-purple-100 text-purple-800';
      case 'mobile_money':
        return 'bg-orange-100 text-orange-800';
      case 'card':
        return 'bg-indigo-100 text-indigo-800';
      case 'online':
        return 'bg-cyan-100 text-cyan-800';
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <span className="text-blue-600">↑</span> : <span className="text-blue-600">↓</span>;
  };

  const handleViewPayment = (payment: FeePaymentType) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleDownloadReceipt = async (payment: FeePaymentType) => {
    setDownloadingPaymentId(payment.id);
    try {
      const headers = apiService.getAuthHeaders();
      
      // Ensure proper URL construction
      const cleanUrl = `/fees/payments/${payment.id}/download_receipt/`.startsWith('/') ? `/fees/payments/${payment.id}/download_receipt/`.substring(1) : `/fees/payments/${payment.id}/download_receipt/`;
      const baseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').endsWith('/') ? (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').slice(0, -1) : (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1');
      const fullUrl = `${baseUrl}/${cleanUrl}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          ...headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to download receipt: ${response.status} ${response.statusText}`);
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.receipt_number}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to download receipt: ${errorMessage}`);
    } finally {
      setDownloadingPaymentId(null);
    }
  };

  if (loading && payments.length === 0) {
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
            <p className="mt-2 text-xs text-gray-600">Loading payments...</p>
          </div>
        )}

        {error && (
          <div className="p-4 text-center">
            <div className="text-red-600 mb-3">
              {FaTimes({ className: "w-8 h-8 mx-auto mb-2" })}
              <p className="text-sm font-medium">Error Loading Payments</p>
              <p className="text-xs text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchPayments()}
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
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('receipt_number')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Receipt</span>
                      {getSortIcon('receipt_number')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('student_details__pupil_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Student</span>
                      {getSortIcon('student_details__pupil_name')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('invoice_details__invoice_number')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Invoice</span>
                      {getSortIcon('invoice_details__invoice_number')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('payment_date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Payment Date</span>
                      {getSortIcon('payment_date')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('method')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Method</span>
                      {getSortIcon('method')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('collected_by_details__username')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Collected By</span>
                      {getSortIcon('collected_by_details__username')}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {payment.receipt_number}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {payment.student_details.pupil_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.student_details.admission_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {payment.invoice_details.invoice_number}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getMethodColor(payment.method)}`}>
                        {payment.method_display}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status_display}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {payment.collected_by_details.first_name} {payment.collected_by_details.last_name}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewPayment(payment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          {FaEye({ className: "w-3 h-3" })}
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(payment)}
                          disabled={downloadingPaymentId === payment.id}
                          className={`${downloadingPaymentId === payment.id ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'}`}
                          title={downloadingPaymentId === payment.id ? "Downloading..." : "Download Receipt"}
                        >
                          {downloadingPaymentId === payment.id ? (
                            <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            FaDownload({ className: "w-3 h-3" })
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {payments.length === 0 && (
              <div className="text-center py-8">
                {FaCreditCard({ className: "mx-auto h-8 w-8 text-gray-400" })}
                <h3 className="mt-2 text-xs font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'No payments have been recorded yet.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> of{' '}
                        <span className="font-medium">{totalCount}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default FeePayment;