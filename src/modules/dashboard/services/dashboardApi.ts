import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { DashboardSummary, DashboardPending, DashboardChartData, DashboardActivity } from '../types/dashboard.types'

export const dashboardApi = {
  summary: () => http.get<unknown, ApiResponse<DashboardSummary>>('/dashboard/summary'),
  pending: () => http.get<unknown, ApiResponse<DashboardPending>>('/dashboard/pending'),
  chartData: () => http.get<unknown, ApiResponse<DashboardChartData>>('/dashboard/chart'),
  recentActivities: () => http.get<unknown, ApiResponse<DashboardActivity[]>>('/dashboard/activities'),
}
