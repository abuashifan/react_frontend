import { Link } from 'react-router-dom'
import { FileText, Receipt, Package, Calendar, ChevronRight } from 'lucide-react'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import type { DashboardPending } from '../types/dashboard.types'

type AlertVariant = 'warning' | 'danger' | 'info'
const VARIANT_STYLES: Record<AlertVariant, string> = {
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-[#d9e2e5] bg-[#EFF9FB] text-[#326273]',
}

interface AlertCardProps {
  icon: React.ElementType
  label: string
  count?: number
  href: string
  variant: AlertVariant
}

function AlertCard({ icon: Icon, label, count, href, variant }: AlertCardProps) {
  return (
    <Link to={href}>
      <div className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-opacity hover:opacity-80 ${VARIANT_STYLES[variant]}`}>
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-[12px] font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {count !== undefined && <span className="text-[12px] font-bold tabular-nums">{count}</span>}
          <ChevronRight className="h-3 w-3 opacity-60" />
        </div>
      </div>
    </Link>
  )
}

interface Props { pending?: DashboardPending; isLoading?: boolean }

export function PendingDocumentAlerts({ pending, isLoading }: Props) {
  if (isLoading) return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[#f1f5f9]" />)}
    </div>
  )

  const hasAlerts = pending && (pending.pending_invoices > 0 || pending.pending_bills > 0 || pending.low_stock_count > 0 || (pending.fiscal_year_days_remaining ?? 999) <= 30)
  if (!hasAlerts) return null

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Perlu Perhatian</p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {(pending?.pending_invoices ?? 0) > 0 && (
          <PermissionGuard permission="sales.invoices.view" fallback={null}>
            <AlertCard icon={FileText} label="Invoice menunggu konfirmasi" count={pending?.pending_invoices} href="/sales/invoices" variant="warning" />
          </PermissionGuard>
        )}
        {(pending?.pending_bills ?? 0) > 0 && (
          <PermissionGuard permission="purchase.ap.view" fallback={null}>
            <AlertCard icon={Receipt} label="Tagihan menunggu pembayaran" count={pending?.pending_bills} href="/purchase/bills" variant="warning" />
          </PermissionGuard>
        )}
        {(pending?.low_stock_count ?? 0) > 0 && (
          <PermissionGuard permission="inventory.stock.view" fallback={null}>
            <AlertCard icon={Package} label="Produk stok di bawah minimum" count={pending?.low_stock_count} href="/reports/inventory-analysis" variant="danger" />
          </PermissionGuard>
        )}
        {(pending?.fiscal_year_days_remaining ?? 999) <= 30 && (
          <PermissionGuard permission="accounting.fiscal-years.manage" fallback={null}>
            <AlertCard icon={Calendar} label={`Periode akuntansi berakhir dalam ${pending?.fiscal_year_days_remaining ?? 0} hari`} href="/accounting/fiscal-years" variant="info" />
          </PermissionGuard>
        )}
      </div>
    </div>
  )
}
