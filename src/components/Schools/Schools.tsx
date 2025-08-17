import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { PermissionGate } from '../RBAC';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isActive?: boolean;
  onSectionClick?: () => void;
}

interface School {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  principal: string;
  status: 'active' | 'inactive' | 'pending';
  type: 'public' | 'private' | 'charter';
  enrollment: number;
  createdAt: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children, 
  defaultExpanded = true, 
  isActive = false, 
  onSectionClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (onSectionClick) {
      onSectionClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggleExpanded}
        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors duration-200 ${
          isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {isExpanded ? 
          FaChevronUp({ className: "w-4 h-4 text-gray-500" }) : 
          FaChevronDown({ className: "w-4 h-4 text-gray-500" })
        }
      </button>
      {isExpanded && (
        <div className="p-4 bg-white space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

const Schools: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('schools');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  const [editActiveSection, setEditActiveSection] = useState<string>('basic-info');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string[] }>({});
  const [newSchool, setNewSchool] = useState<Partial<School>>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    phone: '',
    email: '',
    principal: '',
    status: 'active',
    type: 'public',
    enrollment: 0
  });

  // Mock data
  const [schools, setSchools] = useState<School[]>([
    {
      id: '1',
      name: 'Lincoln High School',
      address: '123 Education St',
      city: 'Springfield',
      state: 'IL',
      country: 'USA',
      phone: '(555) 123-4567',
      email: 'info@lincoln.edu',
      principal: 'Dr. Sarah Johnson',
      status: 'active',
      type: 'public',
      enrollment: 1250,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'St. Mary Academy',
      address: '456 Faith Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      phone: '(555) 987-6543',
      email: 'admin@stmary.edu',
      principal: 'Sr. Maria Rodriguez',
      status: 'active',
      type: 'private',
      enrollment: 850,
      createdAt: '2024-02-20'
    },
    {
      id: '3',
      name: 'Innovation Charter School',
      address: '789 Progress Blvd',
      city: 'Aurora',
      state: 'IL',
      country: 'USA',
      phone: '(555) 456-7890',
      email: 'contact@innovation.edu',
      principal: 'Mr. David Chen',
      status: 'pending',
      type: 'charter',
      enrollment: 600,
      createdAt: '2024-03-10'
    }
  ]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown-container]') && !target.closest('[data-portal-dropdown]')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter and sort schools
  const filteredAndSortedSchools = useMemo(() => {
    let filtered = schools.filter(school =>
      school.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      school.city.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      school.principal.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof School];
        const bValue = b[sortBy as keyof School];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [schools, debouncedSearchQuery, sortBy, sortDirection]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' 
      ? FaChevronUp({ className: "w-3 h-3 text-blue-500" })
      : FaChevronDown({ className: "w-3 h-3 text-blue-500" });
  };

  const toggleDropdown = (schoolId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (openDropdownId === schoolId) {
      setOpenDropdownId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownCoords({ x: rect.left, y: rect.bottom + 5 });
      setOpenDropdownId(schoolId);
    }
  };

  const openAddDrawer = () => {
    setIsAddDrawerOpen(true);
    setNewSchool({
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      phone: '',
      email: '',
      principal: '',
      status: 'active',
      type: 'public',
      enrollment: 0
    });
    setFormErrors({});
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    setFormErrors({});
  };

  const openEditDrawer = (school: School) => {
    setEditingSchool({ ...school });
    setIsEditDrawerOpen(true);
    setEditFormErrors({});
  };

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingSchool(null);
    setEditFormErrors({});
  };

  const handleNewSchoolInputChange = (field: keyof School, value: string | number) => {
    setNewSchool(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof School, value: string | number) => {
    if (editingSchool) {
      setEditingSchool(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleAddSchool = () => {
    if (!newSchool.name || !newSchool.city || !newSchool.email) {
      setFormErrors({
        name: !newSchool.name ? ['School name is required'] : [],
        city: !newSchool.city ? ['City is required'] : [],
        email: !newSchool.email ? ['Email is required'] : []
      });
      return;
    }

    const newSchoolData: School = {
      id: Date.now().toString(),
      name: newSchool.name || '',
      address: newSchool.address || '',
      city: newSchool.city || '',
      state: newSchool.state || '',
      country: newSchool.country || '',
      phone: newSchool.phone || '',
      email: newSchool.email || '',
      principal: newSchool.principal || '',
      status: newSchool.status || 'active',
      type: newSchool.type || 'public',
      enrollment: newSchool.enrollment || 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setSchools(prev => [...prev, newSchoolData]);
    setToast({ message: 'School added successfully!', type: 'success' });
    closeAddDrawer();
  };

  const handleSaveSchool = () => {
    if (!editingSchool) return;

    if (!editingSchool.name || !editingSchool.city || !editingSchool.email) {
      setEditFormErrors({
        name: !editingSchool.name ? ['School name is required'] : [],
        city: !editingSchool.city ? ['City is required'] : [],
        email: !editingSchool.email ? ['Email is required'] : []
      });
      return;
    }

    setSchools(prev => prev.map(school => 
      school.id === editingSchool.id ? editingSchool : school
    ));
    setToast({ message: 'School updated successfully!', type: 'success' });
    closeEditDrawer();
  };

  const handleDeleteSchool = (school: School) => {
    setSchools(prev => prev.filter(s => s.id !== school.id));
    setToast({ message: 'School deleted successfully!', type: 'success' });
    setOpenDropdownId(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4">
        <div className="bg-white rounded-md shadow-sm p-4 mb-4">
          <div className="mb-4">
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

              {/* Search, Filter, Sort, Add Button */}
              <div className="flex items-center space-x-3">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {FaSearch({ className: "h-3 w-3 text-gray-400" })}
                  </div>
                </div>

                {/* Filter Button */}
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200">
                  Filter
                </button>

                {/* Sort Select */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">Sort by</option>
                  <option value="name">School Name</option>
                  <option value="city">City</option>
                  <option value="type">Type</option>
                  <option value="status">Status</option>
                  <option value="enrollment">Enrollment</option>
                  <option value="createdAt">Created Date</option>
                </select>

                {/* Add New School Button */}
                <PermissionGate permissions={['access_admin_panel']}>
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
          <div className="bg-white rounded-md shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>School Name</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Address</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Contact</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Principal</th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('enrollment')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Enrollment</span>
                        {getSortIcon('enrollment')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedSchools.map((school, index) => (
                    <tr key={school.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {school.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        <div>
                          <div>{school.address}</div>
                          <div className="text-gray-500">{school.city}, {school.state}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        <div>
                          <div>{school.phone}</div>
                          <div className="text-gray-500">{school.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {school.principal}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          school.type === 'public' ? 'bg-blue-100 text-blue-800' :
                          school.type === 'private' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {school.type.charAt(0).toUpperCase() + school.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          school.status === 'active' ? 'bg-green-100 text-green-800' :
                          school.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {school.enrollment.toLocaleString()}
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
                          <PermissionGate permissions={['access_admin_panel']}>
                            <div className="relative" data-dropdown-container>
                              <button
                                onClick={(e) => toggleDropdown(school.id, e)}
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
      </div>

      {/* Add School Drawer */}
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
                <h2 className="text-xl font-bold text-gray-900 font-elegant">Add New School</h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">Enter school information</p>
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
                  {/* School Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      School Name *
                    </label>
                    <input
                      type="text"
                      value={newSchool.name}
                      onChange={(e) => handleNewSchoolInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter school name"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={newSchool.address}
                      onChange={(e) => handleNewSchoolInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter school address"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      City *
                    </label>
                    <input
                      type="text"
                      value={newSchool.city}
                      onChange={(e) => handleNewSchoolInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter city"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      State
                    </label>
                    <input
                      type="text"
                      value={newSchool.state}
                      onChange={(e) => handleNewSchoolInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter state"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Country
                    </label>
                    <input
                      type="text"
                      value={newSchool.country}
                      onChange={(e) => handleNewSchoolInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter country"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newSchool.phone}
                      onChange={(e) => handleNewSchoolInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newSchool.email}
                      onChange={(e) => handleNewSchoolInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Principal */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Principal
                    </label>
                    <input
                      type="text"
                      value={newSchool.principal}
                      onChange={(e) => handleNewSchoolInputChange('principal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter principal name"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Type *
                    </label>
                    <select
                      value={newSchool.type}
                      onChange={(e) => handleNewSchoolInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="charter">Charter</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Status *
                    </label>
                    <select
                      value={newSchool.status}
                      onChange={(e) => handleNewSchoolInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  {/* Enrollment */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Enrollment
                    </label>
                    <input
                      type="number"
                      value={newSchool.enrollment}
                      onChange={(e) => handleNewSchoolInputChange('enrollment', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter enrollment number"
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
                onClick={handleAddSchool}
                disabled={!newSchool.name || !newSchool.city || !newSchool.email}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Add School
              </button>
            </div>
          </>
        </div>
      </div>

      {/* Edit School Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isEditDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isEditDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {editingSchool && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-elegant">Edit School</h2>
                  <p className="text-xs text-gray-500 mt-1 font-modern">Update school information</p>
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
                    {/* School Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        School Name *
                      </label>
                      <input
                        type="text"
                        value={editingSchool.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter school name"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Address *
                      </label>
                      <input
                        type="text"
                        value={editingSchool.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter school address"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        City *
                      </label>
                      <input
                        type="text"
                        value={editingSchool.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter city"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        State
                      </label>
                      <input
                        type="text"
                        value={editingSchool.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter state"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Country
                      </label>
                      <input
                        type="text"
                        value={editingSchool.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter country"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editingSchool.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={editingSchool.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Principal */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Principal
                      </label>
                      <input
                        type="text"
                        value={editingSchool.principal}
                        onChange={(e) => handleInputChange('principal', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter principal name"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Type *
                      </label>
                      <select
                        value={editingSchool.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="charter">Charter</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Status *
                      </label>
                      <select
                        value={editingSchool.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    {/* Enrollment */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                        Enrollment
                      </label>
                      <input
                        type="number"
                        value={editingSchool.enrollment}
                        onChange={(e) => handleInputChange('enrollment', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                        placeholder="Enter enrollment number"
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
                  onClick={handleSaveSchool}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
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
                  const school = schools.find(s => s.id === openDropdownId);
                  if (school) {
                    openEditDrawer(school);
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
