import axios from 'axios'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ApiResponse } from '@/types/api.types'
import type { AccountMapping, AccountMappingImportResult, UpdateAccountMappingPayload } from '../types/accountMapping.types'

export const accountMappingApi = {
  list: () =>
    http.get<unknown, ApiResponse<AccountMapping[]>>('/master-data/account-mappings'),

  update: (key: string, payload: UpdateAccountMappingPayload) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/account-mappings/${key}`, payload),

  /** Terapkan berkas Mapping Key + Account Code lewat `updateMapping()` yang sama -- baris kosong dibiarkan, tidak menghapus mapping yang ada. */
  importFile: (file: File) => {
    const form = new FormData()
    form.append('file', file)

    return http.post<unknown, ApiResponse<AccountMappingImportResult>>('/master-data/account-mappings/import', form)
  },

  /**
   * Templat berisi SELURUH mapping key yang terdaftar saat ini, kolom Account
   * Code sudah terisi dari pemetaan yang berlaku. Pola unduhan sama dengan
   * `setupApi.downloadCoaImportTemplate()`: lewat axios mentah supaya
   * interceptor `http` tidak merusak Blob.
   */
  async downloadImportTemplate(): Promise<void> {
    const { token, activeCompanyId } = useAuthStore.getState()
    const response = await axios.get<Blob>(`${import.meta.env.VITE_API_BASE_URL}/api/master-data/account-mappings/import-template`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(activeCompanyId ? { 'X-Company-ID': String(activeCompanyId) } : {}),
      },
    })

    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template-account-mapping.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
