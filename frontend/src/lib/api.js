import axios from 'axios'

// Determine the correct API base URL
const getApiBaseUrl = () => {
  // In production on Firebase, use the Railway backend URL
  if (window.location.hostname.includes('firebaseapp.com') || window.location.hostname.includes('web.app')) {
    return 'https://eventify-production-ea1c.up.railway.app/api'
  }
  // For local development or other environments, use the full URL
  return import.meta.env.VITE_API_BASE_URL || 'https://eventify-production-ea1c.up.railway.app/api'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('API: Adding token to request:', config.url)
  }
  
  // Log request details for debugging
  console.log('API: Making request to:', config.baseURL + config.url)
  console.log('API: Base URL:', config.baseURL)
  console.log('API: Request method:', config.method?.toUpperCase())
  console.log('API: Request data:', config.data)
  console.log('API: Full URL:', config.baseURL + config.url)
  
  return config
}, (error) => {
  console.error('API: Request error:', error)
  return Promise.reject(error)
})

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API: Response received:', response.config.url, response.status)
    console.log('API: Response data:', response.data)
    return response
  },
  (error) => {
    console.error('API: Error response:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    })
    
    // Handle network errors
    if (!error.response) {
      console.error('API: Network error - no response received')
      return Promise.reject({
        message: 'Network error. Please check your internet connection and try again.',
        isNetworkError: true
      })
    }
    
    // Handle 405 errors specifically
    if (error.response?.status === 405) {
      console.error('API: 405 Method Not Allowed - Check if the endpoint supports the HTTP method')
      return Promise.reject({
        message: 'Method not allowed. Please check if the API endpoint is configured correctly.',
        isMethodError: true,
        method: error.config?.method,
        url: error.config?.url
      })
    }
    
    // Handle 401 errors (unauthorized) - don't automatically logout
    if (error.response?.status === 401) {
      console.log('API: 401 error - token might be invalid')
      // Let the component handle this error
    }
    
    // Handle CORS errors
    if (error.response?.status === 0) {
      console.error('API: CORS error detected')
      return Promise.reject({
        message: 'CORS error. Please check if the API server is running and accessible.',
        isCorsError: true
      })
    }
    
    return Promise.reject(error)
  }
)

export default api


