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
    return Promise.reject(error)
  }
)

export default api


