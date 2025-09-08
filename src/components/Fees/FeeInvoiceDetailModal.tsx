import React, { useState } from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';
import { FeeInvoice } from '../../types/fees';
import { apiService } from '../../services/api';

interface FeeInvoiceDetailModalProps {
  invoice: FeeInvoice;
  isOpen: boolean;
  onClose: () => void;
}

const FeeInvoiceDetailModal: React.FC<FeeInvoiceDetailModalProps> = ({ 
  invoice, 
  isOpen, 
  onClose
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
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
      // You could add a toast notification here to show the error
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  interface DetailItem {
    label: string;
    value: string | boolean;
    isStatus?: boolean;
    isBoolean?: boolean;
    isItem?: boolean;
  }

  const invoiceFeatures = [
    {
      title: "Invoice Information",
      tag: "invoice_info",
      description: "Core invoice identification and basic details",
      details: [
        { label: "Invoice ID", value: invoice.id },
        { label: "Invoice Number", value: invoice.invoice_number },
        { label: "Academic Year", value: invoice.academic_year },
        { label: "Term", value: `Term ${invoice.term}` },
        { label: "Status", value: invoice.status_display, isStatus: true }
      ] as DetailItem[]
    },
    {
      title: "Student Details",
      tag: "student_details",
      description: "Student information and current class details",
      details: [
        { label: "Student Name", value: invoice.student_details?.pupil_name || "Not provided" },
        { label: "Admission Number", value: invoice.student_details?.admission_number || "Not provided" },
        { label: "Current Class", value: invoice.student_details?.current_class?.name || "Not provided" },
        { label: "Stream", value: invoice.student_details?.current_class?.stream?.name || "Not provided" },
        { label: "Guardian Name", value: invoice.student_details?.guardian_name || "Not provided" },
        { label: "Guardian Phone", value: invoice.student_details?.guardian_phone || "Not provided" }
      ] as DetailItem[]
    },
    {
      title: "Invoice Dates",
      tag: "invoice_dates",
      description: "Important dates related to the invoice",
      details: [
        { label: "Issue Date", value: invoice.issue_date ? formatDate(invoice.issue_date) : "Not provided" },
        { label: "Due Date", value: invoice.due_date ? formatDate(invoice.due_date) : "Not provided" },
        { label: "Paid Date", value: invoice.paid_date ? formatDate(invoice.paid_date) : "Not paid" },
        { label: "Is Overdue", value: invoice.is_overdue, isBoolean: true }
      ] as DetailItem[]
    },
    {
      title: "Financial Summary",
      tag: "financial_summary",
      description: "Invoice amounts and payment details",
      details: [
        { label: "Total Amount", value: formatCurrency(invoice.total_amount) },
        { label: "Total Discount", value: formatCurrency(invoice.total_discount) },
        { label: "Total Waiver", value: formatCurrency(invoice.total_waiver) },
        { label: "Total Late Fee", value: formatCurrency(invoice.total_late_fee) },
        { label: "Net Amount", value: formatCurrency(invoice.net_amount) },
        { label: "Amount Paid", value: formatCurrency(invoice.amount_paid) },
        { label: "Balance Due", value: formatCurrency(invoice.balance_due) }
      ] as DetailItem[]
    },
    {
      title: "Invoice Items",
      tag: "invoice_items",
      description: "Detailed breakdown of invoice items",
      details: (invoice.items?.map((item, index) => ({
        label: `${item.fee_structure_details?.name || 'Item'} (${index + 1})`,
        value: `${formatCurrency(item.net_amount)} - ${item.fee_structure_details?.fee_type || 'N/A'}`,
        isItem: true
      })) || [{ label: "No Items", value: "No items found" }]) as DetailItem[]
    },
    {
      title: "System Information",
      tag: "system_info",
      description: "Creation and update timestamps",
      details: [
        { label: "Created At", value: invoice.created_at ? formatDate(invoice.created_at) : "Not provided" },
        { label: "Updated At", value: invoice.updated_at ? formatDate(invoice.updated_at) : "Not provided" },
        { label: "Notes", value: invoice.notes || "No notes" }
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
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-blue-900">
              {invoice.student_details?.pupil_name || 'Student'} - {invoice.invoice_number}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDownloading ? "Downloading..." : "Download PDF"}
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
          {invoiceFeatures.map((feature, index) => (
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
                    <span className={`text-xs font-semibold text-gray-800 flex-shrink-0 px-2 py-1 ${detail.label === "Invoice ID" ? "w-20" : "w-40"}`}>{detail.label}:</span>
                    <div className={`text-xs text-gray-900 text-right ${detail.label === "Invoice ID" ? "w-52" : "w-32"}`}>
                      <span>
                        {detail.isStatus ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {detail.value}
                          </span>
                        ) : detail.isBoolean ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            detail.value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {detail.value ? "Yes" : "No"}
                          </span>
                        ) : detail.isItem ? (
                          <span className="text-xs text-gray-700">{detail.value}</span>
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
    </div>
  );
};

export default FeeInvoiceDetailModal;
