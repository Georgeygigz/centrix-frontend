import React, { useState } from 'react';
import { FaTimes, FaDownload, FaCreditCard, FaEye } from 'react-icons/fa';
import { FeePayment } from '../../types/fees';
import { apiService } from '../../services/api';

interface PaymentDetailModalProps {
  payment: FeePayment;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({ 
  payment, 
  isOpen, 
  onClose
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
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
      setIsDownloading(false);
    }
  };

  const handlePreviewReceipt = async () => {
    try {
      const headers = apiService.getAuthHeaders();
      
      // Ensure proper URL construction
      const cleanUrl = `/fees/payments/${payment.id}/preview_receipt/`.startsWith('/') ? `/fees/payments/${payment.id}/preview_receipt/`.substring(1) : `/fees/payments/${payment.id}/preview_receipt/`;
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
        throw new Error(`Failed to preview receipt: ${response.status} ${response.statusText}`);
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
      
    } catch (error) {
      console.error('Error previewing receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to preview receipt: ${errorMessage}`);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  interface DetailItem {
    label: string;
    value: string | boolean;
    isStatus?: boolean;
    isBoolean?: boolean;
    isMethod?: boolean;
  }

  const paymentFeatures = [
    {
      title: "Payment Information",
      tag: "payment_info",
      description: "Core payment identification and basic details",
      details: [
        { label: "Payment ID", value: payment.id },
        { label: "Receipt Number", value: payment.receipt_number },
        { label: "Amount", value: formatCurrency(payment.amount) },
        { label: "Payment Method", value: payment.method_display, isMethod: true },
        { label: "Status", value: payment.status_display, isStatus: true }
      ] as DetailItem[]
    },
    {
      title: "Student Details",
      tag: "student_details",
      description: "Student information and current class details",
      details: [
        { label: "Student Name", value: payment.student_details?.pupil_name || "Not provided" },
        { label: "Admission Number", value: payment.student_details?.admission_number || "Not provided" },
        { label: "Current Class", value: payment.student_details?.current_class?.name || "Not provided" },
        { label: "Stream", value: payment.student_details?.current_class?.stream?.name || "Not provided" },
        { label: "Guardian Name", value: payment.student_details?.guardian_name || "Not provided" },
        { label: "Guardian Phone", value: payment.student_details?.guardian_phone || "Not provided" }
      ] as DetailItem[]
    },
    {
      title: "Invoice Details",
      tag: "invoice_details",
      description: "Related invoice information",
      details: [
        { label: "Invoice Number", value: payment.invoice_details?.invoice_number || "Not provided" },
        { label: "Total Amount", value: payment.invoice_details?.total_amount ? formatCurrency(payment.invoice_details.total_amount) : "Not provided" },
        { label: "Balance Due", value: payment.invoice_details?.balance_due ? formatCurrency(payment.invoice_details.balance_due) : "Not provided" },
        { label: "Invoice Status", value: payment.invoice_details?.status || "Not provided" }
      ] as DetailItem[]
    },
    {
      title: "Payment Dates",
      tag: "payment_dates",
      description: "Important dates related to the payment",
      details: [
        { label: "Payment Date", value: payment.payment_date ? formatDate(payment.payment_date) : "Not provided" },
        { label: "Verification Date", value: payment.verification_date ? formatDateTime(payment.verification_date) : "Not verified" },
        { label: "Created At", value: payment.created_at ? formatDateTime(payment.created_at) : "Not provided" },
        { label: "Updated At", value: payment.updated_at ? formatDateTime(payment.updated_at) : "Not provided" }
      ] as DetailItem[]
    },
    {
      title: "Transaction Details",
      tag: "transaction_details",
      description: "Payment method specific information",
      details: [
        { label: "Reference Number", value: payment.reference_number || "Not provided" },
        { label: "Transaction ID", value: payment.transaction_id || "Not provided" },
        { label: "Bank Name", value: payment.bank_name || "Not applicable" },
        { label: "Branch Name", value: payment.branch_name || "Not applicable" },
        { label: "Cheque Number", value: payment.cheque_number || "Not applicable" },
        { label: "Notes", value: payment.notes || "No notes" }
      ] as DetailItem[]
    },
    {
      title: "Staff Information",
      tag: "staff_info",
      description: "Staff members involved in the payment process",
      details: [
        { label: "Collected By", value: `${payment.collected_by_details?.first_name || ''} ${payment.collected_by_details?.last_name || ''}`.trim() || "Not provided" },
        { label: "Collector Email", value: payment.collected_by_details?.email || "Not provided" },
        { label: "Collector Role", value: payment.collected_by_details?.role || "Not provided" },
        { label: "Verified By", value: payment.verified_by_details ? `${payment.verified_by_details.first_name} ${payment.verified_by_details.last_name}`.trim() : "Not verified" },
        { label: "Verifier Email", value: payment.verified_by_details?.email || "Not provided" },
        { label: "Verifier Role", value: payment.verified_by_details?.role || "Not provided" }
      ] as DetailItem[]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
      <div className="bg-blue-100 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              {FaCreditCard({ className: "w-4 h-4 text-white" })}
            </div>
            <h2 className="text-lg font-bold text-blue-900">
              {payment.student_details?.pupil_name || 'Student'} - {payment.receipt_number}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviewReceipt}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200"
              title="Preview Receipt"
            >
              {FaEye({ className: "w-4 h-4 text-blue-600" })}
            </button>
            <button
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDownloading ? "Downloading..." : "Download Receipt"}
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                FaDownload({ className: "w-4 h-4 text-blue-600" })
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200"
              title="Close"
            >
              {FaTimes({ className: "w-4 h-4 text-blue-600" })}
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-3 space-y-3">
          {paymentFeatures.map((feature, index) => (
            <div key={feature.tag} className="bg-white rounded-lg p-3 shadow-sm">
              {/* Feature Header */}
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {feature.tag}
                </span>
              </div>

              {/* Feature Description */}
              <p className="text-xs text-gray-500 mb-2">{feature.description}</p>

              {/* Feature Details */}
              <div className="space-y-0.5">
                {feature.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex justify-between items-center py-1 border-b border-blue-200 last:border-b-0">
                    <span className={`text-xs font-semibold text-gray-800 flex-shrink-0 px-2 py-1 ${detail.label === "Payment ID" ? "w-20" : "w-40"}`}>{detail.label}:</span>
                    <div className={`text-xs text-gray-900 text-right ${detail.label === "Payment ID" ? "w-52" : "w-32"}`}>
                      <span>
                        {detail.isStatus ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {detail.value}
                          </span>
                        ) : detail.isMethod ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(payment.method)}`}>
                            {detail.value}
                          </span>
                        ) : detail.isBoolean ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            detail.value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {detail.value ? "Yes" : "No"}
                          </span>
                        ) : (
                          String(detail.value || "Not provided")
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-4 pt-4 pb-6 border-t border-blue-200 bg-blue-50">
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {isPreviewOpen && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10002]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Receipt Preview - {payment.receipt_number}
              </h3>
              <button
                onClick={handleClosePreview}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                title="Close Preview"
              >
                {FaTimes({ className: "w-4 h-4 text-gray-600" })}
              </button>
            </div>
            
            {/* Preview Content */}
            <div className="p-4 h-[calc(90vh-80px)] overflow-auto">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title={`Receipt Preview - ${payment.receipt_number}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetailModal;
