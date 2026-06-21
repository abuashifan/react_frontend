import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  AccountMapping,
  UpdateAccountMappingPayload,
  UpdateAccountMappingsPayload,
} from '../types/accountMapping.types'

export const accountMappingApi = {
  list: () =>
    http.get<unknown, ApiResponse<AccountMapping[]>>('/master-data/account-mappings'),

  update: (key: string, payload: UpdateAccountMappingPayload) =>
    http.patch<unknown, ApiResponse<AccountMapping>>(`/master-data/account-mappings/${key}`, payload),

  updateMany: (payload: UpdateAccountMappingsPayload) =>
    http.patch<unknown, ApiResponse<AccountMapping[]>>('/master-data/account-mappings', payload),
}
