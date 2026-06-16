import { useQueries } from '@tanstack/react-query'
import { isApiNotFound } from '@/lib/apiError'
import { dashboardApi } from '../services/dashboardApi'

export function useDashboardData() {
  const dashboardQueryDefaults = {
    retry: (failureCount: number, error: unknown) => !isApiNotFound(error) && failureCount < 1,
    refetchOnWindowFocus: false,
  }

  const [summary, pending, chart, activities] = useQueries({
    queries: [
      { ...dashboardQueryDefaults, queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary, staleTime: 5 * 60 * 1000 },
      { ...dashboardQueryDefaults, queryKey: ['dashboard', 'pending'], queryFn: dashboardApi.pending, staleTime: 2 * 60 * 1000 },
      { ...dashboardQueryDefaults, queryKey: ['dashboard', 'chart'], queryFn: dashboardApi.chartData, staleTime: 10 * 60 * 1000 },
      { ...dashboardQueryDefaults, queryKey: ['dashboard', 'activities'], queryFn: dashboardApi.recentActivities, staleTime: 60 * 1000 },
    ],
  })
  return { summary, pending, chart, activities }
}
