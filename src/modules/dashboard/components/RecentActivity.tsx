import { Link } from 'react-router-dom'
import { FileText, ShoppingCart, Package, CreditCard, ArrowLeftRight } from 'lucide-react'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { DashboardActivity } from '../types/dashboard.types'
import type { DocumentStatus } from '@/types/common.types'

function getActivityIcon(sourceType: string) {
  if (sourceType.includes('invoice') || sourceType.includes('bill')) return FileText
  if (sourceType.includes('order')) return ShoppingCart
  if (sourceType.includes('receipt') || sourceType.includes('payment')) return CreditCard
  if (sourceType.includes('transfer')) return ArrowLeftRight
  return Package
}

function formatTimeAgo(dateStr: string) {
  const timestamp = new Date(dateStr).getTime()
  if (Number.isNaN(timestamp)) return '-'
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

const ICON_BG: Record<string, string> = {
  sales: 'bg-teal-50',
  purchase: 'bg-[#fff7ed]',
  inventory: 'bg-purple-50',
  default: 'bg-[#f1f5f9]',
}

interface Props { activities?: DashboardActivity[]; isLoading?: boolean; isUnavailable?: boolean }

export function RecentActivity({ activities, isLoading, isUnavailable }: Props) {
  return (
    <div className="rounded-lg border border-[#d9e2e5] bg-white">
      <div className="flex items-center justify-between border-b border-[#d9e2e5] px-4 py-3">
        <p className="text-[13px] font-semibold text-[#1e293b]">Aktivitas Terbaru</p>
        <span className="text-[11px] text-[#64748b]">10 transaksi terakhir</span>
      </div>
      <div className="divide-y divide-[#f1f5f9]">
        {isUnavailable ? (
          <EmptyState
            title="Aktivitas belum tersedia"
            description="Backend belum menyediakan endpoint aktivitas dashboard."
          />
        ) : isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-md bg-[#f1f5f9]" />
              <div className="flex-1 space-y-1.5"><div className="h-3 w-40 animate-pulse rounded bg-[#f1f5f9]" /><div className="h-2.5 w-24 animate-pulse rounded bg-[#f1f5f9]" /></div>
            </div>
          ))
          : (activities ?? []).map((activity) => {
            const Icon = getActivityIcon(activity.source_type)
            const module = activity.source_type.split('.')[0] ?? 'default'
            const bg = ICON_BG[module] ?? ICON_BG.default
            return (
              <Link key={activity.id} to={activity.href}>
                <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#f8fafc]">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${bg}`}>
                    <Icon className="h-4 w-4 text-[#64748b]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-[#1e293b]">{activity.title}</p>
                    <p className="text-[11px] text-[#64748b]">{activity.subtitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12px] font-medium tabular-nums text-[#1e293b]">{formatCurrency(activity.amount)}</p>
                    <p className="text-[10px] text-[#94a3b8]">{formatTimeAgo(activity.created_at)}</p>
                  </div>
                  <DocumentStatusBadge status={activity.status as DocumentStatus} />
                </div>
              </Link>
            )
          })}
        {!isLoading && (activities ?? []).length === 0 && (
          <p className="py-8 text-center text-[12px] text-[#94a3b8]">Belum ada aktivitas transaksi.</p>
        )}
      </div>
    </div>
  )
}
