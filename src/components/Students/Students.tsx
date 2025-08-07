import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaUserEdit, FaTimes, FaUser, FaGraduationCap, FaVenusMars, FaCalendar, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { Student } from '../../types/dashboard';
import StudentModal from './StudentModal';

const Students: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('admission');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load students data from JSON file
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch('/students.json');
        if (!response.ok) {
          throw new Error('Failed to load students data');
        }
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error('Error loading students:', error);
        // Fallback to empty array if loading fails
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, []);

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student =>
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.class.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof Student];
        const bValue = b[sortBy as keyof Student];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [students, searchQuery, sortBy, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  // Debug pagination
  console.log('Pagination Debug:', {
    totalStudents: students.length,
    filteredStudents: filteredAndSortedStudents.length,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedStudentsCount: paginatedStudents.length
  });

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const openStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeStudentModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Close dropdown if clicking outside both the dropdown menu and the portal dropdown
      if (!target.closest('.dropdown-menu') && !target.closest('[data-portal-dropdown]')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (studentId: string, event: React.MouseEvent) => {
    if (openDropdownId === studentId) {
      setOpenDropdownId(null);
    } else {
      const button = event.currentTarget as HTMLElement;
      const buttonRect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 80; // Approximate height of dropdown
      
      // Calculate position
      let x = buttonRect.right - 128; // 128px is dropdown width
      let y = buttonRect.bottom + 4; // 4px margin
      
      // If there's not enough space below, position above
      if (buttonRect.bottom + dropdownHeight > viewportHeight) {
        y = buttonRect.top - dropdownHeight - 4;
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
      
      // Ensure dropdown doesn't go off-screen horizontally
      if (x < 0) x = 0;
      if (x + 128 > window.innerWidth) x = window.innerWidth - 128;
      
      setDropdownCoords({ x, y });
      setOpenDropdownId(studentId);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditDrawerOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeleteStudent = (student: Student) => {
    console.log('Delete student:', student);
    setOpenDropdownId(null);
    // TODO: Implement delete functionality
  };

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingStudent(null);
  };

  const handleSaveStudent = () => {
    // TODO: Implement save functionality
    console.log('Saving student:', editingStudent);
    closeEditDrawer();
  };

  const handleInputChange = (field: keyof Student, value: string) => {
    if (editingStudent) {
      setEditingStudent({
        ...editingStudent,
        [field]: value
      });
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
                  onClick={() => setActiveTab('admission')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'admission' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Admission
                </button>
                <button 
                  onClick={() => setActiveTab('academic')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'academic' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Academic
                </button>
                <button 
                  onClick={() => setActiveTab('financial')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'financial' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Financial
                </button>
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className={`border-b-2 py-1 px-1 text-xs font-medium transition-colors duration-200 ${
                    activeTab === 'attendance' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Attendance
                </button>
              </nav>

              {/* Search, Filter, and Sort Controls */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
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
                  <option value="admissionNumber">Admission Number</option>
                  <option value="fullName">Full Name</option>
                  <option value="class">Class</option>
                  <option value="gender">Gender</option>
                  <option value="dateOfAdmission">Date of Admission</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'admission' && (
          <div className="bg-white rounded-md shadow-sm">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading students...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('admissionNumber')}>
                        <div className="flex items-center space-x-1">
                          <span>Admn number</span>
                          {getSortIcon('admissionNumber')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fullName')}>
                        <div className="flex items-center space-x-1">
                          <span>Full name</span>
                          {getSortIcon('fullName')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class')}>
                        <div className="flex items-center space-x-1">
                          <span>Class</span>
                          {getSortIcon('class')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('gender')}>
                        <div className="flex items-center space-x-1">
                          <span>Gender</span>
                          {getSortIcon('gender')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dateOfAdmission')}>
                        <div className="flex items-center space-x-1">
                          <span>Date of admission</span>
                          {getSortIcon('dateOfAdmission')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {student.admissionNumber}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.class}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.gender}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.dateOfAdmission}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openStudentModal(student)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                              title="View Details"
                            >
                              {FaEye({ className: "w-3 h-3" })}
                            </button>
                            
                                                    {/* Dropdown Menu */}
                          <div className="relative dropdown-menu">
                            <button
                              onClick={(e) => toggleDropdown(student.id, e)}
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-200"
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
            )}
          </div>
        )}

        {/* Academic Tab */}
        {activeTab === 'academic' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Academic Information</h3>
              <p className="text-xs text-gray-500">Academic data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Financial Information</h3>
              <p className="text-xs text-gray-500">Financial data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Attendance Information</h3>
              <p className="text-xs text-gray-500">Attendance data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredAndSortedStudents.length)}</span> of <span className="font-medium">{filteredAndSortedStudents.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
              Page {currentPage} of {totalPages} ({totalPages > 1 ? `${totalPages} pages` : '1 page'})
            </span>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Student Modal */}
      {isModalOpen && selectedStudent && (
        <StudentModal student={selectedStudent} isOpen={isModalOpen} onClose={closeStudentModal} />
      )}

            {/* Edit Drawer */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-500 ease-out z-50 ${
        isEditDrawerOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-out ${
          isEditDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {editingStudent && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                              <div>
                <h2 className="text-xl font-bold text-gray-900 font-elegant">Edit Student</h2>
                <p className="text-xs text-gray-500 mt-1 font-modern">Update student information</p>
              </div>
                <button
                  onClick={closeEditDrawer}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-4 h-4" })}
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto h-full">
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={editingStudent.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter full name"
                    />
                  </div>

                  {/* Admission Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Admission number
                    </label>
                    <input
                      type="text"
                      value={editingStudent.admissionNumber}
                      onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter admission number"
                    />
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Class
                    </label>
                    <input
                      type="text"
                      value={editingStudent.class}
                      onChange={(e) => handleInputChange('class', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter class"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Gender
                    </label>
                    <select
                      value={editingStudent.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Date of birth
                    </label>
                    <input
                      type="date"
                      value={editingStudent.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    />
                  </div>

                  {/* Parent Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Parent name
                    </label>
                    <input
                      type="text"
                      value={editingStudent.parentName}
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter parent name"
                    />
                  </div>

                  {/* Contact Info */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Contact info
                    </label>
                    <input
                      type="tel"
                      value={editingStudent.contactInfo}
                      onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                      placeholder="Enter contact number"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Address
                    </label>
                    <textarea
                      value={editingStudent.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs"
                      placeholder="Enter address"
                    />
                  </div>

                  {/* Date of Admission */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                      Date of admission
                    </label>
                    <input
                      type="date"
                      value={editingStudent.dateOfAdmission}
                      onChange={(e) => handleInputChange('dateOfAdmission', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-100">
                <button
                  onClick={closeEditDrawer}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStudent}
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
        >
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const student = students.find(s => s.id === openDropdownId);
                if (student) {
                  handleEditStudent(student);
                  setOpenDropdownId(null); // Close dropdown after clicking
                }
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
            >
              {FaEdit({ className: "w-3 h-3 mr-2" })}
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const student = students.find(s => s.id === openDropdownId);
                if (student) {
                  handleDeleteStudent(student);
                  setOpenDropdownId(null); // Close dropdown after clicking
                }
              }}
              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              {FaTrash({ className: "w-3 h-3 mr-2" })}
              Delete
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Students; 