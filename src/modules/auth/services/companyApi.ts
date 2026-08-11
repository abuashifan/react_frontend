import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  BackendCompany,
  Company,
  CompanySettings,
  CreateCompanyPayload,
  SelectCompanyResponse,
} from '@/types/auth.types'

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  auto_post: false,
  require_approval: false,
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  session_timeout_minutes: 30,
}

export function normalizeCompany(company: BackendCompany): Company {
  return {
    ...company,
    code: company.code ?? null,
    last_accessed_at: company.last_accessed_at ?? null,
    settings: {
      ...DEFAULT_COMPANY_SETTINGS,
      ...(company.settings ?? {}),
    },
  }
}

export const companyApi = {
  async list(): Promise<ApiResponse<Company[]>> {
    const response = await http.get<unknown, ApiResponse<BackendCompany[]>>('/companies')

    return {
      ...response,
      data: response.data.map(normalizeCompany),
    }
  },

  /**
   * Buat perusahaan baru. Backend memprovisi database tenant-nya sekaligus
   * menjalankan migrasi, jadi request ini lebih lama dari mutasi biasa.
   */
  async create(payload: CreateCompanyPayload): Promise<ApiResponse<Company>> {
    const response = await http.post<unknown, ApiResponse<BackendCompany>>('/companies', payload)

    return {
      ...response,
      data: normalizeCompany(response.data),
    }
  },

  async select(companyId: number): Promise<ApiResponse<{ active_company: Company }>> {
    const response = await http.post<unknown, ApiResponse<SelectCompanyResponse>>('/companies/select', {
      company_id: companyId,
    })

    return {
      ...response,
      data: {
        active_company: normalizeCompany(response.data.active_company),
      },
    }
  },
}
