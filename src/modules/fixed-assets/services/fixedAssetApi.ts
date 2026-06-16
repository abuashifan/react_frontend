import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  CapitalizeFixedAssetPayload,
  CreateFixedAssetPayload,
  DisposeFixedAssetPayload,
  FixedAsset,
  FixedAssetListParams,
  FixedAssetReportData,
  FixedAssetReportParams,
  UpdateFixedAssetPayload,
} from '../types/fixedAsset.types'

function cleanParams<T extends object>(params?: T) {
  return Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

export const fixedAssetApi = {
  list: (params: FixedAssetListParams) =>
    http.get<unknown, ApiResponse<FixedAsset[]>>('/fixed-assets', {
      params: cleanParams(params),
    }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<FixedAsset>>(`/fixed-assets/${id}`),

  create: (payload: CreateFixedAssetPayload) =>
    http.post<unknown, ApiResponse<FixedAsset>>('/fixed-assets', payload),

  update: (id: number, payload: UpdateFixedAssetPayload) =>
    http.patch<unknown, ApiResponse<FixedAsset>>(`/fixed-assets/${id}`, payload),

  capitalize: (id: number, payload: CapitalizeFixedAssetPayload) =>
    http.post<unknown, ApiResponse<FixedAsset>>(`/fixed-assets/${id}/capitalize`, payload),

  dispose: (id: number, payload: DisposeFixedAssetPayload) =>
    http.post<unknown, ApiResponse<FixedAsset>>(`/fixed-assets/${id}/dispose`, payload),

  reports: {
    register: (params: Required<Pick<FixedAssetReportParams, 'as_of_period'>>) =>
      http.get<unknown, ApiResponse<FixedAssetReportData>>('/fixed-assets/reports/register', { params }),

    depreciation: (params: Required<Pick<FixedAssetReportParams, 'period_to'>> & Pick<FixedAssetReportParams, 'period_from' | 'mode'>) =>
      http.get<unknown, ApiResponse<FixedAssetReportData>>('/fixed-assets/reports/depreciation', {
        params: cleanParams(params),
      }),

    disposals: (params: Pick<FixedAssetReportParams, 'disposal_date_from' | 'disposal_date_to'>) =>
      http.get<unknown, ApiResponse<FixedAssetReportData>>('/fixed-assets/reports/disposals', {
        params: cleanParams(params),
      }),

    reconciliation: (params: Required<Pick<FixedAssetReportParams, 'as_of_period'>>) =>
      http.get<unknown, ApiResponse<FixedAssetReportData>>('/fixed-assets/reports/reconciliation', { params }),
  },
}
