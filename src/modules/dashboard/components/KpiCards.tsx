import { TrendingUp, TrendingDown, Wallet, BarChart2 } from 'lucide-react'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { formatCurrency } from '@/lib/utils'
import type { DashboardSummary } from '../types/dashboard.types'

interface KpiCardProps {
  title: string
  value: number
  trend?: number | null
  icon: React.ElementType
  iconBg: string
  iconColor: string
  isLoading?: boolean
}

function KpiCard({ title, value, trend, icon: Icon, iconBg, iconColor, isLoading }: KpiCardProps) {
  if (isLoading) return (
    <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
      <div className="mb-3 h-3 w-24 animate-pulse rounded bg-[#e2e8f0]" />
      <div className="h-6 w-36 animate-pulse rounded bg-[#e2e8f0]" />
    </div>
  )
  return (
    <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{title}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-[20px] font-bold tabular-nums text-[#1e293b]">{formatCurrency(value)}</p>
      {trend !== undefined && trend !== null && (
        <p className={`mt-1 text-[11px] font-medium ${trend >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs bulan lalu
        </p>
      )}
    </div>
  )
}

interface Props { summary?: DashboardSummary; isLoading?: boolean }

export function KpiCards({ summary, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <PermissionGuard permission="sales.ar.view" fallback={null}>
        <KpiCard title="Total Piutang" value={summary?.total_receivable ?? 0} trend={summary?.receivable_trend} icon={TrendingUp} iconBg="bg-teal-50" iconColor="text-teal-600" isLoading={isLoading} />
      </PermissionGuard>
      <PermissionGuard permission="purchase.ap.view" fallback={null}>
        <KpiCard title="Total Hutang" value={summary?.total_payable ?? 0} trend={summary?.payable_trend} icon={TrendingDown} iconBg="bg-[#fff7ed]" iconColor="text-[#e39774]" isLoading={isLoading} />
      </PermissionGuard>
      <PermissionGuard permission="cash_bank.view" fallback={null}>
        <KpiCard title="Kas & Bank" value={summary?.cash_balance ?? 0} icon={Wallet} iconBg="bg-teal-50" iconColor="text-teal-600" isLoading={isLoading} />
      </PermissionGuard>
      <PermissionGuard permission="reports.view" fallback={null}>
        <KpiCard title="Laba Bulan Ini" value={summary?.current_month_profit ?? 0} trend={summary?.profit_trend} icon={BarChart2} iconBg={summary && summary.current_month_profit >= 0 ? 'bg-green-50' : 'bg-red-50'} iconColor={summary && summary.current_month_profit >= 0 ? 'text-green-600' : 'text-red-600'} isLoading={isLoading} />
      </PermissionGuard>
    </div>
  )
}
