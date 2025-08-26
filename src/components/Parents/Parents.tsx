import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaUserFriends } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';
import { apiService } from '../../services/api';
import { Parent, CreateParentRequest, UpdateParentRequest, ParentQueryParams, ParentStudentRelationship } from '../../types/parents';

const Parents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('parents');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingParent, setViewingParent] = useState<Parent | null>(null);
  const [parentStudents, setParentStudents] = useState<ParentStudentRelationship[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [newParent, setNewParent] = useState<Partial<CreateParentRequest>>({
    first_name: '',
    last_name: '',
    title: '',
    relationship: '',
    email: '',
    phone: '',
    phone_alt: '',
    address: '',
    occupation: ''
  });

  // Form errors state
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string[] }>({});

  // Parents data state
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Fetch parents from API with pagination
  const fetchParents = useCallback(async (page: number = currentPage, search: string = debouncedSearchQuery) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(page);
      
      const params: ParentQueryParams = {
        page,
        page_size: pageSize,
        search: search || undefined,
        ordering: sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined,
      };
      
      const response = await apiService.parents.getAll(params);
      setParents(response.results || []);
      setTotalCount(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (err) {
      console.error('Error fetching parents:', err);
      setError('Failed to fetch parents');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, pageSize, sortBy, sortDirection]);

  // Load parents on component mount
  useEffect(() => {
    fetchParents(1);
  }, [fetchParents]);

  // Debounce search query and fetch parents
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      fetchParents(1, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchParents]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    fetchParents(1, debouncedSearchQuery);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      FaChevronUp({ className: "w-3 h-3" }) : 
      FaChevronDown({ className: "w-3 h-3" });
  };

  const openAddDrawer = () => {
    setIsAddDrawerOpen(true);
    setFormErrors({});
    setNewParent({
      first_name: '',
      last_name: '',
      title: '',
      relationship: '',
      email: '',
      phone: '',
      phone_alt: '',
      address: '',
      occupation: ''
    });
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
  };

  const handleAddParent = async () => {
    try {
      await apiService.parents.create(newParent as CreateParentRequest);
      
      setToast({
        message: 'Parent created successfully!',
        type: 'success'
      });
      
      closeAddDrawer();
      fetchParents();
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error adding parent:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
        setToast({
          message: 'Please fix the validation errors below.',
          type: 'error'
        });
      } else {
        // Handle other errors
        setToast({
          message: error.response?.data?.message || 'Failed to add parent. Please try again.',
          type: 'error'
        });
      }
      
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const handleNewParentInputChange = (field: keyof CreateParentRequest, value: string) => {
    setNewParent(prev => ({
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

  const handleViewParent = async (parent: Parent) => {
    setViewingParent(parent);
    setIsViewModalOpen(true);
    
    // Fetch students for this parent
    try {
      setLoadingStudents(true);
      const response = await apiService.parents.getStudents(parent.id);
      setParentStudents(response.results || []);
    } catch (error) {
      console.error('Error fetching parent students:', error);
      setParentStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingParent(null);
    setParentStudents([]);
  };

  const handleDisassociateStudent = async (relationship: any) => {
    if (!viewingParent?.id) return;
    
    if (window.confirm('Are you sure you want to dis-associate this student from the parent?')) {
      try {
        await apiService.students.disassociateParent(relationship.student_details.id, relationship.id);
        console.log('Student dis-associated successfully');
        // Refresh the students list
        const response = await apiService.parents.getStudents(viewingParent.id);
        setParentStudents(response.results || []);
      } catch (error) {
        console.error('Error dis-associating student:', error);
        alert('Failed to dis-associate student. Please try again.');
      }
    }
  };

  const handleEditParent = (parent: Parent) => {
    setEditingParent(parent);
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
    setEditFormErrors({});
  };

  const handleDeleteParent = async (parent: Parent) => {
    try {
      await apiService.parents.delete(parent.id);
      setParents(prev => prev.filter(p => p.id !== parent.id));
      setOpenDropdownId(null);
      setToast({
        message: 'Parent deleted successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting parent:', error);
      setToast({
        message: 'Failed to delete parent. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingParent(null);
  };

  const handleSaveParent = async () => {
    if (editingParent) {
      try {
        const updateData: UpdateParentRequest = {
          first_name: editingParent.full_name.split(' ')[0] || '',
          last_name: editingParent.full_name.split(' ').slice(1).join(' ') || '',
          relationship: editingParent.relationship,
          email: editingParent.email,
          phone: editingParent.phone,
        };

        await apiService.parents.update(editingParent.id, updateData);
        
        fetchParents();
        
        setToast({
          message: 'Parent updated successfully!',
          type: 'success'
        });
        
        closeEditDrawer();
        
        setTimeout(() => {
          setToast(null);
        }, 3000);
        
      } catch (error: any) {
        console.error('Error updating parent:', error);
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          setEditFormErrors(error.response.data.errors);
          setToast({
            message: 'Please fix the validation errors below.',
            type: 'error'
          });
        } else {
          // Handle other errors
          setToast({
            message: error.response?.data?.message || 'Failed to update parent. Please try again.',
            type: 'error'
          });
        }
        
        setTimeout(() => {
          setToast(null);
        }, 5000);
      }
    }
  };

  const handleInputChange = (field: keyof Parent, value: string) => {
    if (editingParent) {
      setEditingParent({
        ...editingParent,
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

  const getRelationshipBadge = (relationship: string) => {
    const relationshipConfig = {
      Father: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Father' },
      Mother: { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Mother' },
      Guardian: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Guardian' },
      Other: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Other' }
    };
    
    const config = relationshipConfig[relationship as keyof typeof relationshipConfig] || relationshipConfig.Other;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4">
        {/* Header with tabs, search and filters */}
        <div className="bg-white rounded-md shadow-sm p-4 mb-4">
          {/* Tabs and Controls Row */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <nav className="flex space-x-6">
                <button 
                  onClick={() => setActiveTab('parents')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'parents' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Parents
                </button>
                <button 
                  onClick={() => setActiveTab('relationships')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'relationships' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Relationships
                </button>
                <button 
                  onClick={() => setActiveTab('communications')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'communications' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Communications
                </button>
              </nav>

              {/* Search, Filter, and Sort Controls */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search parents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
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
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">Sort by</option>
                  <option value="full_name">Full Name</option>
                  <option value="relationship">Relationship</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="created_at">Created Date</option>
                </select>

                {/* Add New Parent Button */}
                <PermissionGate permissions={['access_admin_panel']}>
                  <button
                    onClick={openAddDrawer}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    + Add Parent
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'parents' && (
          <div className="bg-white rounded-md shadow-sm">
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading parents...</span>
              </div>
            )}
            
            {error && (
              <div className="p-4 text-center">
                <div className="text-red-600 text-sm mb-2">{error}</div>
                <button
                  onClick={() => fetchParents(1)}
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('full_name')}>
                          <div className="flex items-center space-x-1">
                            <span>Full Name</span>
                            {getSortIcon('full_name')}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('relationship')}>
                          <div className="flex items-center space-x-1">
                            <span>Relationship</span>
                            {getSortIcon('relationship')}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('email')}>
                          <div className="flex items-center space-x-1">
                            <span>Email</span>
                            {getSortIcon('email')}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('phone')}>
                          <div className="flex items-center space-x-1">
                            <span>Phone</span>
                            {getSortIcon('phone')}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                          <div className="flex items-center space-x-1">
                            <span>Created At</span>
                            {getSortIcon('created_at')}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parents.map((parent: Parent, index: number) => (
                        <tr key={parent.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                            {parent.full_name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {getRelationshipBadge(parent.relationship)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {parent.email}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {parent.phone}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {new Date(parent.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 relative">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleViewParent(parent)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                                title="View Details"
                              >
                                {FaEye({ className: "w-3 h-3" })}
                              </button>
                              
                              <PermissionGate permissions={['access_admin_panel']}>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(openDropdownId === parent.id ? null : parent.id);
                                      if (openDropdownId !== parent.id) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setDropdownCoords({
                                          x: rect.left,
                                          y: rect.bottom + window.scrollY
                                        });
                                      }
                                    }}
                                    className={`p-1 rounded-md transition-colors duration-200 ${
                                      openDropdownId === parent.id
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
              </>
            )}
            
            {/* Pagination - Outside table container */}
            {!loading && !error && totalCount > 0 && (
              <>
                {/* Gray row above pagination */}
                <div className="h-4 mt-8 rounded-t-lg" style={{ backgroundColor: 'rgb(249,250,251)' }}></div>
                <div className="flex items-center justify-between p-4 rounded-b-lg border-0" style={{ backgroundColor: 'rgb(249,250,251)' }}>
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => fetchParents(currentPage - 1)}
                      disabled={!hasPrevious}
                      className="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors duration-200 text-gray-500 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'rgb(249,250,251)' }}
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
                      Page {currentPage} of {totalPages} ({totalPages > 1 ? `${totalPages} pages` : '1 page'})
                    </span>
                    <button 
                      onClick={() => fetchParents(currentPage + 1)}
                      disabled={!hasNext}
                      className="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors duration-200 text-gray-500 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'rgb(249,250,251)' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Relationships Tab */}
        {activeTab === 'relationships' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                {FaUserFriends({ className: "mx-auto h-8 w-8" })}
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Relationship Management</h3>
              <p className="text-xs text-gray-500">Manage parent-student relationships and family structures.</p>
            </div>
          </div>
        )}

        {/* Communications Tab */}
        {activeTab === 'communications' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Communication Management</h3>
              <p className="text-xs text-gray-500">Manage parent communications and notifications.</p>
            </div>
          </div>
        )}
      </div>

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

      {/* Add Parent Drawer */}
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
                <h2 className="text-lg font-bold text-gray-900">Add New Parent</h2>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newParent.first_name}
                      onChange={(e) => handleNewParentInputChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                        formErrors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.first_name && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.first_name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={newParent.last_name}
                      onChange={(e) => handleNewParentInputChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                        formErrors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.last_name && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.last_name[0]}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                      Title
                    </label>
                    <input
                      type="text"
                      value={newParent.title}
                      onChange={(e) => handleNewParentInputChange('title', e.target.value)}
                      placeholder="e.g., Mr., Mrs., Dr."
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                        formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.title[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                      Relationship *
                    </label>
                    <select
                      value={newParent.relationship}
                      onChange={(e) => handleNewParentInputChange('relationship', e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                        formErrors.relationship ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <option value="">Select relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                    {formErrors.relationship && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.relationship[0]}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newParent.email}
                    onChange={(e) => handleNewParentInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                      formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.email[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                      Phone *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">+254</span>
                      </div>
                      <input
                        type="tel"
                        value={newParent.phone?.replace('+254', '') || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const phoneWithPrefix = value.startsWith('+254') ? value : `+254${value}`;
                          handleNewParentInputChange('phone', phoneWithPrefix);
                        }}
                        placeholder="700000000"
                        className={`w-full pl-12 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                          formErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.phone[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                      Alternative Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">+254</span>
                      </div>
                      <input
                        type="tel"
                        value={newParent.phone_alt?.replace('+254', '') || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const phoneWithPrefix = value.startsWith('+254') ? value : `+254${value}`;
                          handleNewParentInputChange('phone_alt', phoneWithPrefix);
                        }}
                        placeholder="700000000"
                        className={`w-full pl-12 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-white ${
                          formErrors.phone_alt ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                    </div>
                    {formErrors.phone_alt && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.phone_alt[0]}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                    Address
                  </label>
                  <textarea
                    value={newParent.address}
                    onChange={(e) => handleNewParentInputChange('address', e.target.value)}
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

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={newParent.occupation}
                    onChange={(e) => handleNewParentInputChange('occupation', e.target.value)}
                    placeholder="Enter occupation"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                      formErrors.occupation ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.occupation && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.occupation[0]}</p>
                  )}
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
                onClick={handleAddParent}
                disabled={
                  !newParent.first_name || 
                  !newParent.last_name || 
                  !newParent.relationship ||
                  !newParent.email ||
                  !newParent.phone
                }
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Create Parent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parent Drawer */}
      {isEditDrawerOpen && editingParent && (
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
                <h2 className="text-lg font-bold text-gray-900">Edit Parent</h2>
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
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editingParent.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter full name"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                      editFormErrors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.full_name && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.full_name[0]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Relationship *
                  </label>
                  <select
                    value={editingParent.relationship}
                    onChange={(e) => handleInputChange('relationship', e.target.value)}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                      editFormErrors.relationship ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                  {editFormErrors.relationship && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.relationship[0]}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingParent.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                      editFormErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {editFormErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.email[0]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                    Phone *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-xs">+254</span>
                    </div>
                    <input
                      type="tel"
                      value={editingParent.phone?.replace('+254', '') || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const phoneWithPrefix = value.startsWith('+254') ? value : `+254${value}`;
                        handleInputChange('phone', phoneWithPrefix);
                      }}
                      placeholder="700000000"
                      className={`w-full pl-12 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                        editFormErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                  </div>
                  {editFormErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{editFormErrors.phone[0]}</p>
                  )}
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
                onClick={handleSaveParent}
                className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Update Parent
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
            <PermissionGate permissions={['access_admin_panel']}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const parent = parents.find(p => p.id === openDropdownId);
                  if (parent) {
                    handleEditParent(parent);
                  }
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
              >
                {FaEdit({ className: "w-3 h-3 mr-2" })}
                Edit
              </button>
            </PermissionGate>
            <PermissionGate permissions={['access_admin_panel']}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const parent = parents.find(p => p.id === openDropdownId);
                  if (parent) {
                    handleDeleteParent(parent);
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

      {/* View Parent Modal */}
      {isViewModalOpen && viewingParent && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white shadow-xl max-w-4xl w-full max-h-[85vh] overflow-visible relative">
              {/* Close Button - Top Right Corner */}
              <button
                onClick={closeViewModal}
                className="absolute -top-8 -right-8 w-12 h-12 bg-red-300/80 hover:bg-red-400/90 text-white rounded-full shadow-lg transition-all duration-200 z-[9999] flex items-center justify-center"
              >
                {FaTimes({ className: "w-5 h-5" })}
              </button>

              {/* Header with Parent Name */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                {/* Profile Picture - Top Left Corner */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200 shadow-sm mr-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                      {FaUserFriends({ className: "w-12 h-12 text-white" })}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{viewingParent.full_name}</h2>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Relationship:</span>
                      <span>{getRelationshipBadge(viewingParent.relationship)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Status:</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Email:</span>
                      <span>{viewingParent.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Phone:</span>
                      <span className="font-mono">{viewingParent.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 relative overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Parent Info Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2.5 border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-lg font-bold text-blue-900">Parent Info</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1.5 border-b border-blue-200">
                        <span className="text-xs font-semibold text-blue-700">Parent ID:</span>
                        <span className="text-xs font-medium text-blue-900 bg-blue-50 px-2 py-1 rounded">{viewingParent.id}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-blue-200">
                        <span className="text-xs font-semibold text-blue-700">Title:</span>
                        <span className="text-xs font-medium text-blue-900 bg-blue-50 px-2 py-1 rounded">Mr./Mrs./Dr.</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-blue-200">
                        <span className="text-xs font-semibold text-blue-700">First Name:</span>
                        <span className="text-xs text-blue-900">{viewingParent.full_name.split(' ')[0] || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-blue-200">
                        <span className="text-xs font-semibold text-blue-700">Last Name:</span>
                        <span className="text-xs text-blue-900">{viewingParent.full_name.split(' ').slice(1).join(' ') || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-xs font-semibold text-blue-700">Full Name:</span>
                        <span className="text-xs font-medium text-blue-900 bg-blue-50 px-2 py-1 rounded">{viewingParent.full_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Students Section */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2.5 border border-green-200 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <h3 className="text-lg font-bold text-green-900">Students</h3>
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      {parentStudents.length} student{parentStudents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {loadingStudents ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-sm text-green-700">Loading students...</span>
                    </div>
                  ) : parentStudents.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-green-400 mb-2">
                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-600">No students found for this parent</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {parentStudents.map((relationship, index) => (
                        <div key={relationship.id} className={`${index > 0 ? 'border-t border-green-200 pt-2' : ''}`}>
                          <div className="flex justify-between items-center py-1 border-b border-green-200">
                            <span className="text-xs font-semibold text-green-700">Name:</span>
                            <span className="text-xs font-medium text-green-900 bg-green-50 px-2 py-1 rounded">
                              {relationship.student_details.pupil_name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-green-200">
                            <span className="text-xs font-semibold text-green-700">Admission #:</span>
                            <span className="text-xs text-green-900">{relationship.student_details.admission_number}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-green-200">
                            <span className="text-xs font-semibold text-green-700">Class:</span>
                            <span className="text-xs text-green-900">{relationship.student_details.current_class}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs font-semibold text-green-700">Relationship:</span>
                            <span className="text-xs text-green-900">{relationship.relationship_type}</span>
                          </div>
                          {relationship.notes && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-xs font-semibold text-green-700">Notes:</span>
                              <span className="text-xs text-green-900">{relationship.notes}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex flex-wrap gap-1">
                              {relationship.is_primary_contact && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>
                              )}
                              {relationship.is_emergency_contact && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Emergency</span>
                              )}
                              {relationship.can_pick_up && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Pick Up</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDisassociateStudent(relationship)}
                              className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded hover:bg-red-200 transition-colors duration-200 flex items-center gap-1 ml-auto"
                              title="Dis-associate student"
                            >
                              {FaTrash({ className: "w-3 h-3" })}
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-700 flex items-center space-x-2">
                    <span className="font-semibold">Last updated:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => {
                        closeViewModal();
                        handleEditParent(viewingParent);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      {FaEdit({ className: "w-4 h-4" })}
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                      {FaEye({ className: "w-4 h-4" })}
                      <span className="text-sm font-medium">View Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Parents;
