import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  BackendCompany,
  Company,
  CompanyQuota,
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

/**
 * Kuota perusahaan milik user yang sedang login, dikirim backend di `meta`.
 *
 * Nilai cadangannya permisif: kalau backend belum mengirim kuota, tombol tambah
 * tetap muncul dan backend yang menolak — lebih baik daripada menyembunyikan
 * tombol dari client yang sebenarnya berhak.
 */
const FALLBACK_QUOTA: CompanyQuota = {
  used: 0,
  limit: 0,
  can_create: true,
  plan_code: null,
  plan_name: null,
}

function normalizeQuota(raw: unknown): CompanyQuota {
  if (typeof raw !== 'object' || raw === null) return FALLBACK_QUOTA

  const quota = raw as Partial<CompanyQuota>

  return {
    used: typeof quota.used === 'number' ? quota.used : 0,
    limit: typeof quota.limit === 'number' ? quota.limit : 0,
    can_create: typeof quota.can_create === 'boolean' ? quota.can_create : true,
    plan_code: quota.plan_code ?? null,
    plan_name: quota.plan_name ?? null,
  }
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
  async list(): Promise<ApiResponse<Company[]> & { quota: CompanyQuota }> {
    const response = await http.get<unknown, ApiResponse<BackendCompany[]>>('/companies')

    return {
      ...response,
      data: response.data.map(normalizeCompany),
      quota: normalizeQuota(response.meta?.quota),
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

  /**
   * Hapus perusahaan. `confirmName` harus persis sama dengan nama perusahaan —
   * backend menolak kalau tidak cocok, jadi validasi di sini hanya jaga-jaga UX.
   */
  async remove(companyId: number, confirmName: string): Promise<ApiResponse<null>> {
    return http.delete<unknown, ApiResponse<null>>(`/companies/${companyId}`, {
      data: { confirm_name: confirmName },
    })
  },
}
