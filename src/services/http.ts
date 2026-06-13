import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { ApiError } from '@/types/api.types'
import { useAuthStore } from '@/stores/useAuthStore'

export const http: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const { token, activeCompanyId } = useAuthStore.getState()

  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (activeCompanyId) config.headers['X-Company-ID'] = String(activeCompanyId)

  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const headers = error.response?.headers
    const responseError = {
      ...(error.response?.data ?? {}),
      success: false,
      code: error.response?.data?.code ?? (status ? `HTTP_${status}` : 'UNKNOWN_ERROR'),
      message: error.response?.data?.message ?? error.message ?? 'Terjadi kesalahan.',
      status,
    } as ApiError

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(responseError)
    }

    // Maintenance mode — redirect globally (affects all users)
    if (status === 503 || headers?.['x-maintenance-mode'] === 'true') {
      window.location.href = '/maintenance'
      return Promise.reject(responseError)
    }

    // Network error — no response from server
    if (!error.response) {
      return Promise.reject({
        success: false,
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat terhubung ke server.',
      } as ApiError)
    }

    return Promise.reject(responseError)
  },
)
