import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminAccessGuide() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Admin Access Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        title="Admin Access Guide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </button>

      {/* Admin Access Guide Modal */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🔐 Admin Access Guide</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm text-yellow-800 font-medium">Admin Access Required</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">How to Access Master Dashboard:</h4>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mt-0.5">1</span>
                  <div>
                    <p className="text-sm text-gray-600">Register with email: <span className="font-mono text-purple-600">admin@huddle.com</span></p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mt-0.5">2</span>
                  <div>
                    <p className="text-sm text-gray-600">Login with the same email</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mt-0.5">3</span>
                  <div>
                    <p className="text-sm text-gray-600">You'll see "Admin Panel" in the navigation</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-800 font-medium">Master Dashboard Features:</span>
              </div>
              <ul className="mt-2 text-xs text-blue-700 space-y-1">
                <li>• View all users and manage accounts</li>
                <li>• Monitor all events and analytics</li>
                <li>• Manage teams and invitations</li>
                <li>• System-wide statistics</li>
                <li>• User activation/deactivation</li>
              </ul>
            </div>

            <div className="flex space-x-2">
              <Link
                to="/register"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg text-center transition-colors duration-200"
              >
                Register as Admin
              </Link>
              <Link
                to="/login"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded-lg text-center transition-colors duration-200"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
