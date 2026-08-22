import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { ApiError } from '@/types/api.types'
import { useAdminAuthStore } from '@/stores/useAdminAuthStore'

/**
 * Klien HTTP khusus area admin aplikasi.
 *
 * Terpisah dari `http` bukan sekadar kerapian: instance ini tidak pernah
 * mengirim `X-Company-ID` dan tidak pernah membawa token client, sehingga tidak
 * ada jalan bagi layar admin untuk tidak sengaja meminta data perusahaan.
 */
export const adminHttp: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

adminHttp.interceptors.request.use((config) => {
  const { token } = useAdminAuthStore.getState()

  if (token) config.headers['Authorization'] = `Bearer ${token}`

  return config
})

adminHttp.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const responseError = {
      ...(error.response?.data ?? {}),
      success: false,
      code: error.response?.data?.code ?? (status ? `HTTP_${status}` : 'UNKNOWN_ERROR'),
      message: error.response?.data?.message ?? error.message ?? 'Terjadi kesalahan.',
      status,
    } as ApiError

    if (status === 401) {
      useAdminAuthStore.getState().logout()
      window.location.href = '/admin/login'
      return Promise.reject(responseError)
    }

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
