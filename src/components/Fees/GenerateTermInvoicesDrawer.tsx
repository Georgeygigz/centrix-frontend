import React, { useState } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaFileAlt } from 'react-icons/fa';
import { feesService } from '../../services/fees';
import { GenerateTermInvoicesRequest, GenerateTermInvoicesResponse } from '../../types/fees';
import YearPicker from './YearPicker';

interface GenerateTermInvoicesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (response: GenerateTermInvoicesResponse) => void;
}

const GenerateTermInvoicesDrawer: React.FC<GenerateTermInvoicesDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<GenerateTermInvoicesRequest>({
    academic_year: '',
    term: 1,
    due_date_days: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<GenerateTermInvoicesResponse | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'term' ? parseInt(value) || 0 : value
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setFormErrors({});

    try {
      const response = await feesService.generateTermInvoices(formData);
      setSuccess(response);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: any) {
      console.error('Error generating term invoices:', err);
      
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setError(err.message || 'Failed to generate term invoices');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      academic_year: '',
      term: 1,
      due_date_days: ''
    });
    setError(null);
    setSuccess(null);
    setFormErrors({});
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300 ease-out z-50">
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              {FaFileAlt({ className: "w-5 h-5 text-blue-600" })}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Generate Term Invoices</h2>
              <p className="text-sm text-gray-500">Create invoices for all students for a specific term</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
          >
            {FaTimes({ className: "w-4 h-4" })}
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {success ? (
              // Success State
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  {FaCheckCircle({ className: "h-8 w-8 text-green-600" })}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Invoices Generated Successfully!</h3>
                <div className="text-sm text-gray-600 space-y-2 bg-green-50 p-4 rounded-lg">
                  <p><strong>Academic Year:</strong> {success.academic_year}</p>
                  <p><strong>Term:</strong> {success.term}</p>
                  <p><strong>Invoices Generated:</strong> {success.invoices_generated}</p>
                  <p><strong>Total Amount:</strong> KSh {success.total_amount}</p>
                  <p><strong>Due Date:</strong> {new Date(success.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              // Form State
              <>
                {/* General Error Banner */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div className="p-1 bg-red-100 rounded-full">
                          {FaExclamationTriangle({ className: "h-4 w-4 text-red-500" })}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">Please fix the errors below</p>
                      </div>
                    </div>
                  </div>
                )}

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
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    Academic Year *
                  </label>
                  <YearPicker
                    value={formData.academic_year}
                    onChange={(value) => handleInputChange({ target: { name: 'academic_year', value } } as any)}
                    placeholder="Select academic year (e.g., 2024-2025)"
                    error={!!formErrors.academic_year}
                  />
                  <p className="text-xs text-gray-500 mt-1">Select the academic year for the invoices</p>
                  {formErrors.academic_year && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.academic_year[0]}</p>
                  )}
                </div>

                {/* Term */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Term *
                  </label>
                  <select
                    name="term"
                    value={formData.term}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                      formErrors.term ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                  {formErrors.term && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.term[0]}</p>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    name="due_date_days"
                    value={formData.due_date_days}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                      formErrors.due_date_days ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Date when invoices are due</p>
                  {formErrors.due_date_days && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.due_date_days[0]}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          {success ? (
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 flex items-center space-x-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  'Generate Invoices'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateTermInvoicesDrawer;
