import React, { useState, useRef, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';

interface EnhancedDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string; stream?: { name: string } }>;
  placeholder: string;
  error?: string;
  required?: boolean;
  emptyMessage: string;
  onCreateNew: () => void;
  type: 'stream' | 'class';
  hasStreams: boolean;
}

const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
  emptyMessage,
  onCreateNew,
  type,
  hasStreams
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getEmptyStateContent = () => {
    // Debug logging
    console.log('EnhancedDropdown getEmptyStateContent:', { type, hasStreams, optionsLength: options.length, label });
    
    if (type === 'stream') {
      return (
        <div className="text-center p-2">
          <div className="text-sm font-medium text-gray-700 mb-1.5">No Streams Available</div>
          <button
            onClick={onCreateNew}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-colors duration-200 flex items-center space-x-1 mx-auto"
          >
            {FaPlus({ className: "w-3 h-3" })}
            <span>Create Stream</span>
          </button>
        </div>
      );
    }

    if (type === 'class') {
      console.log('Class type detected, hasStreams:', hasStreams, 'for label:', label);
      
      if (!hasStreams) {
        console.log('No streams, showing create stream message');
        return (
          <div className="text-center p-2">
            <div className="text-sm font-medium text-gray-700 mb-1.5">No Streams Available</div>
            <button
              onClick={onCreateNew}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-colors duration-200 flex items-center space-x-1 mx-auto"
            >
              {FaPlus({ className: "w-3 h-3" })}
              <span>Create Stream</span>
            </button>
          </div>
        );
      }
      
      console.log('Has streams, showing create class message');
      return (
        <div className="text-center p-2">
          <div className="text-sm font-medium text-gray-700 mb-1.5">No Classes Available</div>
          <button
            onClick={onCreateNew}
            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded transition-colors duration-200 flex items-center space-x-1 mx-auto"
          >
            {FaPlus({ className: "w-3 h-3" })}
            <span>Create Class</span>
          </button>
        </div>
      );
    }

    return null;
  };

  const getSelectedOptionText = () => {
    if (!value) return placeholder;
    const option = options.find(opt => opt.id === value);
    if (!option) return placeholder;
    
    if (type === 'class' && option.stream) {
      return `${option.name} - ${option.stream.name}`;
    }
    return option.name;
  };

  return (
    <div className="space-y-1" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          type === 'stream' ? 'bg-purple-500' : 'bg-teal-500'
        }`}></span>
        {label} {required && '*'}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 bg-white text-left ${
            error 
              ? 'border-red-300 bg-red-50 focus:ring-red-500' 
              : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500 focus:border-blue-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
              {getSelectedOptionText()}
            </span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-64 overflow-hidden">
            {options.length === 0 ? (
              getEmptyStateContent()
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                  {placeholder}
                </div>
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="px-2 py-1.5 text-xs hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                    onClick={() => handleSelect(option.id)}
                  >
                    {type === 'class' && option.stream ? (
                      <div>
                        <div className="font-medium text-gray-900">{option.name}</div>
                        <div className="text-gray-500 text-xs">Stream: {option.stream.name}</div>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-900">{option.name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default EnhancedDropdown;
