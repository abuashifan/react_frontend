import { useState, useMemo } from 'react'
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
const firstDayOfMonth = today.slice(0, 7) + '-01'

export default function PurchaseByProductReportPage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstDayOfMonth, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'purchase-by-product', activeParams],
    queryFn: () => reportsApi.purchaseByProduct(activeParams!),
    enabled: !!activeParams,
  })

  const report = data?.data
  const allRows = report?.rows ?? []

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
    <WorkspaceLayout
      title="Pembelian per Barang"
      breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Pembelian', path: '/reports/purchase' }, { label: 'Per Barang' }]}
    >
      <div className="space-y-4">
        {showFilter ? (
          <ReportFilterParameter
            params={params}
            onChange={(p) => setParams((prev) => ({ ...prev, ...p }))}
            onSubmit={handleSubmit}
            mode="range"
            isLoading={isLoading}
          />
        ) : (
          <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} mode="range" />
        )}

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && (
          <>
            {allRows.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[12px]"
                  onClick={() =>
                    exportCsv(
                      `pembelian-per-barang-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
                      ['Kode', 'Nama Barang', 'Qty', 'Subtotal', 'Total'],
                      allRows.map((r) => [r.product_code, r.product_name, r.qty, r.subtotal, r.total]),
                    )
                  }
                >
                  Export CSV
                </Button>
              </div>
            )}

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama Barang</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Subtotal</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {pagedRows.map((row) => (
                    <tr key={row.product_id} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 font-mono text-[11px] text-[#64748b]">{row.product_code || '—'}</td>
                      <td className="px-3 py-1.5 text-[#334155]">{row.product_name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{row.qty.toLocaleString('id-ID', { maximumFractionDigits: 4 })}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(row.subtotal)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                  {allRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94a3b8]">Tidak ada data pembelian untuk periode ini.</td>
                    </tr>
                  )}
                </tbody>
                {allRows.length > 0 && (
                  <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total ({allRows.length} barang)</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{report.totals.qty.toLocaleString('id-ID', { maximumFractionDigits: 4 })}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.subtotal)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.total)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {allRows.length > 0 && (
                <TablePagination pagination={pagination} totalRows={allRows.length} onChange={setPagination} isFetching={isLoading} />
              )}
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
