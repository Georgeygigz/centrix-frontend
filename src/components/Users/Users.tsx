import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaCopy, FaEyeSlash, FaKey } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';
import { apiService } from '../../services/api';
import { User, UpdateUserRequest, PaginationParams } from '../../types/users';

// Collapsible Section Component (same as SwitchBoard)
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isActive?: boolean;
  onSectionClick?: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children, 
  defaultExpanded = true,
  isActive = false,
  onSectionClick
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    if (onSectionClick) {
      onSectionClick();
    }
  };

  return (
    <div className={`border rounded-lg transition-all duration-200 ${
      isActive 
        ? 'border-blue-300 bg-blue-50/30' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <button
        onClick={handleClick}
        className={`w-full px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all duration-200 rounded-t-lg ${
          isActive
            ? 'text-blue-900 bg-blue-100/50 hover:bg-blue-100'
            : 'text-gray-900 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <span>{title}</span>
        {isExpanded ? 
          FaChevronUp({ className: `w-4 h-4 transition-colors duration-200 ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }` }) : 
          FaChevronDown({ className: `w-4 h-4 transition-colors duration-200 ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }` })
        }
      </button>
      {isExpanded && (
        <div className={`p-4 space-y-4 transition-all duration-200 ${
          isActive ? 'bg-blue-50/20' : ''
        }`}>
          {children}
        </div>
      )}
    </div>
  );
};



const Users: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('users');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  const [editActiveSection, setEditActiveSection] = useState<string>('basic-info');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string[] }>({});

  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    surname: '',
    phone_number: '',
    role: 'user',
    is_active: true,
    is_staff: false,
    school_id: ''
  });

  // Mock data for users
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showCredentials, setShowCredentials] = useState<boolean>(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  // Password reset state
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  // Generate a secure password
  const generatePassword = () => {
    const length = 12;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    
    let password = "";
    
    // Ensure at least one character from each required category
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length)); // At least one lowercase
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length)); // At least one uppercase
    password += numbers.charAt(Math.floor(Math.random() * numbers.length)); // At least one number
    
    // Fill the rest with random characters from all categories
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 3; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password to make it more random
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({
        message: 'Copied to clipboard!',
        type: 'success'
      });
      setTimeout(() => {
        setToast(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setToast({
        message: 'Failed to copy to clipboard',
        type: 'error'
      });
      setTimeout(() => {
        setToast(null);
      }, 2000);
    }
  };

  // Fetch schools from API
  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const response = await apiService.authenticatedRequest('/schools', { method: 'GET' });
      setSchools(response.results || []);
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setLoadingSchools(false);
    }
  };

  // Get current user role
  const getCurrentUserRole = async () => {
    try {
      const response = await apiService.users.getAll();
      setCurrentUserRole(response.user_role || '');
    } catch (err) {
      console.error('Error getting current user role:', err);
    }
  };

  // Fetch users from API with pagination
  const fetchUsers = useCallback(async (page: number = currentPage, search: string = debouncedSearchQuery) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(page);
      
      const params: PaginationParams = {
        page,
        page_size: pageSize,
        search: search || undefined,
        sort_by: sortBy || undefined,
        sort_direction: sortDirection
      };
      
      const response = await apiService.users.getAll(params);
      setUsers(response.users || []);
      setTotalCount(response.total_count || 0);
      setTotalPages(response.total_pages || Math.ceil((response.total_count || 0) / pageSize));
      setHasNext(response.has_next || false);
      setHasPrevious(response.has_previous || false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, pageSize, sortBy, sortDirection]);

  // Load users, schools, and current user role on component mount
  useEffect(() => {
    fetchUsers(1);
    fetchSchools();
    getCurrentUserRole();
  }, [fetchUsers]);

  // Debounce search query and fetch users
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      fetchUsers(1, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchUsers]);

  // Use users directly since filtering and sorting is now handled server-side
  const displayUsers = users;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    // Fetch users with new sorting
    fetchUsers(1, debouncedSearchQuery);
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
    const password = generatePassword();
    setGeneratedPassword(password);
    setShowCredentials(false);
    setShowPassword(false);
    setIsAddDrawerOpen(true);
    setActiveSection('basic-info');
    setFormErrors({});
    // Reset school_id for root users
    if (currentUserRole === 'root') {
      setNewUser(prev => ({ ...prev, school_id: '' }));
    }
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    setShowCredentials(false);
    setShowPassword(false);
    setGeneratedPassword('');
    setNewUser({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      surname: '',
      phone_number: '',
      role: 'user',
      is_active: true,
      is_staff: false,
      school_id: ''
    });
  };

  const handleAddUser = async () => {
    try {
      // Prepare user data with password and rename school_id to school
      const userData = {
        ...newUser,
        password: generatedPassword,
        school: newUser.school_id // Rename school_id to school
      };
      
      // Remove school_id from the payload since we're using school
      delete userData.school_id;

      // Call the API to create user using signup endpoint
      await apiService.users.signup(userData);
      
      // Show credentials for copying
      setShowCredentials(true);
      
      setToast({
        message: 'User created successfully! Please copy the credentials below.',
        type: 'success'
      });
      
      setFormErrors({});
      
      // Don't close the drawer immediately - let user copy credentials
      setTimeout(() => {
        setToast(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error adding user:', error);
      setToast({
        message: 'Failed to add user. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const handleNewUserInputChange = (field: keyof User, value: string | boolean) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
    setEditActiveSection('basic-info');
    setEditFormErrors({});
  };

  const handleDeleteUser = async (user: User) => {
    try {
      await apiService.users.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setOpenDropdownId(null);
      setToast({
        message: 'User deleted successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setToast({
        message: 'Failed to delete user. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  const handlePasswordReset = (user: User) => {
    setResetPasswordUser(user);
    setResetPassword('');
    setShowResetPassword(false);
    setIsPasswordResetModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetPasswordUser || !resetPassword) return;

    try {
      setIsResettingPassword(true);
      await apiService.users.resetPassword(resetPasswordUser.id, resetPassword);
      
      setPasswordResetSuccess(true);
      
      setToast({
        message: `Password reset successfully for ${resetPasswordUser.email}`,
        type: 'success'
      });
      
      // Show the password and email for copying
      setTimeout(() => {
        setToast(null);
      }, 8000);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      setToast({
        message: 'Failed to reset password. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const closePasswordResetModal = () => {
    setIsPasswordResetModalOpen(false);
    setResetPasswordUser(null);
    setResetPassword('');
    setShowResetPassword(false);
    setPasswordResetSuccess(false);
  };

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingUser(null);
    setEditFormErrors({});
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      try {
        // Only send the fields that can be updated according to the API
        const updateData: UpdateUserRequest = {
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          surname: editingUser.surname,
          phone_number: editingUser.phone_number,
          role: editingUser.role,
          is_active: editingUser.is_active,
          is_staff: editingUser.is_staff
        };

        await apiService.users.update(editingUser.id, updateData);
        
        // Refresh the users list
        fetchUsers();
        
        setToast({
          message: 'User updated successfully!',
          type: 'success'
        });
        
        setEditFormErrors({});
        closeEditDrawer();
        
        setTimeout(() => {
          setToast(null);
        }, 3000);
        
      } catch (error) {
        console.error('Error updating user:', error);
        setToast({
          message: 'Failed to update user. Please try again.',
          type: 'error'
        });
        
        setTimeout(() => {
          setToast(null);
        }, 5000);
      }
    }
  };

  const handleInputChange = (field: keyof User, value: string | boolean) => {
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [field]: value
      });
      
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



  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      root: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Root' },
      super_admin: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Super Admin' },
      admin: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Admin' },
      user: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'User' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    
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
                  onClick={() => setActiveTab('users')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'users' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Users
                </button>
                <button 
                  onClick={() => setActiveTab('roles')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'roles' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Roles
                </button>
                <button 
                  onClick={() => setActiveTab('permissions')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'permissions' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Permissions
                </button>
              </nav>

              {/* Search, Filter, and Sort Controls */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
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
                  <option value="username">Username</option>
                  <option value="first_name">First Name</option>
                  <option value="last_name">Last Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                  <option value="is_active">Status</option>
                  <option value="created_at">Created Date</option>
                </select>

                {/* Add New User Button */}
                <PermissionGate permissions={['access_admin_panel']}>
                  <button
                    onClick={openAddDrawer}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    + Add User
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-md shadow-sm">
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading users...</span>
              </div>
            )}
            
            {error && (
              <div className="p-4 text-center">
                <div className="text-red-600 text-sm mb-2">{error}</div>
                <button
                  onClick={() => fetchUsers(1)}
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('username')}>
                          <div className="flex items-center space-x-1">
                            <span>Username</span>
                            {getSortIcon('username')}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                          <span>First Name</span>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                          <span>Last Name</span>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                          <span>Email</span>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                          <span>Phone</span>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('role')}>
                          <div className="flex items-center space-x-1">
                            <span>Role</span>
                            {getSortIcon('role')}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_active')}>
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {getSortIcon('is_active')}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                          <span>School</span>
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
                      {displayUsers.map((user: User, index: number) => (
                        <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                            {user.username}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {user.first_name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {user.last_name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {user.phone_number || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {getStatusBadge(user.is_active ? 'active' : 'inactive')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {user.school?.name || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 relative">
                            <div className="flex items-center justify-center">
                              <PermissionGate permissions={['access_admin_panel']}>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(openDropdownId === user.id ? null : user.id);
                                      if (openDropdownId !== user.id) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setDropdownCoords({
                                          x: rect.left,
                                          y: rect.bottom + window.scrollY
                                        });
                                      }
                                    }}
                                    className={`p-1 rounded-md transition-colors duration-200 ${
                                      openDropdownId === user.id
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
                      onClick={() => fetchUsers(currentPage - 1)}
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
                      onClick={() => fetchUsers(currentPage + 1)}
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

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Role Management</h3>
              <p className="text-xs text-gray-500">Manage user roles and permissions.</p>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Permission Management</h3>
              <p className="text-xs text-gray-500">Configure system permissions and access controls.</p>
            </div>
          </div>
        )}
      </div>

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
                  const user = users.find(u => u.id === openDropdownId);
                  if (user) {
                    handleEditUser(user);
                  }
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
              >
                {FaEdit({ className: "w-3 h-3 mr-2" })}
                Edit
              </button>
            </PermissionGate>
            {(currentUserRole === 'root' || currentUserRole === 'super_admin') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const user = users.find(u => u.id === openDropdownId);
                  if (user) {
                    handlePasswordReset(user);
                  }
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200"
              >
                {FaKey({ className: "w-3 h-3 mr-2" })}
                Pass Reset
              </button>
            )}
            <PermissionGate permissions={['access_admin_panel']}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const user = users.find(u => u.id === openDropdownId);
                  if (user) {
                    handleDeleteUser(user);
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

      {/* Add User Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isAddDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isAddDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <>
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-elegant">Add New User</h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">Enter user information</p>
              </div>
              <button
                onClick={closeAddDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                {FaTimes({ className: "w-4 h-4" })}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Basic Info Section */}
                <CollapsibleSection 
                  title="Basic Information *" 
                  defaultExpanded={true}
                  isActive={activeSection === 'basic-info'}
                  onSectionClick={() => setActiveSection('basic-info')}
                >
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => handleNewUserInputChange('username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter username"
                    />
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.first_name}
                      onChange={(e) => handleNewUserInputChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter first name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.last_name}
                      onChange={(e) => handleNewUserInputChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter last name"
                    />
                  </div>

                  {/* Surname */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Surname
                    </label>
                    <input
                      type="text"
                      value={newUser.surname}
                      onChange={(e) => handleNewUserInputChange('surname', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter surname"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => handleNewUserInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Role *
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => handleNewUserInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      {currentUserRole === 'root' && <option value="super_admin">Super Admin</option>}
                      {currentUserRole === 'root' && <option value="root">Root</option>}
                      {currentUserRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">+254</span>
                      </div>
                      <input
                        type="tel"
                        value={newUser.phone_number?.replace('+254', '') || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const phoneWithPrefix = value.startsWith('+254') ? value : `+254${value}`;
                          handleNewUserInputChange('phone_number', phoneWithPrefix);
                        }}
                        className="w-full pl-12 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="700000000"
                      />
                    </div>
                  </div>

                  {/* Active Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Active Status *
                    </label>
                    <select
                      value={newUser.is_active ? 'true' : 'false'}
                      onChange={(e) => handleNewUserInputChange('is_active', e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  {/* Staff Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Staff Status
                    </label>
                    <select
                      value={newUser.is_staff ? 'true' : 'false'}
                      onChange={(e) => handleNewUserInputChange('is_staff', e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="false">Regular User</option>
                      <option value="true">Staff Member</option>
                    </select>
                  </div>

                  {/* School Selection - Only for root users */}
                  {currentUserRole === 'root' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        School *
                      </label>
                      {loadingSchools ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-xs text-gray-500">Loading schools...</span>
                        </div>
                      ) : (
                        <select
                          value={newUser.school_id}
                          onChange={(e) => handleNewUserInputChange('school_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                          required
                        >
                          <option value="">Select a school</option>
                          {schools.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </CollapsibleSection>

                {/* Credentials Section - Show after successful user creation */}
                {showCredentials && (
                  <CollapsibleSection 
                    title="User Credentials" 
                    defaultExpanded={true}
                    isActive={activeSection === 'credentials'}
                    onSectionClick={() => setActiveSection('credentials')}
                  >
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-xs text-yellow-800 mb-3">
                          <strong>Important:</strong> Please copy these credentials and share them securely with the user. The password will not be shown again.
                        </div>
                        
                        {/* Email */}
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Email
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newUser.email}
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs font-mono"
                            />
                            <button
                              onClick={() => copyToClipboard(newUser.email || '')}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                              title="Copy email"
                            >
                              {FaCopy({ className: "w-3 h-3" })}
                            </button>
                          </div>
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Password
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={generatedPassword}
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs font-mono"
                            />
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? FaEyeSlash({ className: "w-3 h-3" }) : FaEye({ className: "w-3 h-3" })}
                            </button>
                            <button
                              onClick={() => copyToClipboard(generatedPassword)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                              title="Copy password"
                            >
                              {FaCopy({ className: "w-3 h-3" })}
                            </button>
                          </div>
                        </div>

                        {/* Copy All Button */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => copyToClipboard(`Email: ${newUser.email}\nPassword: ${generatedPassword}`)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs font-medium"
                          >
                            Copy Email & Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
              {!showCredentials ? (
                <>
                  <button
                    onClick={closeAddDrawer}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={
                      !newUser.username || 
                      !newUser.email || 
                      !newUser.first_name || 
                      !newUser.last_name ||
                      (currentUserRole === 'root' && !newUser.school_id)
                    }
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    Add User
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      closeAddDrawer();
                      fetchUsers(); // Refresh the users list
                    }}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </>
        </div>
      </div>

      {/* Edit User Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isEditDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isEditDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {editingUser && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-elegant">Edit User</h2>
                  <p className="text-xs text-gray-500 mt-1 font-modern">Update user information</p>
                </div>
                <button
                  onClick={closeEditDrawer}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-4 h-4" })}
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-4">
                  {/* Basic Info Section */}
                  <CollapsibleSection 
                    title="Basic Information *" 
                    defaultExpanded={true}
                    isActive={editActiveSection === 'basic-info'}
                    onSectionClick={() => setEditActiveSection('basic-info')}
                  >
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={editingUser.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter username"
                      />
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={editingUser.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={editingUser.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter last name"
                      />
                    </div>

                    {/* Surname */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Surname
                      </label>
                      <input
                        type="text"
                        value={editingUser.surname}
                        onChange={(e) => handleInputChange('surname', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter surname"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Role *
                      </label>
                      <select
                        value={editingUser.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        {currentUserRole === 'root' && <option value="super_admin">Super Admin</option>}
                        {currentUserRole === 'root' && <option value="root">Root</option>}
                        {currentUserRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                      </select>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-xs">+254</span>
                        </div>
                        <input
                          type="tel"
                          value={editingUser.phone_number?.replace('+254', '') || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const phoneWithPrefix = value.startsWith('+254') ? value : `+254${value}`;
                            handleInputChange('phone_number', phoneWithPrefix);
                          }}
                          className="w-full pl-12 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                          placeholder="700000000"
                        />
                      </div>
                    </div>

                    {/* Active Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Active Status *
                      </label>
                      <select
                        value={editingUser.is_active ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>

                    {/* Staff Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Staff Status
                      </label>
                      <select
                        value={editingUser.is_staff ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('is_staff', e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="false">Regular User</option>
                        <option value="true">Staff Member</option>
                      </select>
                    </div>

                    {/* School Selection - Only for root users */}
                    {currentUserRole === 'root' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          School
                        </label>
                        {loadingSchools ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-gray-500">Loading schools...</span>
                          </div>
                        ) : (
                          <select
                            value={editingUser.school_id || editingUser.school?.id || ''}
                            onChange={(e) => handleInputChange('school_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                          >
                            <option value="">Select a school</option>
                            {schools.map((school) => (
                              <option key={school.id} value={school.id}>
                                {school.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </CollapsibleSection>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={closeEditDrawer}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Password Reset Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isPasswordResetModalOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isPasswordResetModalOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {resetPasswordUser && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-elegant">Reset Password</h2>
                  <p className="text-xs text-gray-500 mt-1 font-modern">
                    Reset password for {resetPasswordUser.email}
                  </p>
                </div>
                <button
                  onClick={closePasswordResetModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-4 h-4" })}
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-4">
                  {!passwordResetSuccess ? (
                    <>
                      {/* Password Input */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                          New Password *
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type={showResetPassword ? "text" : "password"}
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                            placeholder="Enter new password"
                          />
                          <button
                            onClick={() => setShowResetPassword(!showResetPassword)}
                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            title={showResetPassword ? "Hide password" : "Show password"}
                          >
                            {showResetPassword ? FaEyeSlash({ className: "w-4 h-4" }) : FaEye({ className: "w-4 h-4" })}
                          </button>
                        </div>
                      </div>

                      {/* Generate Password Button */}
                      <div>
                        <button
                          onClick={() => setResetPassword(generatePassword())}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs font-medium"
                        >
                          Generate Secure Password
                        </button>
                      </div>

                      {/* Display Generated Password Info */}
                      {resetPassword && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-xs text-blue-800 mb-2">
                            <strong>New Password:</strong>
                          </div>
                          <div className="flex items-center space-x-2 mb-3">
                            <input
                              type={showResetPassword ? "text" : "password"}
                              value={resetPassword}
                              readOnly
                              className="flex-1 px-3 py-2 border border-blue-200 rounded-lg bg-blue-50 text-xs font-mono"
                            />
                            <button
                              onClick={() => copyToClipboard(resetPassword)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                              title="Copy password"
                            >
                              {FaCopy({ className: "w-3 h-3" })}
                            </button>
                          </div>
                          <div className="text-xs text-blue-600">
                            <strong>User Email:</strong> {resetPasswordUser.email}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Success State */
                    <div className="text-center space-y-4">
                      <div className="text-green-600 mb-4">
                        {FaCheckCircle({ className: "w-16 h-16 mx-auto" })}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Password Reset Successful!</h4>
                      <p className="text-sm text-gray-600">
                        The password has been reset for <strong>{resetPasswordUser.email}</strong>
                      </p>
                      
                      {/* Display Credentials */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <div className="text-xs text-green-800 mb-3">
                          <strong>New Credentials:</strong>
                        </div>
                        
                        {/* Email */}
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Email
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={resetPasswordUser.email}
                              readOnly
                              className="flex-1 px-3 py-2 border border-green-200 rounded-lg bg-green-50 text-xs font-mono"
                            />
                            <button
                              onClick={() => copyToClipboard(resetPasswordUser.email)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                              title="Copy email"
                            >
                              {FaCopy({ className: "w-3 h-3" })}
                            </button>
                          </div>
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            New Password
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type={showResetPassword ? "text" : "password"}
                              value={resetPassword}
                              readOnly
                              className="flex-1 px-3 py-2 border border-green-200 rounded-lg bg-green-50 text-xs font-mono"
                            />
                            <button
                              onClick={() => setShowResetPassword(!showResetPassword)}
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                              title={showResetPassword ? "Hide password" : "Show password"}
                            >
                              {showResetPassword ? FaEyeSlash({ className: "w-3 h-3" }) : FaEye({ className: "w-3 h-3" })}
                            </button>
                            <button
                              onClick={() => copyToClipboard(resetPassword)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                              title="Copy password"
                            >
                              {FaCopy({ className: "w-3 h-3" })}
                            </button>
                          </div>
                        </div>

                        {/* Copy All Button */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => copyToClipboard(`Email: ${resetPasswordUser.email}\nPassword: ${resetPassword}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs font-medium"
                          >
                            Copy Email & Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
                {!passwordResetSuccess ? (
                  <>
                    <button
                      onClick={closePasswordResetModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetPasswordSubmit}
                      disabled={!resetPassword || isResettingPassword}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {isResettingPassword ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Resetting...</span>
                        </div>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={closePasswordResetModal}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium"
                  >
                    Done
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
