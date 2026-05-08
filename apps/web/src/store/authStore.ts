import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/services/api'

export interface User {
  id:     string
  name:   string
  email:  string
  role:   'ADMIN' | 'MECHANIC'
  avatar?: string
}

interface AuthState {
  user:      User | null
  token:     string | null
  isLoading: boolean
  error:     string | null
  login:     (email: string, password: string) => Promise<void>
  logout:    () => void
  clearError:() => void
  isAdmin:   () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      isLoading: false,
      error:     null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await apiClient.post('/auth/login', { email, password })
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ user: data.user, token: data.token, isLoading: false })
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.response?.data?.error || 'Error al iniciar sesión',
          })
          throw err
        }
      },

      logout: () => {
        delete apiClient.defaults.headers.common['Authorization']
        set({ user: null, token: null })
      },

      clearError: () => set({ error: null }),
      isAdmin:    () => get().user?.role === 'ADMIN',
    }),
    {
      name:        'mechpro-auth',
      partialize:  s => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => {
        // Restaurar token en axios al recargar
        if (state?.token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
