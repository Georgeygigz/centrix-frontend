import React, { useState } from 'react';

interface DisabledButtonWithTooltipProps {
  children: React.ReactNode;
  tooltipMessage: string;
  className?: string;
  disabled?: boolean;
}

const DisabledButtonWithTooltip: React.FC<DisabledButtonWithTooltipProps> = ({
  children,
  tooltipMessage,
  className = '',
  disabled = true
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!disabled) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <div
        className={`${className} opacity-50 cursor-not-allowed`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap -top-12 left-1/2 transform -translate-x-1/2">
          {tooltipMessage}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default DisabledButtonWithTooltip;
