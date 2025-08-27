import api from '../lib/api.js'

export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...')
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api')
    
    const response = await api.get('/health')
    console.log('API Health Check Response:', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    console.error('API Connection Test Failed:', error)
    return { 
      success: false, 
      error: error.message,
      isNetworkError: error.isNetworkError,
      isCorsError: error.isCorsError
    }
  }
}

export const testLoginEndpoint = async (emailOrUsername, password) => {
  try {
    console.log('Testing login endpoint...')
    const response = await api.post('/auth/login', { emailOrUsername, password })
    console.log('Login Test Response:', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Login Test Failed:', error)
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    }
  }
}
