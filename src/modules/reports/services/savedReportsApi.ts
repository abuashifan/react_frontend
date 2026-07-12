import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { ReportParams, SavedReport, SavedReportInput, ShareableUser } from '../types/reports.types'

// Adapter boundary (Audit-12 A12-12): normalkan response ke shape stabil.
type Raw = Record<string, unknown>

function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : {}
}
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? (value as unknown[]) : []
}
function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}
function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function adaptSavedReport(raw: Raw): SavedReport {
  return {
    id: num(raw.id),
    report_key: str(raw.report_key),
    name: str(raw.name),
    params: asRecord(raw.params) as ReportParams,
    is_owner: Boolean(raw.is_owner),
    owner_user_id: num(raw.owner_user_id),
    shared_user_ids: asArray(raw.shared_user_ids).map(num),
    created_at: raw.created_at == null ? null : str(raw.created_at),
    updated_at: raw.updated_at == null ? null : str(raw.updated_at),
  }
}

export const savedReportsApi = {
  list: () =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/saved')
      .then((res): SavedReport[] => asArray(res.data).map((r) => adaptSavedReport(asRecord(r)))),

  shareableUsers: () =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/saved/shareable-users')
      .then((res): ShareableUser[] => asArray(res.data).map((r) => {
        const u = asRecord(r)
        return { id: num(u.id), name: str(u.name), email: str(u.email) }
      })),

  create: (input: SavedReportInput) =>
    http
      .post<unknown, ApiResponse<unknown>>('/reports/saved', input)
      .then((res): SavedReport => adaptSavedReport(asRecord(res.data))),

  update: (id: number, input: SavedReportInput) =>
    http
      .put<unknown, ApiResponse<unknown>>(`/reports/saved/${id}`, input)
      .then((res): SavedReport => adaptSavedReport(asRecord(res.data))),

  remove: (id: number) => http.delete<unknown, ApiResponse<null>>(`/reports/saved/${id}`),
}
