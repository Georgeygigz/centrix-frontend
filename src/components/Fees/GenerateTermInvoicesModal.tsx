import React, { useState } from 'react';
import { FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { feesService } from '../../services/fees';
import { GenerateTermInvoicesRequest, GenerateTermInvoicesResponse } from '../../types/fees';

interface GenerateTermInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (response: GenerateTermInvoicesResponse) => void;
}

const GenerateTermInvoicesModal: React.FC<GenerateTermInvoicesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<GenerateTermInvoicesRequest>({
    academic_year: '',
    term: 1,
    due_date_days: 30
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<GenerateTermInvoicesResponse | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'term' || name === 'due_date_days' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await feesService.generateTermInvoices(formData);
      setSuccess(response);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate term invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      academic_year: '',
      term: 1,
      due_date_days: 30
    });
    setError(null);
    setSuccess(null);
    onClose();
  };

  const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${currentYear}-${nextYear}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Generate Term Invoices</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {FaTimes({ className: "w-5 h-5" })}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            // Success State
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                {FaCheckCircle({ className: "h-6 w-6 text-green-600" })}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invoices Generated Successfully!</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Academic Year:</strong> {success.academic_year}</p>
                <p><strong>Term:</strong> {success.term}</p>
                <p><strong>Invoices Generated:</strong> {success.invoices_generated}</p>
                <p><strong>Total Amount:</strong> KSh {success.total_amount}</p>
                <p><strong>Due Date:</strong> {new Date(success.due_date).toLocaleDateString()}</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleClose}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {FaExclamationTriangle({ className: "h-5 w-5 text-red-400" })}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Year */}
              <div>
                <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  id="academic_year"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  placeholder={getCurrentAcademicYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: YYYY-YYYY (e.g., 2024-2025)</p>
              </div>

              {/* Term */}
              <div>
                <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
                  Term
                </label>
                <select
                  id="term"
                  name="term"
                  value={formData.term}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>

              {/* Due Date Days */}
              <div>
                <label htmlFor="due_date_days" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Days from Today)
                </label>
                <input
                  type="number"
                  id="due_date_days"
                  name="due_date_days"
                  value={formData.due_date_days}
                  onChange={handleInputChange}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Number of days from today when invoices are due</p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      {FaSpinner({ className: "animate-spin mr-2" })}
                      Generating...
                    </>
                  ) : (
                    'Generate Invoices'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateTermInvoicesModal;
