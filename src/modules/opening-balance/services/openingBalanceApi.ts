import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  OBStatus, OBBatch, OBPreview, CreateOBBatchPayload, OBLinePayload,
} from '../types/openingBalance.types'

// Backend: app/Modules/OpeningBalance/Routes/api.php
export const openingBalanceApi = {
  status: () => http.get<unknown, ApiResponse<OBStatus>>('/opening-balance/status'),
  list: () => http.get<unknown, ApiResponse<OBBatch[]>>('/opening-balance/batches'),
  store: (payload: CreateOBBatchPayload) =>
    http.post<unknown, ApiResponse<OBBatch>>('/opening-balance/batches', payload),
  get: (batchId: number) =>
    http.get<unknown, ApiResponse<OBBatch>>(`/opening-balance/batches/${batchId}`),
  update: (batchId: number, payload: Partial<CreateOBBatchPayload>) =>
    http.patch<unknown, ApiResponse<OBBatch>>(`/opening-balance/batches/${batchId}`, payload),
  replaceLines: (batchId: number, lines: OBLinePayload[]) =>
    http.put<unknown, ApiResponse<OBBatch>>(`/opening-balance/batches/${batchId}/lines`, { lines }),
  validate: (batchId: number) =>
    http.post<unknown, ApiResponse<OBBatch>>(`/opening-balance/batches/${batchId}/validate`),
  preview: (batchId: number) =>
    http.get<unknown, ApiResponse<OBPreview>>(`/opening-balance/batches/${batchId}/preview`),
  post: (batchId: number) =>
    http.post<unknown, ApiResponse<OBBatch>>(`/opening-balance/batches/${batchId}/post`),
  lock: (batchId: number) =>
    http.post<unknown, ApiResponse<OBBatch>>(`/opening-balance/batches/${batchId}/lock`),
  reopen: (batchId: number, reason: string) =>
    http.post<unknown, ApiResponse<OBBatch>>(`/opening-balance/batches/${batchId}/reopen`, { reason }),
}
