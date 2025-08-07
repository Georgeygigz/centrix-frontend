import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FaSearch, FaEye, FaChevronUp, FaChevronDown, FaEllipsisV, FaEdit, FaTrash, FaUserEdit } from 'react-icons/fa';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock data
  const students: Student[] = [
    {
      id: '1',
      admissionNumber: 'ADM001',
      fullName: 'John Smith',
      class: 'Class 10A',
      gender: 'Male',
      dateOfBirth: '2005-03-15',
      parentName: 'Michael Smith',
      contactInfo: '+1234567890',
      address: '123 Main St, City, State',
      dateOfAdmission: '2020-09-01',
    },
    {
      id: '2',
      admissionNumber: 'ADM002',
      fullName: 'Sarah Johnson',
      class: 'Class 9B',
      gender: 'Female',
      dateOfBirth: '2006-07-22',
      parentName: 'David Johnson',
      contactInfo: '+1234567891',
      address: '456 Oak Ave, City, State',
      dateOfAdmission: '2020-09-01',
    },
    {
      id: '3',
      admissionNumber: 'ADM003',
      fullName: 'Michael Brown',
      class: 'Class 11C',
      gender: 'Male',
      dateOfBirth: '2004-11-08',
      parentName: 'Robert Brown',
      contactInfo: '+1234567892',
      address: '789 Pine Rd, City, State',
      dateOfAdmission: '2020-09-01',
    },
    {
      id: '4',
      admissionNumber: 'ADM004',
      fullName: 'Emily Davis',
      class: 'Class 10A',
      gender: 'Female',
      dateOfBirth: '2005-01-30',
      parentName: 'James Davis',
      contactInfo: '+1234567893',
      address: '321 Elm St, City, State',
      dateOfAdmission: '2020-09-01',
    },
    {
      id: '5',
      admissionNumber: 'ADM005',
      fullName: 'Daniel Wilson',
      class: 'Class 9B',
      gender: 'Male',
      dateOfBirth: '2006-05-12',
      parentName: 'Thomas Wilson',
      contactInfo: '+1234567894',
      address: '654 Maple Dr, City, State',
      dateOfAdmission: '2020-09-01',
    },
  ];

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (studentId: string) => {
    setOpenDropdownId(openDropdownId === studentId ? null : studentId);
  };

  const handleEditStudent = (student: Student) => {
    console.log('Edit student:', student);
    setOpenDropdownId(null);
    // TODO: Implement edit functionality
  };

  const handleDeleteStudent = (student: Student) => {
    console.log('Delete student:', student);
    setOpenDropdownId(null);
    // TODO: Implement delete functionality
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? FaChevronUp({ className: "w-5 h-5" }) : FaChevronDown({ className: "w-5 h-5" });
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
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('admissionNumber')}>
                      <div className="flex items-center space-x-1">
                        <span>Admn Number</span>
                        {getSortIcon('admissionNumber')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fullName')}>
                      <div className="flex items-center space-x-1">
                        <span>Full Name</span>
                        {getSortIcon('fullName')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class')}>
                      <div className="flex items-center space-x-1">
                        <span>Class</span>
                        {getSortIcon('class')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('gender')}>
                      <div className="flex items-center space-x-1">
                        <span>Gender</span>
                        {getSortIcon('gender')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dateOfAdmission')}>
                      <div className="flex items-center space-x-1">
                        <span>Date of Admission</span>
                        {getSortIcon('dateOfAdmission')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedStudents.map((student, index) => (
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
                          <div className="relative" ref={dropdownRef}>
                            <button
                              onClick={() => toggleDropdown(student.id)}
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-200"
                              title="More Options"
                            >
                              {FaEllipsisV({ className: "w-3 h-3" })}
                            </button>
                            
                            {openDropdownId === student.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleEditStudent(student)}
                                    className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                  >
                                    {FaEdit({ className: "w-3 h-3 mr-2" })}
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(student)}
                                    className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                                  >
                                    {FaTrash({ className: "w-3 h-3 mr-2" })}
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">5</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-3 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              Previous
            </button>
            <button className="px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              1
            </button>
            <button className="px-4 py-3 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Student Modal */}
      <StudentModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={closeStudentModal}
      />
    </div>
  );
};

export default Students; 