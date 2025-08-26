import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { School } from '../../types/dashboard';
import { apiService } from '../../services/api';
import { PermissionGate } from '../RBAC';



const Schools: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('schools');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [originalSchool, setOriginalSchool] = useState<School | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string[] }>({});
  const [newSchool, setNewSchool] = useState<Partial<School>>({
    name: '',
    slug: '',
    subdomain: '',
    domain: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    primary_color: '#667eea',
    secondary_color: '#764ba2',
    timezone: 'UTC',
    language: 'en',
    currency: 'USD',
    is_active: true,
    max_students: 1000,
    academic_year_start: null,
    academic_year_end: null
  });

  // Pagination state
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const itemsPerPage = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load schools data from API
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.schools.getAll(currentPage, itemsPerPage, debouncedSearchQuery || undefined, sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined);
        
        // Transform the API response data
        const rawSchools = data.results || data || [];
        const transformedSchools = rawSchools.map((school: any) => ({
          ...school,
          // Use total_students from API response
          number_of_students: school.total_students || 0
        }));
        
        setSchools(transformedSchools);
        
        // Set pagination metadata
        setTotalCount(data.count || 0);
        setHasNextPage(!!data.next);
        setHasPreviousPage(!!data.previous);
      } catch (error) {
        console.error('Error loading schools:', error);
        // Fallback to empty array if loading fails
        setSchools([]);
        setTotalCount(0);
        setHasNextPage(false);
        setHasPreviousPage(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchools();
  }, [currentPage, debouncedSearchQuery, sortBy, sortDirection]);

  // Reset to first page when debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown-container]') && !target.closest('[data-portal-dropdown]')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (schoolId: string, event: React.MouseEvent) => {
    if (openDropdownId === schoolId) {
      setOpenDropdownId(null);
    } else {
      // Calculate dropdown position
      const button = event.currentTarget as HTMLElement;
      const buttonRect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 80;
      const dropdownWidth = 128;
      
      // Calculate position
      let x = buttonRect.right - dropdownWidth;
      let y = buttonRect.bottom + 4;
      
      // If there's not enough space below, position above
      if (buttonRect.bottom + dropdownHeight > viewportHeight) {
        y = buttonRect.top - dropdownHeight - 4;
      }
      
      // Ensure dropdown doesn't go off-screen horizontally
      if (x < 0) x = 0;
      if (x + dropdownWidth > viewportWidth) x = viewportWidth - dropdownWidth;
      
      setDropdownCoords({ x, y });
      setOpenDropdownId(schoolId);
    }
  };

  const handleDeleteSchool = async (school: School) => {
    try {
      // Note: You'll need to implement the delete endpoint in the API service
      // await apiService.schools.delete(school.id);
      
      // For now, just remove from local state
      setSchools(prev => prev.filter(s => s.id !== school.id));
      setOpenDropdownId(null);
      setToast({
        message: 'School deleted successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting school:', error);
      setToast({
        message: 'Failed to delete school. Please try again.',
        type: 'error'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Drawer functions
  const openAddDrawer = () => {
    setIsAddDrawerOpen(true);
    setFormErrors({}); // Clear any previous errors
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    setNewSchool({
      name: '',
      slug: '',
      subdomain: '',
      domain: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      logo: '',
      primary_color: '#667eea',
      secondary_color: '#764ba2',
      timezone: 'UTC',
      language: 'en',
      currency: 'USD',
      is_active: true,
      max_students: 1000,
      academic_year_start: null,
      academic_year_end: null
    });
  };

  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setOriginalSchool(school); // Store original data for comparison
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
    setEditFormErrors({}); // Clear any previous errors
  };

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingSchool(null);
    setOriginalSchool(null);
    setEditFormErrors({}); // Clear errors when closing
  };

  const handleNewSchoolInputChange = (field: keyof School, value: string | boolean | number) => {
    setNewSchool(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleInputChange = (field: keyof School, value: string | boolean | number) => {
    if (editingSchool) {
      setEditingSchool({
        ...editingSchool,
        [field]: value
      });
      
      // Clear error for this field when user starts typing
      if (editFormErrors[field]) {
        setEditFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const handleAddSchool = async () => {
    try {
      // Validate required fields
      if (!newSchool.name || !newSchool.slug || !newSchool.subdomain || !newSchool.email) {
        setToast({
          message: 'Please fill in all required fields (Name, Slug, Subdomain, Email).',
          type: 'error'
        });
        return;
      }

      // Prepare the school data for API
      const schoolData = {
        name: newSchool.name,
        slug: newSchool.slug,
        subdomain: newSchool.subdomain,
        domain: newSchool.domain || '',
        address: newSchool.address || '',
        phone: newSchool.phone || '',
        email: newSchool.email,
        website: newSchool.website || '',
        timezone: newSchool.timezone || 'UTC',
        language: newSchool.language || 'en',
        currency: newSchool.currency || 'USD',
        is_active: newSchool.is_active !== undefined ? newSchool.is_active : true,
        max_students: newSchool.max_students || 1000,
        primary_color: newSchool.primary_color || '#667eea',
        secondary_color: newSchool.secondary_color || '#764ba2'
      };

      // Call the API to create the school
      const response = await apiService.schools.create(schoolData);
      
      // Add the new school to the local state
      const newSchoolData: School = {
        id: response.id || Date.now().toString(),
        ...response,
        created_at: response.created_at || new Date().toISOString(),
        updated_at: response.updated_at || new Date().toISOString(),
        number_of_students: 0 // New school starts with 0 students
      } as School;
      
      setSchools(prev => [...prev, newSchoolData]);
      
      // Show success toast
      setToast({
        message: 'School added successfully!',
        type: 'success'
      });
      
      // Clear form errors
      setFormErrors({});
      
      // Clear the form
      setNewSchool({
        name: '',
        slug: '',
        subdomain: '',
        domain: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        logo: '',
        primary_color: '#667eea',
        secondary_color: '#764ba2',
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
        is_active: true,
        max_students: 1000,
        academic_year_start: null,
        academic_year_end: null
      });
      
      // Close drawer after a short delay to ensure form is cleared
      setTimeout(() => {
        closeAddDrawer();
      }, 100);
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error adding school:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
        setToast({
          message: error.response.data.message || 'Please fix the validation errors below.',
          type: 'error'
        });
      } else {
        setFormErrors({});
        setToast({
          message: error.message || 'Failed to add school. Please try again.',
          type: 'error'
        });
      }
      
      // Auto-hide error toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const handleSaveSchool = async () => {
    if (editingSchool && originalSchool) {
      try {
        // Note: You'll need to implement the update endpoint in the API service
        // const response = await apiService.schools.update(editingSchool.id, changedFields);
        
        // For now, just update in local state
        setSchools(prev => prev.map(school => 
          school.id === editingSchool.id ? editingSchool : school
        ));
        
        // Show success toast
        setToast({
          message: 'School updated successfully!',
          type: 'success'
        });
        
        // Clear form errors
        setEditFormErrors({});
        
        closeEditDrawer();
        
        // Auto-hide toast after 3 seconds
        setTimeout(() => {
          setToast(null);
        }, 3000);
        
      } catch (error: any) {
        console.error('Error updating school:', error);
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          setEditFormErrors(error.response.data.errors);
          setToast({
            message: error.response.data.message || 'Please fix the validation errors below.',
            type: 'error'
          });
        } else {
          setEditFormErrors({});
          setToast({
            message: 'Failed to update school. Please try again.',
            type: 'error'
          });
        }
        
        // Auto-hide error toast after 5 seconds
        setTimeout(() => {
          setToast(null);
        }, 5000);
      }
    }
  };



  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4">
        {/* Header with tabs, search and filters */}
        <div className="bg-white rounded-md shadow-sm p-4 mb-4">
          <div className="mb-4">
            {/* Tabs and Controls Row */}
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <nav className="flex space-x-6">
                <button 
                  onClick={() => setActiveTab('schools')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'schools' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Schools
                </button>
                <button 
                  onClick={() => setActiveTab('departments')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'departments' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Departments
                </button>
                <button 
                  onClick={() => setActiveTab('facilities')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'facilities' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Facilities
                </button>
              </nav>

              {/* Search, Filter, and Sort Controls */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-colors duration-200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {FaSearch({ className: "h-3 w-3 text-gray-400" })}
                  </div>
                </div>

                {/* Filter */}
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200">
                  Filter
                </button>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">Sort by</option>
                  <option value="name">Name</option>
                  <option value="slug">Slug</option>
                  <option value="subdomain">Subdomain</option>
                  <option value="created_at">Created Date</option>
                </select>

                {/* Add New School Button */}
                <PermissionGate permissions={['create_school']}>
                  <button
                    onClick={openAddDrawer}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    + Add School
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>

                {/* Tab Content */}
        {activeTab === 'schools' && (
          <div className="bg-white rounded-md shadow-sm relative">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading schools...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('slug')}>
                        <div className="flex items-center space-x-1">
                          <span>Slug</span>
                          {getSortIcon('slug')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('subdomain')}>
                        <div className="flex items-center space-x-1">
                          <span>Subdomain</span>
                          {getSortIcon('subdomain')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Website
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Number of Students
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_active')}>
                        <div className="flex items-center space-x-1">
                          <span>Is Active</span>
                          {getSortIcon('is_active')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Created At</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {schools.map((school, index) => (
                      <tr key={school.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                          {school.name}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {school.slug}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {school.subdomain}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {school.website ? (
                            <a 
                              href={school.website.startsWith('http') ? school.website : `https://${school.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {school.website}
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {school.number_of_students || 0}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            school.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {school.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {formatDate(school.created_at)}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 relative">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {/* View details */}}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                              title="View Details"
                            >
                              {FaEye({ className: "w-3 h-3" })}
                            </button>
                            
                            {/* Dropdown Menu */}
                            <PermissionGate permissions={['create_school']}>
                              <div className="relative" data-dropdown-container>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleDropdown(school.id, e);
                                  }}
                                  className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
                                    openDropdownId === school.id 
                                      ? 'text-blue-600 bg-blue-50' 
                                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                  }`}
                                  title="More Options"
                                >
                                  {FaEllipsisV({ className: "w-3 h-3" })}
                                </button>
                              </div>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Department Management</h3>
              <p className="text-xs text-gray-500">Manage school departments and academic divisions.</p>
            </div>
          </div>
        )}

        {/* Facilities Tab */}
        {activeTab === 'facilities' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Facility Management</h3>
              <p className="text-xs text-gray-500">Manage school facilities and infrastructure.</p>
            </div>
          </div>
        )}

        {/* Pagination - Only show on schools tab */}
        {activeTab === 'schools' && (
          <div className="flex items-center justify-between p-3 rounded-lg mt-4 mb-4" style={{ backgroundColor: 'rgb(249,250,251)', position: 'relative', zIndex: 10 }}>
            <div className="text-xs text-gray-600">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalCount}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage}
                className="px-2.5 py-1 text-xs font-medium border rounded transition-colors duration-200 text-gray-500 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-2.5 py-1 text-xs font-medium text-gray-600">
                Page {currentPage} of {totalPages} ({totalPages > 1 ? `${totalPages} pages` : '1 page'})
              </span>
              <button 
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="px-2.5 py-1 text-xs font-medium border rounded transition-colors duration-200 text-gray-500 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit School Drawer */}
      {isEditDrawerOpen && editingSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Edit School</h2>
              </div>
              <button
                onClick={closeEditDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* General Error Banner */}
              {Object.keys(editFormErrors).length > 0 && (
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
                    School Name *
                  </label>
                  <input
                    type="text"
                    value={editingSchool.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter school name"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                      editFormErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.name[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={editingSchool.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="Enter slug"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                        editFormErrors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.slug && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.slug[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                      Subdomain *
                    </label>
                    <input
                      type="text"
                      value={editingSchool.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value)}
                      placeholder="Enter subdomain"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                        editFormErrors.subdomain ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.subdomain && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.subdomain[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Domain
                  </label>
                  <input
                    type="text"
                    value={editingSchool.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="Enter domain"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                      editFormErrors.domain ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.domain && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.domain[0]}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editingSchool.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        editFormErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.email[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingSchool.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                        editFormErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.phone[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                    Website
                  </label>
                  <input
                    type="url"
                    value={editingSchool.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="Enter website URL"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                      editFormErrors.website ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.website && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.website[0]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                    Address
                  </label>
                  <textarea
                    value={editingSchool.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter address"
                    rows={2}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white resize-none ${
                      editFormErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.address && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.address[0]}</p>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                      Max Students
                    </label>
                    <input
                      type="number"
                      value={editingSchool.max_students}
                      onChange={(e) => handleInputChange('max_students', parseInt(e.target.value) || 0)}
                      placeholder="Enter max students"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                        editFormErrors.max_students ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.max_students && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.max_students[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                      Timezone
                    </label>
                    <select
                      value={editingSchool.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white ${
                        editFormErrors.timezone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                    {editFormErrors.timezone && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.timezone[0]}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                      Language
                    </label>
                    <select
                      value={editingSchool.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white ${
                        editFormErrors.language ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                    {editFormErrors.language && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.language[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-lime-500 rounded-full mr-1.5"></span>
                      Currency
                    </label>
                    <select
                      value={editingSchool.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-500 transition-all duration-200 bg-white ${
                        editFormErrors.currency ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                    {editFormErrors.currency && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.currency[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>
                    Active Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingSchool.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600">School is active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={closeEditDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchool}
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Update School
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add School Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Add New School</h2>
              </div>
              <button
                onClick={closeAddDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
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
                    School Name *
                  </label>
                  <input
                    type="text"
                    value={newSchool.name}
                    onChange={(e) => handleNewSchoolInputChange('name', e.target.value)}
                    placeholder="Enter school name"
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
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={newSchool.slug}
                      onChange={(e) => handleNewSchoolInputChange('slug', e.target.value)}
                      placeholder="Enter slug"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                        formErrors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.slug && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.slug[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                      Subdomain *
                    </label>
                    <input
                      type="text"
                      value={newSchool.subdomain}
                      onChange={(e) => handleNewSchoolInputChange('subdomain', e.target.value)}
                      placeholder="Enter subdomain"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                        formErrors.subdomain ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.subdomain && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.subdomain[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Domain
                  </label>
                  <input
                    type="text"
                    value={newSchool.domain}
                    onChange={(e) => handleNewSchoolInputChange('domain', e.target.value)}
                    placeholder="Enter domain"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                      formErrors.domain ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.domain && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.domain[0]}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newSchool.email}
                      onChange={(e) => handleNewSchoolInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.email[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newSchool.phone}
                      onChange={(e) => handleNewSchoolInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                        formErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.phone[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                    Website
                  </label>
                  <input
                    type="url"
                    value={newSchool.website}
                    onChange={(e) => handleNewSchoolInputChange('website', e.target.value)}
                    placeholder="Enter website URL"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                      formErrors.website ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.website && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.website[0]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                    Address
                  </label>
                  <textarea
                    value={newSchool.address}
                    onChange={(e) => handleNewSchoolInputChange('address', e.target.value)}
                    placeholder="Enter address"
                    rows={2}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white resize-none ${
                      formErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.address[0]}</p>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                      Max Students
                    </label>
                    <input
                      type="number"
                      value={newSchool.max_students}
                      onChange={(e) => handleNewSchoolInputChange('max_students', parseInt(e.target.value) || 0)}
                      placeholder="Enter max students"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                        formErrors.max_students ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.max_students && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.max_students[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                      Timezone
                    </label>
                    <select
                      value={newSchool.timezone}
                      onChange={(e) => handleNewSchoolInputChange('timezone', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white ${
                        formErrors.timezone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                    {formErrors.timezone && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.timezone[0]}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                      Language
                    </label>
                    <select
                      value={newSchool.language}
                      onChange={(e) => handleNewSchoolInputChange('language', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white ${
                        formErrors.language ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                    {formErrors.language && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.language[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-lime-500 rounded-full mr-1.5"></span>
                      Currency
                    </label>
                    <select
                      value={newSchool.currency}
                      onChange={(e) => handleNewSchoolInputChange('currency', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-500 transition-all duration-200 bg-white ${
                        formErrors.currency ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                    {formErrors.currency && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.currency[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>
                    Active Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newSchool.is_active}
                      onChange={(e) => handleNewSchoolInputChange('is_active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600">School is active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={closeAddDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSchool}
                disabled={!newSchool.name || !newSchool.slug || !newSchool.subdomain || !newSchool.email}
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Create School
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit School Drawer */}
      {isEditDrawerOpen && editingSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Edit School</h2>
              </div>
              <button
                onClick={closeEditDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* General Error Banner */}
              {Object.keys(editFormErrors).length > 0 && (
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
                    School Name *
                  </label>
                  <input
                    type="text"
                    value={editingSchool.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter school name"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                      editFormErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.name[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={editingSchool.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="Enter slug"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                        editFormErrors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.slug && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.slug[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                      Subdomain *
                    </label>
                    <input
                      type="text"
                      value={editingSchool.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value)}
                      placeholder="Enter subdomain"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                        editFormErrors.subdomain ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.subdomain && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.subdomain[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Domain
                  </label>
                  <input
                    type="text"
                    value={editingSchool.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="Enter domain"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                      editFormErrors.domain ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.domain && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.domain[0]}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editingSchool.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        editFormErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.email[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingSchool.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                        editFormErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.phone[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                    Website
                  </label>
                  <input
                    type="url"
                    value={editingSchool.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="Enter website URL"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                      editFormErrors.website ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.website && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.website[0]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                    Address
                  </label>
                  <textarea
                    value={editingSchool.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter address"
                    rows={2}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white resize-none ${
                      editFormErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.address && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.address[0]}</p>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                      Max Students
                    </label>
                    <input
                      type="number"
                      value={editingSchool.max_students}
                      onChange={(e) => handleInputChange('max_students', parseInt(e.target.value) || 0)}
                      placeholder="Enter max students"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                        editFormErrors.max_students ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {editFormErrors.max_students && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.max_students[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                      Timezone
                    </label>
                    <select
                      value={editingSchool.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white ${
                        editFormErrors.timezone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                    {editFormErrors.timezone && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.timezone[0]}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                      Language
                    </label>
                    <select
                      value={editingSchool.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white ${
                        editFormErrors.language ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                    {editFormErrors.language && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.language[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-lime-500 rounded-full mr-1.5"></span>
                      Currency
                    </label>
                    <select
                      value={editingSchool.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-500 transition-all duration-200 bg-white ${
                        editFormErrors.currency ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                    {editFormErrors.currency && (
                      <p className="mt-1 text-xs text-red-600">{editFormErrors.currency[0]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5"></span>
                    Active Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingSchool.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600">School is active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <button
                onClick={closeEditDrawer}
                className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchool}
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Update School
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal-based Dropdown */}
      {openDropdownId && createPortal(
        <div 
          className="fixed w-32 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
          data-portal-dropdown
          style={{
            left: `${dropdownCoords.x}px`,
            top: `${dropdownCoords.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
                      <div className="py-1">
              <PermissionGate permissions={['create_school']}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const school = schools.find(s => s.id === openDropdownId);
                    if (school) {
                      handleEditSchool(school);
                    }
                  }}
                  className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                >
                  {FaEdit({ className: "w-3 h-3 mr-2" })}
                  Edit
                </button>
              </PermissionGate>
              <PermissionGate permissions={['create_school']}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const school = schools.find(s => s.id === openDropdownId);
                    if (school) {
                      handleDeleteSchool(school);
                    }
                  }}
                  className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                >
                  {FaTrash({ className: "w-3 h-3 mr-2" })}
                  Delete
                </button>
              </PermissionGate>
            </div>
        </div>,
        document.body
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

export default Schools;
