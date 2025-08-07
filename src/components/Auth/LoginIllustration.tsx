import React from 'react';

const LoginIllustration: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Abstract shapes background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-blue-300 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-100 rounded-full opacity-40"></div>
      </div>
      
      {/* Main illustration */}
      <div className="relative z-10 max-w-md">
        <svg
          viewBox="0 0 400 300"
          className="w-full h-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Desk */}
          <rect x="50" y="200" width="300" height="20" fill="#8B5CF6" rx="4"/>
          
          {/* Laptop */}
          <rect x="120" y="140" width="160" height="100" fill="#1F2937" rx="8"/>
          <rect x="125" y="145" width="150" height="85" fill="#3B82F6" rx="4"/>
          <rect x="130" y="150" width="140" height="75" fill="#1E40AF" rx="2"/>
          
          {/* Laptop screen content */}
          <rect x="140" y="160" width="120" height="8" fill="#60A5FA" rx="2"/>
          <rect x="140" y="175" width="80" height="8" fill="#60A5FA" rx="2"/>
          <rect x="140" y="190" width="100" height="8" fill="#60A5FA" rx="2"/>
          <rect x="140" y="205" width="60" height="8" fill="#60A5FA" rx="2"/>
          
          {/* Person */}
          <circle cx="200" cy="120" r="25" fill="#F59E0B"/>
          <rect x="185" y="145" width="30" height="40" fill="#F59E0B"/>
          
          {/* Arms */}
          <rect x="175" y="155" width="15" height="8" fill="#F59E0B" rx="4"/>
          <rect x="210" y="155" width="15" height="8" fill="#F59E0B" rx="4"/>
          
          {/* Coffee cup */}
          <rect x="280" y="180" width="20" height="25" fill="#EF4444" rx="2"/>
          <rect x="285" y="175" width="10" height="8" fill="#EF4444" rx="2"/>
          
          {/* Plant */}
          <rect x="80" y="180" width="8" height="20" fill="#059669"/>
          <circle cx="84" cy="175" r="12" fill="#10B981"/>
          <circle cx="78" cy="170" r="8" fill="#34D399"/>
          <circle cx="90" cy="170" r="6" fill="#6EE7B7"/>
          
          {/* Papers */}
          <rect x="320" y="160" width="40" height="50" fill="#F3F4F6" rx="2"/>
          <rect x="325" y="165" width="30" height="3" fill="#D1D5DB"/>
          <rect x="325" y="175" width="25" height="3" fill="#D1D5DB"/>
          <rect x="325" y="185" width="30" height="3" fill="#D1D5DB"/>
          <rect x="325" y="195" width="20" height="3" fill="#D1D5DB"/>
        </svg>
        
        {/* Text overlay */}
        <div className="text-center mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue your learning journey</p>
        </div>
      </div>
    </div>
  );
};

export default LoginIllustration; 