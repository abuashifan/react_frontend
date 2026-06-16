import { useQueries } from '@tanstack/react-query'
import { dashboardApi } from '../services/dashboardApi'

export function useDashboardData() {
  const [summary, pending, chart, activities] = useQueries({
    queries: [
      { queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary, staleTime: 5 * 60 * 1000 },
      { queryKey: ['dashboard', 'pending'], queryFn: dashboardApi.pending, staleTime: 2 * 60 * 1000 },
      { queryKey: ['dashboard', 'chart'], queryFn: dashboardApi.chartData, staleTime: 10 * 60 * 1000 },
      { queryKey: ['dashboard', 'activities'], queryFn: dashboardApi.recentActivities, staleTime: 60 * 1000 },
    ],
  })
  return { summary, pending, chart, activities }
}
