import { useState } from 'react'
import api from '../lib/api.js'

export default function ApiTest() {
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testApi = async () => {
    setLoading(true)
    setTestResult('Testing...')
    
    try {
      console.log('Testing API connection...')
      console.log('Base URL:', api.defaults.baseURL)
      
      const response = await api.get('/auth/check-username/testuser')
      console.log('API test successful:', response.data)
      setTestResult(`✅ API working! Response: ${JSON.stringify(response.data)}`)
    } catch (error) {
      console.error('API test failed:', error)
      setTestResult(`❌ API failed! Error: ${error.message} (Status: ${error.response?.status})`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">API Test</h3>
      <button 
        onClick={testApi}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>
      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <pre className="text-sm">{testResult}</pre>
        </div>
      )}
    </div>
  )
}
