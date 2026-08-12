import axios from 'axios'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { ImportBatch, ImportProfile, ImportRow, UploadImportResponse } from '../types/imports.types'

export const importsApi = {
  profiles: () => http.get<unknown, ApiResponse<ImportProfile[]>>('/imports/profiles'),

  upload: (profile: string, file: File, confirmDuplicateFile = false) => {
    const form = new FormData()
    form.append('profile', profile)
    form.append('file', file)
    if (confirmDuplicateFile) form.append('confirm_duplicate_file', '1')

    // Content-Type multipart + boundary diatur otomatis oleh axios saat
    // `data` adalah FormData -- jangan diset manual di sini.
    return http.post<unknown, ApiResponse<UploadImportResponse>>('/imports', form)
  },

  mapping: (uuid: string, columnMap: Record<string, string>) =>
    http.patch<unknown, ApiResponse<ImportBatch>>(`/imports/${uuid}/mapping`, { column_map: columnMap }),

  show: (uuid: string) => http.get<unknown, ApiResponse<ImportBatch>>(`/imports/${uuid}`),

  rows: (uuid: string, page: number, perPage = 50) =>
    http.get<unknown, PaginatedResponse<ImportRow>>(`/imports/${uuid}/rows`, { params: { page, per_page: perPage } }),

  commit: (uuid: string) => http.post<unknown, ApiResponse<ImportBatch>>(`/imports/${uuid}/commit`),

  cancel: (uuid: string) => http.delete<unknown, ApiResponse<null>>(`/imports/${uuid}`),

  /**
   * Endpoint templat butuh Bearer token, dan interceptor `http` menormalkan
   * SETIAP respons lewat `normalizeApiResponse()` -- itu merusak Blob (bukan
   * JSON) jadi objek kosong. Pola yang sama dipakai unduhan e-Faktur di
   * `reportsApi`: lewat axios mentah, header otentikasi dipasang manual.
   */
  async downloadTemplate(profile: string): Promise<void> {
    const { token, activeCompanyId } = useAuthStore.getState()
    const response = await axios.get<Blob>(`${import.meta.env.VITE_API_BASE_URL}/api/imports/templates/${profile}`, {
      responseType: 'blob',
      headers: {
        Accept: 'text/csv',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(activeCompanyId ? { 'X-Company-ID': String(activeCompanyId) } : {}),
      },
    })

    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `template-${profile}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
