import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaPlus, FaList, FaEye, FaCheckCircle } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';
import { feesService } from '../../services/fees';
import { apiService } from '../../services/api';
import { FeeStructure, PaginationParams } from '../../types/fees';
import { Class, Stream } from '../../types/dashboard';
import FeeStructureDetailModal from './FeeStructureDetailModal';

interface FeeStructureProps {
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
  onFilterOptionsUpdate?: (options: {
    feeTypes: Array<{ value: string; label: string }>;
    categories: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
  }) => void;
}

const FeeStructureComponent: React.FC<FeeStructureProps> = ({
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
  closeAddDrawer,
  onFilterOptionsUpdate
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const allFeeStructuresRef = useRef<FeeStructure[]>([]); // Store unfiltered data for filter options
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<FeeStructure>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Pagination state
  const [pageSize] = useState(20);

  // Form state for new fee structure
  const [newFeeStructure, setNewFeeStructure] = useState({
    name: '',
    fee_type: 'tuition' as const,
    category: 'academic' as const,
    description: '',
    amount: '',
    frequency: 'monthly' as const,
    applicable_to_all: true,
    due_date: '',
    late_fee_applicable: false,
    late_fee_amount: '0',
    late_fee_percentage: '0',
    is_active: true,
    is_discount: false,
    discount_percentage: '0',
    max_discount_amount: '',
    applicable_class: '',
    applicable_stream: ''
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Classes and streams data
  const [classes, setClasses] = useState<Class[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Fee type and category options
  const feeTypes = [
    { value: 'tuition', label: 'Tuition' },
    { value: 'development', label: 'Development' },
    { value: 'library', label: 'Library' },
    { value: 'laboratory', label: 'Laboratory' },
    { value: 'sports', label: 'Sports' },
    { value: 'transport', label: 'Transport' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'exam', label: 'Exam' },
    { value: 'miscellaneous', label: 'Miscellaneous' },
    { value: 'fine', label: 'Fine' },
    { value: 'discount', label: 'Discount' }
  ];

  const categories = [
    { value: 'academic', label: 'Academic' },
    { value: 'non_academic', label: 'Non-Academic' },
    { value: 'fine', label: 'Fine' },
    { value: 'discount', label: 'Discount' }
  ];

  const frequencies = [
    { value: 'one_time', label: 'One Time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'termly', label: 'Termly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom' }
  ];



  // Function to extract unique filter options from fee structures
  const extractFilterOptions = (feeStructures: FeeStructure[]) => {
    const feeTypesMap = new Map<string, { value: string; label: string }>();
    const categoriesMap = new Map<string, { value: string; label: string }>();
    const statusesMap = new Map<string, { value: string; label: string }>();

    feeStructures.forEach(feeStructure => {
      // Extract unique fee types
      if (feeStructure.fee_type) {
        const label = feeStructure.fee_type.charAt(0).toUpperCase() + feeStructure.fee_type.slice(1).replace('_', ' ');
        feeTypesMap.set(feeStructure.fee_type, {
          value: feeStructure.fee_type,
          label: label
        });
      }

      // Extract unique categories
      if (feeStructure.category) {
        const label = feeStructure.category.charAt(0).toUpperCase() + feeStructure.category.slice(1).replace('_', ' ');
        categoriesMap.set(feeStructure.category, {
          value: feeStructure.category,
          label: label
        });
      }

      // Extract unique statuses
      const status = feeStructure.is_active ? 'active' : 'inactive';
      const statusLabel = feeStructure.is_active ? 'Active' : 'Inactive';
      statusesMap.set(status, { value: status, label: statusLabel });
    });

    const filterOptions = {
      feeTypes: Array.from(feeTypesMap.values()),
      categories: Array.from(categoriesMap.values()),
      statuses: Array.from(statusesMap.values())
    };

    // Call the callback to update parent component
    if (onFilterOptionsUpdate) {
      onFilterOptionsUpdate(filterOptions);
    }

    return filterOptions;
  };

  const fetchFeeStructures = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: PaginationParams = {
        page,
        page_size: pageSize,
        search: debouncedSearchQuery || undefined,
        sort_by: sortBy || undefined,
        sort_direction: sortDirection,
        fee_type: feeTypeFilter || undefined,
        category: categoryFilter || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      };
      
      const response = await feesService.getAllFeeStructures(params);
      
      const feeStructuresData = response.results || [];
      setFeeStructures(feeStructuresData);
      
      // If this is the first load (no filters applied), store all data for filter options
      if (!feeTypeFilter && !categoryFilter && !statusFilter && !debouncedSearchQuery) {
        allFeeStructuresRef.current = feeStructuresData;
        // Extract filter options from all unfiltered data
        extractFilterOptions(feeStructuresData);
      } else {
        // Extract filter options from the stored unfiltered data
        extractFilterOptions(allFeeStructuresRef.current);
      }
    } catch (err) {
      console.error('Error fetching fee structures:', err);
      setError('Failed to fetch fee structures');
      // Extract filter options from empty array on error
      extractFilterOptions([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, debouncedSearchQuery, sortBy, sortDirection, feeTypeFilter, categoryFilter, statusFilter]);

  // Fetch fee structures
  useEffect(() => {
    fetchFeeStructures();
  }, [fetchFeeStructures]);

  const fetchClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const response = await apiService.students.getClasses();
      
      // Handle both response formats: direct array or wrapped in data property
      let classesData;
      if (Array.isArray(response)) {
        // Direct array response
        classesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Wrapped in data property
        classesData = response.data;
      } else {
        console.error('Unexpected API response format:', response);
        setClasses([]);
        return;
      }
      
      // Transform the API response to match our expected format
      const transformedClasses = classesData.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        stream: cls.stream
      }));
      
      setClasses(transformedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const fetchStreams = useCallback(async () => {
    try {
      const response = await apiService.students.getStreams();
      
      // Handle both response formats: direct array or wrapped in data property
      let streamsData;
      if (Array.isArray(response)) {
        // Direct array response
        streamsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Wrapped in data property
        streamsData = response.data;
      } else {
        console.error('Unexpected API response format:', response);
        setStreams([]);
        return;
      }
      
      setStreams(streamsData);
    } catch (error) {
      console.error('Error fetching streams:', error);
      setStreams([]);
    }
  }, []);

  // Fetch classes and streams
  useEffect(() => {
    fetchClasses();
    fetchStreams();
  }, [fetchClasses, fetchStreams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        // Add a small delay to allow button clicks to fire first
        setTimeout(() => {
          setOpenDropdownId(null);
          setDropdownPosition(null);
        }, 100);
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);


  // Helper function to get class name by ID
  const getClassNameById = (classId: string | null | undefined): string => {
    if (!classId) return "All Classes";
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : `Class ID: ${classId}`;
  };

  // Helper function to get stream name by ID
  const getStreamNameById = (streamId: string | null | undefined): string => {
    if (!streamId) return "All Streams";
    const streamItem = streams.find(s => s.id === streamId);
    return streamItem ? streamItem.name : `Stream ID: ${streamId}`;
  };

  const handleFormInputChange = (field: string, value: any) => {
    setNewFeeStructure(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Reset applicable_class and applicable_stream when applicable_to_all changes
    if (field === 'applicable_to_all' && value === true) {
      setNewFeeStructure(prev => ({
        ...prev,
        applicable_class: '',
        applicable_stream: ''
      }));
    }

    // Auto-set stream when class is selected
    if (field === 'applicable_class' && value) {
      const selectedClass = classes.find(cls => cls.id === value);
      if (selectedClass && selectedClass.stream) {
        setNewFeeStructure(prev => ({
          ...prev,
          applicable_stream: selectedClass.stream.name
        }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Prepare data for API
      const feeData = {
        ...newFeeStructure,
        amount: newFeeStructure.amount,
        discount_percentage: newFeeStructure.discount_percentage,
        max_discount_amount: newFeeStructure.max_discount_amount || null,
        applicable_class: newFeeStructure.applicable_to_all ? null : newFeeStructure.applicable_class || null,
        applicable_stream: newFeeStructure.applicable_to_all ? null : 
          (newFeeStructure.applicable_class ? 
            classes.find(cls => cls.id === newFeeStructure.applicable_class)?.stream?.id || null : 
            null)
      };

      await feesService.createFeeStructure(feeData);
      
      // Close drawer and refresh data
      closeAddDrawer();
      resetForm();
      fetchFeeStructures();
      
      // Show success message (you can add a toast here)
      
    } catch (error: any) {
      console.error('Error creating fee structure:', error);
      
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        setFormErrors({ general: ['Failed to create fee structure. Please try again.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      FaChevronUp({ className: "w-3 h-3" }) : 
      FaChevronDown({ className: "w-3 h-3" });
  };

  const resetForm = () => {
    setFormErrors({});
    setNewFeeStructure({
      name: '',
      fee_type: 'tuition',
      category: 'academic',
      description: '',
      amount: '',
      frequency: 'monthly',
      applicable_to_all: true,
      due_date: '',
      late_fee_applicable: false,
      late_fee_amount: '0',
      late_fee_percentage: '0',
      is_active: true,
      is_discount: false,
      discount_percentage: '0',
      max_discount_amount: '',
      applicable_class: '',
      applicable_stream: ''
    });
  };

  const getFeeTypeBadge = (feeType: string) => {
    const type = feeTypes.find(t => t.value === feeType);
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {type?.label || feeType}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        {cat?.label || category}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getFrequencyBadge = (frequency: string) => {
    const freq = frequencies.find(f => f.value === frequency);
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        {freq?.label || frequency}
      </span>
    );
  };

  const handleViewFeeStructure = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedFeeStructure(null);
  };

  const handleEditFeeStructure = (feeStructure: FeeStructure) => {
    setEditingFeeStructure(feeStructure);
    setEditFormData(feeStructure); // Initialize form data with current values
    setIsEditModalOpen(true);
    setIsEditMode(true); // Start in edit mode
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleEditFormInputChange = (field: keyof FeeStructure, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateFeeStructure = async () => {
    if (!editingFeeStructure || !editFormData) {
      console.error('No fee structure or form data to update');
      return;
    }

    setIsUpdating(true);

    try {
      
      // Make API call to update the fee structure
      await apiService.authenticatedRequest(`/fees/structures/${editingFeeStructure.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      });


      // Update the fee structure in the list
      const updatedFeeStructure = { ...editingFeeStructure, ...editFormData };
      setFeeStructures(prev => 
        prev.map(fee => 
          fee.id === editingFeeStructure.id ? updatedFeeStructure : fee
        )
      );

      // Switch back to view mode instead of closing
      setIsEditMode(false); // Switch to view mode
      setEditingFeeStructure(updatedFeeStructure); // Update with new data

      // Show success toast
      setToast({
        message: 'Fee structure updated successfully!',
        type: 'success'
      });

      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast(null);
      }, 3000);

    } catch (error) {
      console.error('Error updating fee structure:', error);
      
      // Show error toast
      setToast({
        message: 'Failed to update fee structure. Please try again.',
        type: 'error'
      });

      // Auto-hide error toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setIsUpdating(false);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingFeeStructure(null);
    setEditFormData({});
    setIsUpdating(false);
    setIsEditMode(false);
  };



  return (
    <div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading && (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading fee structures...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">
              {FaTimes({ className: "w-12 h-12 mx-auto mb-2" })}
              <p className="text-lg font-medium">Error Loading Fee Structures</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchFeeStructures()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto border-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fee_type')}>
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {getSortIcon('fee_type')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                      <div className="flex items-center space-x-1">
                        <span>Category</span>
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                        {getSortIcon('amount')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('frequency')}>
                      <div className="flex items-center space-x-1">
                        <span>Frequency</span>
                        {getSortIcon('frequency')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('applicable_to_all')}>
                      <div className="flex items-center space-x-1">
                        <span>Applicable To All</span>
                        {getSortIcon('applicable_to_all')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('applicable_class')}>
                      <div className="flex items-center space-x-1">
                        <span>Applicable Class</span>
                        {getSortIcon('applicable_class')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('applicable_stream')}>
                      <div className="flex items-center space-x-1">
                        <span>Applicable Stream</span>
                        {getSortIcon('applicable_stream')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_active')}>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('is_active')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {feeStructures.map((fee, index) => (
                    <tr key={fee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                        {fee.name}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {getFeeTypeBadge(fee.fee_type)}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {getCategoryBadge(fee.category)}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        KSh {parseFloat(fee.amount).toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {getFrequencyBadge(fee.frequency)}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          fee.applicable_to_all 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {fee.applicable_to_all ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {getClassNameById(fee.applicable_class)}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {getStreamNameById(fee.applicable_stream)}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {getStatusBadge(fee.is_active ? 'active' : 'inactive')}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleViewFeeStructure(fee)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                            title="View Details"
                          >
                            {FaEye({ className: "w-3 h-3" })}
                          </button>
                          <div className="relative">
                            <button
                                            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDropdownPosition({
                  top: rect.bottom + window.scrollY,
                  left: rect.right - 120 + window.scrollX // 120px is dropdown width
                });
                setOpenDropdownId(openDropdownId === fee.id ? null : fee.id);
              }}
                                            className={`p-1 rounded-md transition-colors duration-200 ${
                openDropdownId === fee.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
                              title="More Options"
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
            </div>

            {/* Empty State */}
            {!loading && !error && feeStructures.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  {FaList({ className: "w-12 h-12 mx-auto mb-2" })}
                  <p className="text-lg font-medium text-gray-600">No Fee Structures Found</p>
                  <p className="text-sm text-gray-500 mt-1">Get started by creating your first fee structure</p>
                </div>
                <PermissionGate permissions={['access_fees']}>
                  <button
                    onClick={openAddDrawer}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors duration-200"
                  >
                    {FaPlus({ className: "w-4 h-4 inline mr-2" })}
                    Add Fee Structure
                  </button>
                </PermissionGate>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Dropdown Portal */}
      {openDropdownId && dropdownPosition && createPortal(
        <div
          className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-32"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const feeStructure = feeStructures.find(fee => fee.id === openDropdownId);
              if (feeStructure) {
                setOpenDropdownId(null);
                setDropdownPosition(null);
                handleEditFeeStructure(feeStructure);
              }
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            {FaEdit({ className: "w-3 h-3" })}
            <span>Edit</span>
          </button>
          <button
            onClick={() => {
              setOpenDropdownId(null);
              setDropdownPosition(null);
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            {FaTrash({ className: "w-3 h-3" })}
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}

      {/* Add Fee Structure Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300 ease-out z-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  {FaList({ className: "w-5 h-5 text-blue-600" })}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Fee Structure</h2>
                  <p className="text-sm text-gray-500">Create a new fee structure for your school</p>
                </div>
              </div>
              <button
                onClick={closeAddDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
              {/* General Error Banner */}
              {Object.keys(formErrors).length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="p-1 bg-red-100 rounded-full">
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">Please fix the errors below</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    Fee Name *
                  </label>
                  <input
                    type="text"
                    value={newFeeStructure.name}
                    onChange={(e) => handleFormInputChange('name', e.target.value)}
                    placeholder="Enter fee name"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                      formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.name[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Fee Type *
                    </label>
                    <select
                      value={newFeeStructure.fee_type}
                      onChange={(e) => handleFormInputChange('fee_type', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                        formErrors.fee_type ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {feeTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {formErrors.fee_type && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.fee_type[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                      Category *
                    </label>
                    <select
                      value={newFeeStructure.category}
                      onChange={(e) => handleFormInputChange('category', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                        formErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.category[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Description
                  </label>
                  <textarea
                    value={newFeeStructure.description}
                    onChange={(e) => handleFormInputChange('description', e.target.value)}
                    placeholder="Enter description"
                    rows={3}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                      formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.description[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFeeStructure.amount}
                      onChange={(e) => handleFormInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        formErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.amount && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.amount[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                      Frequency *
                    </label>
                    <select
                      value={newFeeStructure.frequency}
                      onChange={(e) => handleFormInputChange('frequency', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                        formErrors.frequency ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {frequencies.map(freq => (
                        <option key={freq.value} value={freq.value}>{freq.label}</option>
                      ))}
                    </select>
                    {formErrors.frequency && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.frequency[0]}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newFeeStructure.due_date}
                      onChange={(e) => handleFormInputChange('due_date', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white ${
                        formErrors.due_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.due_date && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.due_date[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                      Active Status *
                    </label>
                    <select
                      value={newFeeStructure.is_active ? 'true' : 'false'}
                      onChange={(e) => handleFormInputChange('is_active', e.target.value === 'true')}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                        formErrors.is_active ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    {formErrors.is_active && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.is_active[0]}</p>
                    )}
                  </div>
                </div>

                {/* Applicable to All */}
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newFeeStructure.applicable_to_all}
                      onChange={(e) => handleFormInputChange('applicable_to_all', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-xs text-gray-700">Applicable to all classes and streams</span>
                  </label>
                </div>

                {/* Class and Stream Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                        Class {!newFeeStructure.applicable_to_all && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {loadingClasses ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-xs text-gray-500">Loading...</span>
                        </div>
                      ) : (
                        <select
                          value={newFeeStructure.applicable_class}
                          onChange={(e) => handleFormInputChange('applicable_class', e.target.value)}
                          disabled={newFeeStructure.applicable_to_all}
                          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white ${
                            newFeeStructure.applicable_to_all ? 'bg-gray-100 cursor-not-allowed' : ''
                          } ${
                            formErrors.applicable_class ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="">Select a class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.code} - {cls.stream?.name || 'No Stream'}
                            </option>
                          ))}
                        </select>
                      )}
                      {formErrors.applicable_class && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.applicable_class[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                        Stream {!newFeeStructure.applicable_to_all && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        value={newFeeStructure.applicable_stream || ''}
                        readOnly
                        className={`w-full px-3 py-2 text-xs border rounded-lg bg-gray-50 text-gray-700 ${
                          (newFeeStructure.applicable_to_all || !newFeeStructure.applicable_class) ? 'bg-gray-100 cursor-not-allowed' : ''
                        } ${
                          formErrors.applicable_stream ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Stream will be set automatically when class is selected"
                      />
                      {formErrors.applicable_stream && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.applicable_stream[0]}</p>
                      )}
                    </div>
                  </div>

                {/* Late Fee Settings */}
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newFeeStructure.late_fee_applicable}
                      onChange={(e) => handleFormInputChange('late_fee_applicable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-xs text-gray-700">Late fees applicable</span>
                  </label>
                </div>

                {newFeeStructure.late_fee_applicable && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Late Fee Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newFeeStructure.late_fee_amount}
                        onChange={(e) => handleFormInputChange('late_fee_amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Late Fee Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newFeeStructure.late_fee_percentage}
                        onChange={(e) => handleFormInputChange('late_fee_percentage', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Discount Settings */}
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newFeeStructure.is_discount}
                      onChange={(e) => handleFormInputChange('is_discount', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-xs text-gray-700">This is a discount structure</span>
                  </label>
                </div>

                {newFeeStructure.is_discount && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Discount Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={newFeeStructure.discount_percentage}
                        onChange={(e) => handleFormInputChange('discount_percentage', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Discount Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newFeeStructure.max_discount_amount}
                        onChange={(e) => handleFormInputChange('max_discount_amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={closeAddDrawer}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
              >
                {isSubmitting ? 'Creating...' : 'Create Fee Structure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Structure Detail Modal */}
      <FeeStructureDetailModal
        feeStructure={selectedFeeStructure!}
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        onUpdate={(updatedFeeStructure) => {
          // Update the fee structure in the list
          setFeeStructures(prev => 
            prev.map(fee => 
              fee.id === updatedFeeStructure.id ? updatedFeeStructure : fee
            )
          );
          // Update the selected fee structure so the modal shows the updated data
          setSelectedFeeStructure(updatedFeeStructure);
          // Don't close the modal - let it stay open in view mode
          // closeViewModal();
        }}
      />

      {/* Edit Fee Structure Drawer */}
      {isEditModalOpen && editingFeeStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300 ease-out z-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  {isEditMode ? FaEdit({ className: "w-5 h-5 text-blue-600" }) : FaEye({ className: "w-5 h-5 text-blue-600" })}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {isEditMode ? 'Edit Fee Structure' : 'Fee Structure Details'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isEditMode ? 'Update fee structure details' : 'View fee structure information'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditMode && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
                    title="Edit Fee Structure"
                  >
                    {FaEdit({ className: "w-4 h-4" })}
                  </button>
                )}
                <button
                  onClick={closeEditModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
                >
                  {FaTimes({ className: "w-4 h-4" })}
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-3">
                {/* Fee ID (Read-only) */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                    Fee ID
                  </label>
                  <input
                    type="text"
                    value={editingFeeStructure.id}
                    disabled
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                {/* Fee Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    Fee Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => handleEditFormInputChange('name', e.target.value)}
                    placeholder="Enter fee name"
                    disabled={!isEditMode}
                    className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                      isEditMode 
                        ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white hover:border-gray-400' 
                        : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                {/* Fee Type and Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Fee Type *
                    </label>
                    <select
                      value={editFormData.fee_type || ''}
                      onChange={(e) => handleEditFormInputChange('fee_type', e.target.value)}
                      disabled={!isEditMode}
                      className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                        isEditMode 
                          ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 bg-white hover:border-gray-400' 
                          : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                      }`}
                    >
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
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                      Category *
                    </label>
                    <select
                      value={editFormData.category || ''}
                      onChange={(e) => handleEditFormInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-400"
                    >
                      <option value="academic">Academic</option>
                      <option value="non_academic">Non Academic</option>
                      <option value="fine">Fine</option>
                      <option value="discount">Discount</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Description
                  </label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => handleEditFormInputChange('description', e.target.value)}
                    placeholder="Enter description"
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-400"
                  />
                </div>

                {/* Amount and Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.amount || ''}
                      onChange={(e) => handleEditFormInputChange('amount', e.target.value)}
                      disabled={!isEditMode}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                        isEditMode 
                          ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white hover:border-gray-400' 
                          : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                      Frequency *
                    </label>
                    <select
                      value={editFormData.frequency || ''}
                      onChange={(e) => handleEditFormInputChange('frequency', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-400"
                    >
                      <option value="one_time">One Time</option>
                      <option value="monthly">Monthly</option>
                      <option value="termly">Termly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* Due Date and Active Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.due_date || ''}
                      onChange={(e) => handleEditFormInputChange('due_date', e.target.value)}
                      disabled={!isEditMode}
                      className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                        isEditMode 
                          ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 bg-white hover:border-gray-400' 
                          : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                      Active Status *
                    </label>
                    <select
                      value={editFormData.is_active ? 'true' : 'false'}
                      onChange={(e) => handleEditFormInputChange('is_active', e.target.value === 'true')}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white hover:border-gray-400"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Applicable to All */}
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.applicable_to_all || false}
                      onChange={(e) => handleEditFormInputChange('applicable_to_all', e.target.checked)}
                      disabled={!isEditMode}
                      className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                        isEditMode 
                          ? '' 
                          : 'cursor-not-allowed opacity-50'
                      }`}
                    />
                    <span className="ml-2 text-xs text-gray-700">Applicable to all classes and streams</span>
                  </label>
                </div>

                {/* Class and Stream Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                      Class {!editFormData.applicable_to_all && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      value={editFormData.applicable_class || ''}
                      onChange={(e) => handleEditFormInputChange('applicable_class', e.target.value)}
                      disabled={!isEditMode || editFormData.applicable_to_all}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 ${
                        !isEditMode || editFormData.applicable_to_all 
                          ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
                          : 'bg-white hover:border-gray-400 border-gray-300'
                      }`}
                    >
                      <option value="">Select a class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.code} - {cls.stream?.name || 'No Stream'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                      Stream {!editFormData.applicable_to_all && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={editFormData.applicable_stream || ''}
                      readOnly
                      disabled={!isEditMode}
                      className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                        !isEditMode || (editFormData.applicable_to_all || !editFormData.applicable_class) 
                          ? 'bg-gray-100 cursor-not-allowed border-gray-200 text-gray-700' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="Stream will be set automatically when class is selected"
                    />
                  </div>
                </div>

                {/* Late Fee Settings */}
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.late_fee_applicable || false}
                      onChange={(e) => handleEditFormInputChange('late_fee_applicable', e.target.checked)}
                      disabled={!isEditMode}
                      className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                        isEditMode 
                          ? '' 
                          : 'cursor-not-allowed opacity-50'
                      }`}
                    />
                    <span className="ml-2 text-xs text-gray-700">Late fees applicable</span>
                  </label>
                </div>

                {editFormData.late_fee_applicable && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Late Fee Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.late_fee_amount || ''}
                        onChange={(e) => handleEditFormInputChange('late_fee_amount', e.target.value)}
                        disabled={!isEditMode}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                          isEditMode 
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400' 
                            : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Late Fee Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.late_fee_percentage || ''}
                        onChange={(e) => handleEditFormInputChange('late_fee_percentage', e.target.value)}
                        disabled={!isEditMode}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                          isEditMode 
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400' 
                            : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Discount Settings */}
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.is_discount || false}
                      onChange={(e) => handleEditFormInputChange('is_discount', e.target.checked)}
                      disabled={!isEditMode}
                      className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                        isEditMode 
                          ? '' 
                          : 'cursor-not-allowed opacity-50'
                      }`}
                    />
                    <span className="ml-2 text-xs text-gray-700">This is a discount structure</span>
                  </label>
                </div>

                {editFormData.is_discount && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Discount Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.discount_percentage || ''}
                        onChange={(e) => handleEditFormInputChange('discount_percentage', e.target.value)}
                        disabled={!isEditMode}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                          isEditMode 
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400' 
                            : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Discount Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.max_discount_amount || ''}
                        onChange={(e) => handleEditFormInputChange('max_discount_amount', e.target.value)}
                        disabled={!isEditMode}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 text-xs border rounded-lg transition-all duration-200 ${
                          isEditMode 
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400' 
                            : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            {isEditMode && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setIsEditMode(false)}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 ${
                    isUpdating 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateFeeStructure}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 text-xs font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 ${
                    isUpdating 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                  }`}
                >
                  {isUpdating ? (
                    <div className="flex items-center space-x-1.5">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Fee Structure'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center p-4 rounded-lg shadow-lg transition-all duration-300">
          <div className={`flex items-center space-x-3 ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          } px-6 py-4 rounded-lg shadow-xl`}>
            {toast.type === 'success' ? (
              FaCheckCircle({ className: "w-5 h-5 text-green-600" })
            ) : (
              FaTimes({ className: "w-5 h-5 text-red-600" })
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 text-gray-400 hover:text-gray-600"
            >
              {FaTimes({ className: "w-4 h-4" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructureComponent;
