import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useDashboardData } from '../hooks/useDashboardData'
import { KpiCards } from '../components/KpiCards'
import { PendingDocumentAlerts } from '../components/PendingDocumentAlerts'
import { SalesPurchaseChart } from '../components/SalesPurchaseChart'
import { CashFlowChart } from '../components/CashFlowChart'
import { RecentActivity } from '../components/RecentActivity'

export default function DashboardPage() {
  const { summary, pending, chart, activities } = useDashboardData()
  return (
    <div className="h-full overflow-y-auto px-4 py-4 md:px-6">
      <div className="mx-auto max-w-[1400px] space-y-5">
        {/* KPI Cards */}
        <KpiCards summary={summary.data?.data} isLoading={summary.isLoading} />

        {/* Pending alerts */}
        <PendingDocumentAlerts pending={pending.data?.data} isLoading={pending.isLoading} />

        {/* Charts */}
        <PermissionGuard permission="reports.view" fallback={null}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SalesPurchaseChart data={chart.data?.data?.sales_purchase} isLoading={chart.isLoading} />
            <CashFlowChart data={chart.data?.data?.cash_flow} isLoading={chart.isLoading} />
          </div>
        </PermissionGuard>

        {/* Recent activity */}
        <RecentActivity activities={activities.data?.data} isLoading={activities.isLoading} />
      </div>
    </div>
  )
}
