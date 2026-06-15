import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { AccountMapping, UpdateAccountMappingPayload } from '../types/accountMapping.types'

export const accountMappingApi = {
  list: () =>
    http.get<unknown, ApiResponse<AccountMapping[]>>('/master-data/account-mappings'),

  update: (key: string, payload: UpdateAccountMappingPayload) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/account-mappings/${key}`, payload),
}
