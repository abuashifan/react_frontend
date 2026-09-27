import axios from 'axios'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ApiResponse } from '@/types/api.types'
import type { CoaImportResult, CoaTemplateAccountInput, CoaTemplateDef, SetupStatus } from '../types/setup.types'

/**
 * Setup wizard — source of truth backend ada di `/setup/*`
 * (app/Modules/Setup/Routes/api.php). `finalize` melakukan `validateAll`
 * secara internal, jadi penyelesaian wizard cukup memanggil `finalize`.
 */
export const setupApi = {
  getStatus: () => http.get<unknown, ApiResponse<SetupStatus>>('/setup/status'),
  getSteps: () => http.get<unknown, ApiResponse<SetupStatus>>('/setup/steps'),
  updateCurrentStep: (step: string, openingDate?: string) =>
    http.patch<unknown, ApiResponse<Record<string, unknown>>>('/setup/current-step', { current_step: step, opening_date: openingDate }),
  validateStep: (step: string, data?: { opening_date?: string }) =>
    http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/validate-step', { step, ...data }),
  validateAll: () => http.post<unknown, ApiResponse<{ valid: boolean; results: Record<string, unknown> }>>('/setup/validate-all'),
  getOpeningBalancePreview: () => http.get<unknown, ApiResponse<Record<string, unknown>>>('/setup/opening-balance/preview'),
  finalize: () => http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/finalize'),
  reopen: (reason: string) => http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/reopen', { reason }),
  listCoaTemplates: () => http.get<unknown, ApiResponse<CoaTemplateDef[]>>('/setup/coa-templates'),
  applyCoaTemplate: (payload: { template_id: string; accounts: CoaTemplateAccountInput[] }) =>
    http.post<unknown, ApiResponse<unknown>>('/setup/coa-templates/apply', payload),

  /** Baca berkas COA milik user (CSV/XLSX) jadi draft akun -- belum disimpan, dipratinjau dulu. */
  importCoaFile: (file: File) => {
    const form = new FormData()
    form.append('file', file)

    return http.post<unknown, ApiResponse<CoaImportResult>>('/setup/coa-templates/import', form)
  },

  /**
   * Templat kolom Code/Name/Type/Parent Code/Cash-Bank untuk impor COA custom.
   * Pola unduhan sama dengan `importsApi.downloadTemplate()`: lewat axios
   * mentah supaya interceptor `http` (yang menormalkan JSON) tidak merusak Blob.
   */
  async downloadCoaImportTemplate(): Promise<void> {
    const { token, activeCompanyId } = useAuthStore.getState()
    const response = await axios.get<Blob>(`${import.meta.env.VITE_API_BASE_URL}/api/setup/coa-templates/import-template`, {
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
    link.download = 'template-chart-of-account.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
