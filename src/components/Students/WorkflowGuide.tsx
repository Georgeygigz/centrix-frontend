import React from 'react';
import { FaStream, FaGraduationCap, FaCheckCircle, FaArrowRight, FaInfoCircle } from 'react-icons/fa';

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center mb-3">
        <div className="flex items-center space-x-2">
          {FaInfoCircle({ className: "w-4 h-4 text-blue-500" })}
          <h3 className="text-sm font-semibold text-gray-700">Admission Workflow</h3>
        </div>
      </div>
      
      {/* Horizontal Workflow Steps */}
      <div className="flex items-center space-x-3">
        {/* Step 1: Streams */}
        <div className={`flex-1 flex items-center justify-center p-2 rounded-md border ${getStepClass(getStepStatus(1))}`}>
          <div className="text-center">
            <div className="text-xs font-medium mb-1">Streams</div>
            {getStepIcon(1, getStepStatus(1))}
            {getStepAction(1, getStepStatus(1))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          {FaArrowRight({ className: "w-3 h-3 text-gray-400" })}
        </div>

        {/* Step 2: Classes */}
        <div className={`flex-1 flex items-center justify-center p-2 rounded-md border ${getStepClass(getStepStatus(2))}`}>
          <div className="text-center">
            <div className="text-xs font-medium mb-1">Classes</div>
            {getStepIcon(2, getStepStatus(2))}
            {getStepAction(2, getStepStatus(2))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          {FaArrowRight({ className: "w-3 h-3 text-gray-400" })}
        </div>

        {/* Step 3: Admission */}
        <div className={`flex-1 flex items-center justify-center p-2 rounded-md border ${getStepClass(getStepStatus(3))}`}>
          <div className="text-center">
            <div className="text-xs font-medium mb-1">Admission</div>
            {getStepIcon(3, getStepStatus(3))}
            {getStepAction(3, getStepStatus(3))}
          </div>
        </div>
      </div>

      {/* Quick Actions - Only show when needed */}
      {(!hasStreams || !hasClasses) && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Quick Actions:</span>
            <div className="flex space-x-2">
              {!hasStreams && (
                <button
                  onClick={onSwitchToStreams}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded border border-blue-200 transition-colors duration-200"
                >
                  Go to Streams
                </button>
              )}
              {hasStreams && !hasClasses && (
                <button
                  onClick={onSwitchToClasses}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded border border-blue-200 transition-colors duration-200"
                >
                  Go to Classes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowGuide;
