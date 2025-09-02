import React, { useState } from 'react';
import WorkflowGuide from './WorkflowGuide';
import EnhancedDropdown from './EnhancedDropdown';

const WorkflowDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('admission');
  const [hasStreams, setHasStreams] = useState(false);
  const [hasClasses, setHasClasses] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');

  const mockStreams = hasStreams ? [
    { id: '1', name: 'Science Stream', code: 'SCI' },
    { id: '2', name: 'Arts Stream', code: 'ART' }
  ] : [];

  const mockClasses = hasClasses ? [
    { id: '1', name: 'Form 1A', stream: { name: 'Science Stream' } },
    { id: '2', name: 'Form 1B', stream: { name: 'Science Stream' } },
    { id: '3', name: 'Form 2A', stream: { name: 'Arts Stream' } }
  ] : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Student Admission Workflow Demo</h1>
      
      {/* Control Panel */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-3">Control Panel</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setHasStreams(!hasStreams)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              hasStreams 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            {hasStreams ? '✓ Streams Created' : 'No Streams'}
          </button>
          <button
            onClick={() => setHasClasses(!hasClasses)}
            disabled={!hasStreams}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              hasClasses 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : hasStreams 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-400 border border-gray-300'
            }`}
          >
            {hasClasses ? '✓ Classes Created' : hasStreams ? 'No Classes' : 'Need Streams First'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-1">
          {['admission', 'streams', 'classes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {activeTab === 'admission' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Student Admission Form</h2>
            
            {/* Workflow Guide */}
            {(mockStreams.length === 0 || mockClasses.length === 0) && (
              <WorkflowGuide
                hasStreams={mockStreams.length > 0}
                hasClasses={mockClasses.length > 0}
                onSwitchToStreams={() => setActiveTab('streams')}
                onSwitchToClasses={() => setActiveTab('classes')}
              />
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Number
                </label>
                <input
                  type="text"
                  placeholder="Enter admission number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Enhanced Dropdowns */}
            <div className="grid grid-cols-2 gap-4">
              <EnhancedDropdown
                label="Class On Admission"
                value={selectedClass}
                onChange={setSelectedClass}
                options={mockClasses}
                placeholder="Select a class"
                required={true}
                emptyMessage="No classes available"
                onCreateNew={() => setActiveTab('classes')}
                type="class"
                hasStreams={mockStreams.length > 0}
              />
              
              <EnhancedDropdown
                label="Current Class"
                value={selectedClass}
                onChange={setSelectedClass}
                options={mockClasses}
                placeholder="Select a class"
                required={false}
                emptyMessage="No classes available"
                onCreateNew={() => setActiveTab('classes')}
                type="class"
                hasStreams={mockStreams.length > 0}
              />
            </div>
          </div>
        )}

        {activeTab === 'streams' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Streams</h2>
            
            {/* Helpful message when no streams exist */}
            {mockStreams.length === 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 text-purple-600">ℹ️</div>
                  <h3 className="text-sm font-semibold text-purple-900">Getting Started with Streams</h3>
                </div>
                <p className="text-xs text-purple-700 mb-3">
                  Streams are the foundation of your school structure. They help organize students by academic focus areas.
                </p>
                <div className="text-xs text-purple-600">
                  <strong>Examples:</strong> Science Stream, Arts Stream, Business Stream, Technical Stream
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Science Stream"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., SCI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setHasStreams(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Stream
            </button>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Classes</h2>
            
            {/* Helpful message when no classes exist */}
            {mockClasses.length === 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 text-green-600">ℹ️</div>
                  <h3 className="text-sm font-semibold text-green-900">Getting Started with Classes</h3>
                </div>
                <p className="text-xs text-green-700 mb-3">
                  Classes are created within streams to organize students by grade level and academic focus.
                </p>
                <div className="text-xs text-green-600">
                  <strong>Examples:</strong> Form 1A (Science), Form 2B (Arts), Form 3C (Business)
                </div>
                {mockStreams.length === 0 && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-amber-700">
                      <div className="w-3 h-3">⚠️</div>
                      <span className="text-xs font-medium">You need to create streams first!</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('streams')}
                      className="mt-2 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center space-x-1"
                    >
                      <span>→</span>
                      <span>Go to Streams</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Form 1A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., F1A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Stream Selection */}
            <EnhancedDropdown
              label="Stream"
              value={selectedStream}
              onChange={setSelectedStream}
              options={mockStreams}
              placeholder="Select a stream"
              required={true}
              emptyMessage="No streams available"
              onCreateNew={() => setActiveTab('streams')}
              type="stream"
              hasStreams={mockStreams.length > 0}
            />

            <button
              onClick={() => setHasClasses(true)}
              disabled={!hasStreams}
              className={`px-6 py-2 rounded-lg transition-colors ${
                hasStreams 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create Class
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowDemo;
