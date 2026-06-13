import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  BackendCompany,
  Company,
  CompanySettings,
  SelectCompanyResponse,
} from '@/types/auth.types'

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  auto_post: false,
  require_approval: false,
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  session_timeout_minutes: 30,
  onboarding_completed: true,
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
