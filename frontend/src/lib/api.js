import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('API: Adding token to request:', config.url)
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('API: Response received:', response.config.url, response.status)
    return response
  },
  (error) => {
    console.error('API: Error response:', error.config?.url, error.response?.status, error.response?.data)
    
    // Handle 401 errors (unauthorized) - don't automatically logout
    if (error.response?.status === 401) {
      console.log('API: 401 error - token might be invalid');
      // Let the component handle this error
    }
    
    return Promise.reject(error)
  }
)

export default api


