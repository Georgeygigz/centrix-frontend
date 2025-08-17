import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';

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

// User interface
interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'root' | 'super_admin' | 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  school?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

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
    fullName: '',
    role: 'user',
    status: 'active',
    school: ''
  });

  // Mock data for users
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'admin.root',
      email: 'admin@centrix.com',
      fullName: 'System Administrator',
      role: 'root',
      status: 'active',
      lastLogin: '2024-01-20 14:30:00',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-20'
    },
    {
      id: '2',
      username: 'super.admin1',
      email: 'superadmin1@school.com',
      fullName: 'John Smith',
      role: 'super_admin',
      status: 'active',
      school: 'Central High School',
      lastLogin: '2024-01-19 09:15:00',
      createdAt: '2024-01-02',
      updatedAt: '2024-01-19'
    },
    {
      id: '3',
      username: 'admin.school1',
      email: 'admin@school1.com',
      fullName: 'Sarah Johnson',
      role: 'admin',
      status: 'active',
      school: 'North Elementary',
      lastLogin: '2024-01-18 16:45:00',
      createdAt: '2024-01-03',
      updatedAt: '2024-01-18'
    },
    {
      id: '4',
      username: 'teacher.mike',
      email: 'mike@school1.com',
      fullName: 'Mike Wilson',
      role: 'user',
      status: 'active',
      school: 'North Elementary',
      lastLogin: '2024-01-17 11:20:00',
      createdAt: '2024-01-04',
      updatedAt: '2024-01-17'
    },
    {
      id: '5',
      username: 'teacher.lisa',
      email: 'lisa@school1.com',
      fullName: 'Lisa Brown',
      role: 'user',
      status: 'suspended',
      school: 'North Elementary',
      lastLogin: '2024-01-10 08:30:00',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-15'
    }
  ]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user =>
      user.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (user.school && user.school.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    );

    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof User];
        const bValue = b[sortBy as keyof User];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [users, debouncedSearchQuery, sortBy, sortDirection]);

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

  const openAddDrawer = () => {
    setIsAddDrawerOpen(true);
    setActiveSection('basic-info');
    setFormErrors({});
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    setNewUser({
      username: '',
      email: '',
      fullName: '',
      role: 'user',
      status: 'active',
      school: ''
    });
  };

  const handleAddUser = async () => {
    try {
      const newId = (users.length + 1).toString();
      const user: User = {
        id: newId,
        username: newUser.username || '',
        email: newUser.email || '',
        fullName: newUser.fullName || '',
        role: newUser.role || 'user',
        status: newUser.status || 'active',
        school: newUser.school,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      setUsers(prev => [...prev, user]);
      
      setToast({
        message: 'User added successfully!',
        type: 'success'
      });
      
      setFormErrors({});
      
      setNewUser({
        username: '',
        email: '',
        fullName: '',
        role: 'user',
        status: 'active',
        school: ''
      });
      
      setTimeout(() => {
        closeAddDrawer();
      }, 100);
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
      
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

  const handleNewUserInputChange = (field: keyof User, value: string) => {
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

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingUser(null);
    setEditFormErrors({});
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      try {
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id ? { ...editingUser, updatedAt: new Date().toISOString().split('T')[0] } : u
        ));
        
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

  const handleInputChange = (field: keyof User, value: string) => {
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

  const toggleDropdown = (userId: string, event: React.MouseEvent) => {
    if (openDropdownId === userId) {
      setOpenDropdownId(null);
    } else {
      const button = event.currentTarget as HTMLElement;
      const buttonRect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 80;
      const dropdownWidth = 128;
      
      let x = buttonRect.right - dropdownWidth;
      let y = buttonRect.bottom + 4;
      
      if (buttonRect.bottom + dropdownHeight > viewportHeight) {
        y = buttonRect.top - dropdownHeight - 4;
      }
      
      if (x < 0) x = 0;
      if (x + dropdownWidth > viewportWidth) x = viewportWidth - dropdownWidth;
      
      setDropdownCoords({ x, y });
      setOpenDropdownId(userId);
    }
  };

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
                  <option value="fullName">Full Name</option>
                  <option value="role">Role</option>
                  <option value="status">Status</option>
                  <option value="createdAt">Created Date</option>
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
            <div className="overflow-x-auto">
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
                      <span>Full Name</span>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      <span>Email</span>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('role')}>
                      <div className="flex items-center space-x-1">
                        <span>Role</span>
                        {getSortIcon('role')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      <span>School</span>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      <span>Last Login</span>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedUsers.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {user.fullName}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {user.school || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 relative">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {/* View details */}}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                            title="View Details"
                          >
                            {FaEye({ className: "w-3 h-3" })}
                          </button>
                          
                          {/* Dropdown Menu */}
                          <PermissionGate permissions={['access_admin_panel']}>
                            <div className="relative" data-dropdown-container>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleDropdown(user.id, e);
                                }}
                                className={`p-1 rounded-md transition-colors duration-200 cursor-pointer ${
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

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.fullName}
                      onChange={(e) => handleNewUserInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter full name"
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
                      <option value="super_admin">Super Admin</option>
                      <option value="root">Root</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Status *
                    </label>
                    <select
                      value={newUser.status}
                      onChange={(e) => handleNewUserInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  {/* School */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      School
                    </label>
                    <input
                      type="text"
                      value={newUser.school}
                      onChange={(e) => handleNewUserInputChange('school', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter school name"
                    />
                  </div>
                </CollapsibleSection>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={closeAddDrawer}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={!newUser.username || !newUser.email || !newUser.fullName}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Add User
              </button>
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

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editingUser.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter full name"
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
                        <option value="super_admin">Super Admin</option>
                        <option value="root">Root</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Status *
                      </label>
                      <select
                        value={editingUser.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    {/* School */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        School
                      </label>
                      <input
                        type="text"
                        value={editingUser.school}
                        onChange={(e) => handleInputChange('school', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter school name"
                      />
                    </div>
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
    </div>
  );
};

export default Users;
