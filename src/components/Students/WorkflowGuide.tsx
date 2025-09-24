import React from 'react';
import { FaStream, FaGraduationCap, FaCheckCircle, FaArrowRight, FaInfoCircle, FaExclamationTriangle, FaPlay } from 'react-icons/fa';

interface WorkflowGuideProps {
  hasStreams: boolean;
  hasClasses: boolean;
  onSwitchToStreams: () => void;
  onSwitchToClasses: () => void;
}

const WorkflowGuide: React.FC<WorkflowGuideProps> = ({
  hasStreams,
  hasClasses,
  onSwitchToStreams,
  onSwitchToClasses
}) => {
  const getStepStatus = (step: number) => {
    if (step === 1) return hasStreams ? 'completed' : 'current';
    if (step === 2) return hasStreams && hasClasses ? 'completed' : hasStreams ? 'current' : 'blocked';
    if (step === 3) return hasStreams && hasClasses ? 'current' : 'blocked';
    return 'blocked';
  };

  const getStepIcon = (step: number, status: string) => {
    if (status === 'completed') {
      return FaCheckCircle({ className: "w-4 h-4 text-green-500" });
    }
    // Remove warning icons to save space
    return null;
  };

  const getStepClass = (status: string) => {
    if (status === 'completed') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'current') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-400 bg-gray-50 border-gray-200';
  };

  const getStepAction = (step: number, status: string) => {
    if (step === 1 && status === 'current') {
      return null; // Remove Create button since we have "Go to Streams" in Quick Actions
    }
    if (step === 2 && status === 'current') {
      return (
        <button
          onClick={onSwitchToClasses}
          className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 shadow-sm hover:shadow-md"
        >
          {FaGraduationCap({ className: "w-3 h-3" })}
          <span>Create</span>
        </button>
      );
    }
    if (step === 3 && status === 'current') {
      return (
        <div className="mt-2 text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-md">
          Ready!
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {FaInfoCircle({ className: "w-5 h-5 text-blue-600" })}
          <h3 className="text-base font-bold text-blue-900">Student Setup Workflow</h3>
        </div>
        <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
          {hasStreams && hasClasses ? "Setup Complete" : "Setup Required"}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-blue-700 mb-1">
          <span>Progress</span>
          <span>{hasStreams && hasClasses ? '100%' : hasStreams ? '66%' : '33%'}</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: hasStreams && hasClasses ? '100%' : hasStreams ? '66%' : '33%'
            }}
          ></div>
        </div>
      </div>

      {/* Horizontal Workflow Steps */}
      <div className="flex items-center space-x-4">
        {/* Step 1: Streams */}
        <div className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${getStepClass(getStepStatus(1))}`}>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              {FaStream({ className: `w-5 h-5 ${getStepStatus(1) === 'completed' ? 'text-green-600' : getStepStatus(1) === 'current' ? 'text-blue-600' : 'text-gray-400'}` })}
            </div>
            <div className="text-sm font-semibold mb-1">1. Create Streams</div>
            <div className="text-xs text-gray-600 mb-2">Academic tracks</div>
            {getStepIcon(1, getStepStatus(1))}
            {getStepAction(1, getStepStatus(1))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          {FaArrowRight({ className: "w-3 h-3 text-gray-400" })}
        </div>

        {/* Step 2: Classes */}
        <div className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${getStepClass(getStepStatus(2))}`}>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              {FaGraduationCap({ className: `w-5 h-5 ${getStepStatus(2) === 'completed' ? 'text-green-600' : getStepStatus(2) === 'current' ? 'text-blue-600' : 'text-gray-400'}` })}
            </div>
            <div className="text-sm font-semibold mb-1">2. Create Classes</div>
            <div className="text-xs text-gray-600 mb-2">Within streams</div>
            {getStepIcon(2, getStepStatus(2))}
            {getStepAction(2, getStepStatus(2))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          {FaArrowRight({ className: "w-3 h-3 text-gray-400" })}
        </div>

        {/* Step 3: Admission */}
        <div className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${getStepClass(getStepStatus(3))}`}>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              {FaPlay({ className: `w-5 h-5 ${getStepStatus(3) === 'completed' ? 'text-green-600' : getStepStatus(3) === 'current' ? 'text-blue-600' : 'text-gray-400'}` })}
            </div>
            <div className="text-sm font-semibold mb-1">3. Admit Students</div>
            <div className="text-xs text-gray-600 mb-2">Start admissions</div>
            {getStepIcon(3, getStepStatus(3))}
            {getStepAction(3, getStepStatus(3))}
          </div>
        </div>
      </div>

      {/* Next Steps - Only show when needed */}
      {(!hasStreams || !hasClasses) && (
        <div className="mt-5 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {FaExclamationTriangle({ className: "w-4 h-4 text-amber-500" })}
              <span className="text-sm font-medium text-blue-900">
                {!hasStreams ? "Start by creating streams" : "Now create classes within your streams"}
              </span>
            </div>
            <div className="flex space-x-2">
              {!hasStreams && (
                <button
                  onClick={onSwitchToStreams}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm hover:shadow-md font-medium flex items-center space-x-2"
                >
                  {FaStream({ className: "w-4 h-4" })}
                  <span>Create Streams</span>
                </button>
              )}
              {hasStreams && !hasClasses && (
                <button
                  onClick={onSwitchToClasses}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm hover:shadow-md font-medium flex items-center space-x-2"
                >
                  {FaGraduationCap({ className: "w-4 h-4" })}
                  <span>Create Classes</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success message when ready */}
      {hasStreams && hasClasses && (
        <div className="mt-5 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-center space-x-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
            {FaCheckCircle({ className: "w-5 h-5 text-green-600" })}
            <span className="text-sm font-medium">Setup complete! You can now admit students to your classes.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowGuide;
