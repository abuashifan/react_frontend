import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { isApiNotFound } from '@/lib/apiError'
import { getApiErrorMessage } from '@/lib/apiError'
import { useDashboardData } from '../hooks/useDashboardData'
import { KpiCards } from '../components/KpiCards'
import { PendingDocumentAlerts } from '../components/PendingDocumentAlerts'
import { SalesPurchaseChart } from '../components/SalesPurchaseChart'
import { CashFlowChart } from '../components/CashFlowChart'
import { RecentActivity } from '../components/RecentActivity'

export default function DashboardPage() {
  const { summary, pending, chart, activities } = useDashboardData()
  const hardError = [summary, pending, chart, activities].find((query) => query.isError && !isApiNotFound(query.error))?.error ?? null
  const summaryUnavailable = summary.isError || isApiNotFound(summary.error)
  const pendingUnavailable = pending.isError || isApiNotFound(pending.error)
  const chartUnavailable = chart.isError || isApiNotFound(chart.error)
  const activitiesUnavailable = activities.isError || isApiNotFound(activities.error)

  const handleRetry = () => {
    void Promise.all([
      summary.refetch(),
      pending.refetch(),
      chart.refetch(),
      activities.refetch(),
    ])
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 md:px-6">
      <div className="mx-auto max-w-[1400px] space-y-5">
        {hardError ? (
          <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <p className="text-[13px] font-semibold">Dashboard gagal dimuat</p>
            <p className="mt-1 text-[13px]">{getApiErrorMessage(hardError, 'Gagal memuat dashboard.')}</p>
            <Button type="button" variant="outline" className="mt-3 h-8 text-[13px]" onClick={handleRetry}>
              Muat ulang
            </Button>
          </section>
        ) : null}

        {/* KPI Cards */}
        <KpiCards summary={summary.data?.data} isLoading={summary.isLoading} isUnavailable={summaryUnavailable} />

        {/* Pending alerts */}
        <PendingDocumentAlerts pending={pending.data?.data} isLoading={pending.isLoading} isUnavailable={pendingUnavailable} />

        {/* Charts */}
        <PermissionGuard permission="reports.view" fallback={null}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SalesPurchaseChart data={chart.data?.data?.sales_purchase} isLoading={chart.isLoading} isUnavailable={chartUnavailable} />
            <CashFlowChart data={chart.data?.data?.cash_flow} isLoading={chart.isLoading} isUnavailable={chartUnavailable} />
          </div>
        </PermissionGuard>

        {/* Recent activity */}
        <RecentActivity activities={activities.data?.data} isLoading={activities.isLoading} isUnavailable={activitiesUnavailable} />
      </div>
    </div>
  )
}
