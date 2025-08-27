import React from 'react';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          
          {/* Pulse effect */}
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-300 border-t-purple-500 rounded-full animate-ping mx-auto opacity-20"></div>
        </div>
        
        {/* Loading text */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Eventify</h2>
        <p className="text-gray-600">{message}</p>
        
        {/* Dots animation */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
