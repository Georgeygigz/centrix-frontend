import React, { useState, useMemo } from 'react';
import { FaSearch, FaFilter, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Student } from '../../types/dashboard';
import StudentModal from './StudentModal';

const Students: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('admission');

  // Mock data
  const students: Student[] = [
    {
      id: '1',
      admissionNumber: 'ADM001',
      fullName: 'John Doe',
      class: 'Class 10A',
      gender: 'Male',
      dateOfBirth: '15 March 2006',
      parentName: 'Michael Doe',
      contactInfo: '+1 234-567-8900',
      address: '123 Main Street, City, State 12345',
      dateOfAdmission: '1 September 2023'
    },
    {
      id: '2',
      admissionNumber: 'ADM002',
      fullName: 'Jane Smith',
      class: 'Class 9B',
      gender: 'Female',
      dateOfBirth: '22 July 2007',
      parentName: 'Robert Smith',
      contactInfo: '+1 234-567-8901',
      address: '456 Oak Avenue, City, State 12345',
      dateOfAdmission: '1 September 2023'
    },
    {
      id: '3',
      admissionNumber: 'ADM003',
      fullName: 'Mike Johnson',
      class: 'Class 11C',
      gender: 'Male',
      dateOfBirth: '8 November 2005',
      parentName: 'David Johnson',
      contactInfo: '+1 234-567-8902',
      address: '789 Pine Road, City, State 12345',
      dateOfAdmission: '1 September 2023'
    },
    {
      id: '4',
      admissionNumber: 'ADM004',
      fullName: 'Sarah Wilson',
      class: 'Class 10A',
      gender: 'Female',
      dateOfBirth: '3 April 2006',
      parentName: 'James Wilson',
      contactInfo: '+1 234-567-8903',
      address: '321 Elm Street, City, State 12345',
      dateOfAdmission: '1 September 2023'
    },
    {
      id: '5',
      admissionNumber: 'ADM005',
      fullName: 'Alex Brown',
      class: 'Class 9B',
      gender: 'Male',
      dateOfBirth: '17 December 2007',
      parentName: 'Thomas Brown',
      contactInfo: '+1 234-567-8904',
      address: '654 Maple Drive, City, State 12345',
      dateOfAdmission: '1 September 2023'
    }
  ];

  // Filter and sort students
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

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? FaChevronUp({ className: "w-4 h-4" }) : FaChevronDown({ className: "w-4 h-4" });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="p-6">
        {/* Header with tabs, search and filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Tabs and Controls Row */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <nav className="-mb-px flex space-x-8">
                <button 
                  onClick={() => setActiveTab('admission')}
                  className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'admission' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Admission
                </button>
                <button 
                  onClick={() => setActiveTab('academic')}
                  className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'academic' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Academic
                </button>
                <button 
                  onClick={() => setActiveTab('financial')}
                  className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'financial' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Financial
                </button>
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'attendance' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Attendance
                </button>
              </nav>

              {/* Search, Filter, and Sort Controls */}
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {FaSearch({ className: "h-4 w-4 text-gray-400" })}
                  </div>
                </div>

                {/* Filter */}
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200">
                  Filter
                </button>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('admissionNumber')}>
                      <div className="flex items-center space-x-1">
                        <span>Admn Number</span>
                        {getSortIcon('admissionNumber')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fullName')}>
                      <div className="flex items-center space-x-1">
                        <span>Full Name</span>
                        {getSortIcon('fullName')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class')}>
                      <div className="flex items-center space-x-1">
                        <span>Class</span>
                        {getSortIcon('class')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('gender')}>
                      <div className="flex items-center space-x-1">
                        <span>Gender</span>
                        {getSortIcon('gender')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dateOfAdmission')}>
                      <div className="flex items-center space-x-1">
                        <span>Date of Admission</span>
                        {getSortIcon('dateOfAdmission')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedStudents.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.admissionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.class}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.dateOfAdmission}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => openStudentModal(student)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          {FaEye({ className: "w-4 h-4" })}
                        </button>
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
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Academic Information</h3>
              <p className="text-gray-500">Academic data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Financial Information</h3>
              <p className="text-gray-500">Financial data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Information</h3>
              <p className="text-gray-500">Attendance data will be displayed here.</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing result 1-{filteredAndSortedStudents.length} of {filteredAndSortedStudents.length} Entries
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                Previous
              </button>
              <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                Next
              </button>
            </div>
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