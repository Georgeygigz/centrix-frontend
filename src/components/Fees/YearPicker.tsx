import React, { useState, useEffect } from 'react';

interface YearPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

const YearPicker: React.FC<YearPickerProps> = ({
  value,
  onChange,
  placeholder = "Select academic year",
  className = "",
  error = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStartYear, setSelectedStartYear] = useState<number | null>(null);

  // Generate years from 2020 to 2030
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

  // Parse the current value to get the start year
  useEffect(() => {
    if (value && value.includes('-')) {
      const startYear = parseInt(value.split('-')[0]);
      if (!isNaN(startYear)) {
        setSelectedStartYear(startYear);
      }
    }
  }, [value]);

  const handleYearSelect = (startYear: number) => {
    const endYear = startYear + 1;
    const academicYear = `${startYear}-${endYear}`;
    setSelectedStartYear(startYear);
    onChange(academicYear);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (value && value.includes('-')) {
      return value;
    }
    return placeholder;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-left ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {getDisplayValue()}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Select Academic Year</div>
            {years.map((year) => (
              <button
                key={year}
                onClick={() => handleYearSelect(year)}
                className={`w-full px-2 py-2 text-xs text-left rounded-md hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-200 ${
                  selectedStartYear === year ? 'bg-blue-100 text-blue-800' : 'text-gray-900'
                }`}
              >
                {year} - {year + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default YearPicker;

