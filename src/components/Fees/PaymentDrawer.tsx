import React, { useState } from 'react';
import { FaTimes, FaCreditCard, FaFileAlt, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { FeeInvoice } from '../../types/fees';
import { feesService } from '../../services/fees';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: FeeInvoice | null;
  onPaymentSuccess?: () => void;
}

interface PaymentFormData {
  amount: string;
  invoice: string;
  method: 'cash' | 'cheque' | 'bank_transfer' | 'mobile_money' | 'card' | 'online';
  reference_number: string;
  student: string;
  payment_date: string;
  bank_name: string;
  branch_name: string;
  cheque_number: string;
  transaction_id: string;
  verification_date: string;
  notes: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'online', label: 'Online Payment' },
];

const PaymentDrawer: React.FC<PaymentDrawerProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    invoice: '',
    method: 'bank_transfer',
    reference_number: '',
    student: '',
    payment_date: new Date().toISOString().split('T')[0],
    bank_name: '',
    branch_name: '',
    cheque_number: '',
    transaction_id: '',
    verification_date: new Date().toISOString(),
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [overpaymentAmount, setOverpaymentAmount] = useState<number>(0);

  // Initialize form data when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        amount: invoice.balance_due || invoice.net_amount,
        invoice: invoice.id,
        student: invoice.student,
        reference_number: '',
        bank_name: '',
        branch_name: '',
        cheque_number: '',
        transaction_id: '',
        notes: '',
      }));
      setErrors({});
      setSuccessMessage('');
    }
  }, [invoice]);

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Calculate overpayment when amount changes
    if (field === 'amount' && invoice) {
      const paymentAmount = parseFloat(value) || 0;
      const balanceDue = parseFloat(invoice.balance_due) || 0;
      const overpayment = paymentAmount > balanceDue ? paymentAmount - balanceDue : 0;
      setOverpaymentAmount(overpayment);
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: []
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Prepare payment data
      const paymentData = {
        amount: formData.amount,
        invoice: formData.invoice,
        method: formData.method,
        reference_number: formData.reference_number,
        student: formData.student,
        payment_date: formData.payment_date,
        bank_name: formData.bank_name || undefined,
        branch_name: formData.branch_name || undefined,
        cheque_number: formData.cheque_number || undefined,
        transaction_id: formData.transaction_id,
        verification_date: formData.verification_date,
        notes: formData.notes || undefined,
      };

      await feesService.createPayment(paymentData);
      
      setSuccessMessage('Payment recorded successfully!');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onPaymentSuccess?.();
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Error creating payment:', error);
      
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: ['Failed to record payment. Please try again.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(parseFloat(amount));
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
      <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-green-100 rounded-lg">
              {FaCreditCard({ className: "w-4 h-4 text-green-600" })}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
              <p className="text-xs text-gray-600">Invoice #{invoice.invoice_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            {FaTimes({ className: "w-4 h-4" })}
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 space-y-4">
          {/* Invoice Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              {FaFileAlt({ className: "w-4 h-4 text-blue-600" })}
              <h3 className="text-sm font-semibold text-blue-900">Invoice Details</h3>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-700">Full Name:</span>
                <span className="text-blue-900 font-medium">{invoice.student_details.pupil_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Admission No:</span>
                <span className="text-blue-900 font-medium">{invoice.student_details.admission_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Amount:</span>
                <span className="text-blue-900 font-medium">{formatCurrency(invoice.net_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Balance Due:</span>
                <span className="text-blue-900 font-medium">{formatCurrency(invoice.balance_due)}</span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                {FaCheck({ className: "w-4 h-4 text-green-600" })}
                <p className="text-green-800 text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                {FaExclamationTriangle({ className: "w-4 h-4 text-red-600" })}
                <div>
                  <p className="text-red-800 text-sm font-medium">Error</p>
                  <p className="text-red-700 text-xs mt-1">{errors.general[0]}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                Amount *
              </label>
              
              {/* Current Balance Display */}
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-blue-700">Current Balance:</span>
                  <span className="text-xs font-bold text-blue-900">{formatCurrency(invoice.balance_due)}</span>
                </div>
              </div>
              
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="Enter payment amount"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                  errors.amount ? 'border-red-300 bg-red-50' : 
                  overpaymentAmount > 0 ? 'border-yellow-300 bg-yellow-50' : 
                  'border-gray-300 hover:border-gray-400'
                }`}
                required
              />
              
              {/* Overpayment Warning */}
              {overpaymentAmount > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    {FaExclamationTriangle({ className: "w-3 h-3 text-yellow-600" })}
                    <div>
                      <p className="text-xs font-medium text-yellow-800">Overpayment Detected</p>
                      <p className="text-xs text-yellow-700">
                        You are paying {formatCurrency(overpaymentAmount.toString())} more than the balance due.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount[0]}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                Payment Method *
              </label>
              <select
                value={formData.method}
                onChange={(e) => handleInputChange('method', e.target.value as any)}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                  errors.method ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.method && (
                <p className="mt-1 text-xs text-red-600">{errors.method[0]}</p>
              )}
            </div>

            {/* Reference Number */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                Reference Number *
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => handleInputChange('reference_number', e.target.value)}
                placeholder="Enter reference number"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                  errors.reference_number ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                required
              />
              {errors.reference_number && (
                <p className="mt-1 text-xs text-red-600">{errors.reference_number[0]}</p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleInputChange('payment_date', e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                  errors.payment_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                required
              />
              {errors.payment_date && (
                <p className="mt-1 text-xs text-red-600">{errors.payment_date[0]}</p>
              )}
            </div>

            {/* Transaction ID */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                Transaction ID *
              </label>
              <input
                type="text"
                value={formData.transaction_id}
                onChange={(e) => handleInputChange('transaction_id', e.target.value)}
                placeholder="Enter transaction ID"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                  errors.transaction_id ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                required
              />
              {errors.transaction_id && (
                <p className="mt-1 text-xs text-red-600">{errors.transaction_id[0]}</p>
              )}
            </div>

            {/* Conditional Fields based on Payment Method */}
            {(formData.method === 'bank_transfer' || formData.method === 'cheque') && (
              <>
                {/* Bank Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    placeholder="Enter bank name"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white ${
                      errors.bank_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {errors.bank_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.bank_name[0]}</p>
                  )}
                </div>

                {/* Branch Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => handleInputChange('branch_name', e.target.value)}
                    placeholder="Enter branch name"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                      errors.branch_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {errors.branch_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.branch_name[0]}</p>
                  )}
                </div>
              </>
            )}

            {/* Cheque Number - only for cheque payments */}
            {formData.method === 'cheque' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
                  Cheque Number
                </label>
                <input
                  type="text"
                  value={formData.cheque_number}
                  onChange={(e) => handleInputChange('cheque_number', e.target.value)}
                  placeholder="Enter cheque number"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-100 focus:border-yellow-500 transition-all duration-200 bg-white ${
                    errors.cheque_number ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.cheque_number && (
                  <p className="mt-1 text-xs text-red-600">{errors.cheque_number[0]}</p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-white resize-none ${
                  errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              />
              {errors.notes && (
                <p className="mt-1 text-xs text-red-600">{errors.notes[0]}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentDrawer;
