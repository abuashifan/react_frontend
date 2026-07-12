import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { TablePagination } from '@/components/shared/table/TablePagination'
import type { PaginationState } from '@/components/shared/table/TablePagination'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)

export default function InventoryAgingReportPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const query = useMemo<ReportParams | null>(() => {
    if (!activeParams) return null
    // Backend memakai `include_zero`; filter komponen memakai `include_zero_balance`.
    const { include_zero_balance, ...rest } = activeParams
    return { ...rest, include_zero: include_zero_balance } as ReportParams
  }, [activeParams])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'inventory-aging', query],
    queryFn: () => reportsApi.inventoryAging(query!),
    enabled: !!query,
  })
  const report = data?.data
  const allRows = useMemo(() => report?.rows ?? [], [report])
  const totals = report?.totals

  const pagedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return allRows.slice(start, start + pagination.pageSize)
  }, [allRows, pagination])

  const handleSubmit = () => {
    setActiveParams({ ...params })
    setShowFilter(false)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  return (
    <WorkspaceLayout title="Umur Persediaan" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Umur Persediaan' }]}>
      <div className="space-y-4">
        {showFilter ? (
          <ReportFilterParameter
            params={params}
            onChange={(p) => setParams((prev) => ({ ...prev, ...p }))}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mode="as_of_date"
            dimensions={{ warehouse: true }}
            extras={{ include_zero_balance: true }}
          />
        ) : (
          <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />
        )}

        <p className="text-[11px] text-[#94a3b8]">
          Umur dihitung dari tanggal penerimaan (inbound) terakhir hingga tanggal acuan. Finlite memakai average cost —
          seluruh nilai on-hand tiap baris masuk ke satu bucket umur.
        </p>

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && allRows.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-[12px]"
              onClick={() => exportCsv(
                `umur-persediaan-${report.as_of_date}.csv`,
                ['Kode', 'Produk', 'Gudang', 'Qty', 'Umur (hari)', '0-30', '31-60', '61-90', '>90', 'Total Nilai'],
                allRows.map((r) => [r.product_code, r.product_name, r.warehouse_name, r.quantity_on_hand, r.age_days, r.buckets.days_0_30, r.buckets.days_31_60, r.buckets.days_61_90, r.buckets.days_over_90, r.total_value])
              )}
            >
              Export CSV
            </Button>
          </div>
        )}

        {!isLoading && !isError && report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Produk</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Umur</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">0-30</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">31-60</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">61-90</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">&gt;90</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {pagedRows.map((r) => (
                  <tr key={`${r.product_id}-${r.warehouse_id}`} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 text-[#64748b]">{r.product_code}</td>
                    <td className="px-3 py-1.5 text-[#334155]">{r.product_name}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">{r.warehouse_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">{r.quantity_on_hand.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{r.age_days}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{r.buckets.days_0_30 ? formatCurrency(r.buckets.days_0_30) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{r.buckets.days_31_60 ? formatCurrency(r.buckets.days_31_60) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{r.buckets.days_61_90 ? formatCurrency(r.buckets.days_61_90) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{r.buckets.days_over_90 ? formatCurrency(r.buckets.days_over_90) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(r.total_value)}</td>
                  </tr>
                ))}
                {allRows.length === 0 && (
                  <tr><td colSpan={10} className="py-8 text-center text-[#94a3b8]">Tidak ada persediaan pada tanggal acuan ini.</td></tr>
                )}
              </tbody>
              {totals && allRows.length > 0 && (
                <tfoot className="border-t border-[#e2e8f0] bg-[#f8fafc]">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(totals.buckets.days_0_30)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(totals.buckets.days_31_60)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(totals.buckets.days_61_90)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-red-600">{formatCurrency(totals.buckets.days_over_90)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(totals.total_value)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {allRows.length > 0 && (
              <TablePagination pagination={pagination} totalRows={allRows.length} onChange={setPagination} isFetching={isLoading} />
            )}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
