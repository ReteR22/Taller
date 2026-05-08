import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — redirigir al login si el token expiró
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Limpiar store y redirigir
      localStorage.removeItem('mechpro-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
