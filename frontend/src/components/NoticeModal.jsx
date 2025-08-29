import React, { useEffect } from 'react';

export default function NoticeModal({ notice, onAcknowledge }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onAcknowledge();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onAcknowledge]);
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
      style={{ backdropFilter: 'blur(5px)' }}
      onClick={onAcknowledge}
    >
      <div 
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 border-4 border-red-500 shadow-2xl relative" 
        style={{ 
          filter: 'blur(0px)', 
          backdropFilter: 'blur(0px)',
          zIndex: 9999,
          transform: 'translateZ(0)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center relative">
          {/* Close Button */}
          <button
            onClick={onAcknowledge}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Warning Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            ⚠️ Important Notice from Admin
          </h2>

          {/* Admin Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Sent by:</strong> Admin Panel
            </p>
            <p className="text-sm text-gray-600">
              <strong>Date:</strong> {new Date(notice.noticeDate).toLocaleString()}
            </p>
          </div>

          {/* Notice Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium mb-2">Notice Message:</p>
            <p className="text-red-700 text-sm leading-relaxed">
              {notice.notice}
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-yellow-800 font-medium text-sm">Account Status</p>
                <p className="text-yellow-700 text-sm">
                  Your account has been deactivated due to this notice. Please contact support for assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onAcknowledge}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              I Understand
            </button>
            <button
              onClick={onAcknowledge}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
