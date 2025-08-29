import React, { useState } from 'react';
import { signInWithGoogle } from '../utils/googleAuth.js';

export default function GoogleAuthTest() {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const testGoogleAuth = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      console.log('Testing Google Auth...');
      const result = await signInWithGoogle();
      setTestResult({
        success: true,
        message: 'Google Auth successful!',
        data: result
      });
    } catch (error) {
      console.error('Google Auth test failed:', error);
      setTestResult({
        success: false,
        message: error.message,
        error: error
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Google OAuth Test</h3>
      
      <button
        onClick={testGoogleAuth}
        disabled={isTesting}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isTesting ? 'Testing...' : 'Test Google Auth'}
      </button>

      {testResult && (
        <div className="mt-4 p-3 rounded border">
          <h4 className={`font-semibold ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
            {testResult.success ? '✅ Success' : '❌ Error'}
          </h4>
          <p className="text-sm mt-2">{testResult.message}</p>
          {testResult.error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-600">Error Details</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResult.error, null, 2)}
              </pre>
            </details>
          )}
          {testResult.data && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-600">Success Data</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">Troubleshooting Steps:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Check if pop-ups are blocked in your browser</li>
          <li>Ensure you're on the correct domain (huddle-e6492.web.app)</li>
          <li>Check browser console for detailed error messages</li>
          <li>Verify Google OAuth is enabled in Firebase Console</li>
        </ol>
      </div>
    </div>
  );
}
