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

export default function ApOutstandingReportPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'ap-outstanding', activeParams],
    queryFn: () => reportsApi.apOutstanding({ as_of_date: activeParams?.as_of_date }),
    enabled: !!activeParams,
  })

  const report = data?.data
  const allRows = useMemo(() => report?.rows ?? [], [report])

  const pagedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return allRows.slice(start, start + pagination.pageSize)
  }, [allRows, pagination])

  const handleSubmit = () => {
    setActiveParams({ ...params })
    setShowFilter(false)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const daysOverdue = (dueDate: string | null): number => {
    if (!dueDate) return 0
    const diff = Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000)
    return diff > 0 ? diff : 0
  }

  return (
    <WorkspaceLayout
      title="Hutang Belum Lunas"
      breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Hutang', path: '/reports/ap' }, { label: 'Hutang Belum Lunas' }]}
    >
      <div className="space-y-4">
        {showFilter
          ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} mode="as_of_date" />}

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
                  onClick={() => exportCsv(
                    `hutang-belum-lunas-${activeParams?.as_of_date ?? today}.csv`,
                    ['No. Tagihan', 'Tgl. Tagihan', 'Jatuh Tempo', 'Supplier', 'Total', 'Terbayar', 'Sisa', 'Hari Lewat Jatuh Tempo'],
                    allRows.map((r) => [r.bill_number, r.bill_date ?? '', r.due_date ?? '', r.vendor_name, r.grand_total, r.paid_amount, r.balance_due, daysOverdue(r.due_date)]),
                  )}
                >
                  Export CSV
                </Button>
              </div>
            )}

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No. Tagihan</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tgl. Tagihan</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jatuh Tempo</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Supplier</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Terbayar</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sisa</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Lewat (hari)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {pagedRows.map((row) => {
                    const overdue = daysOverdue(row.due_date)
                    return (
                      <tr key={row.bill_id} className="hover:bg-[#f8fafc]">
                        <td className="px-3 py-1.5 font-mono text-[11px] text-[#5c9ead]">{row.bill_number}</td>
                        <td className="px-3 py-1.5 text-[#64748b]">{row.bill_date ?? '—'}</td>
                        <td className="px-3 py-1.5 text-[#64748b]">{row.due_date ?? '—'}</td>
                        <td className="px-3 py-1.5 text-[#334155]">{row.vendor_name}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">{formatCurrency(row.grand_total)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{formatCurrency(row.paid_amount)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(row.balance_due)}</td>
                        <td className={`px-3 py-1.5 text-right tabular-nums ${overdue > 0 ? 'text-red-600 font-medium' : 'text-[#64748b]'}`}>{overdue > 0 ? overdue : '—'}</td>
                      </tr>
                    )
                  })}
                  {allRows.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-[#94a3b8]">Tidak ada hutang belum lunas.</td></tr>
                  )}
                </tbody>
                {allRows.length > 0 && (
                  <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">
                        Total ({allRows.length} tagihan)
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#334155]">{formatCurrency(report.totals.grand_total)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-green-700">{formatCurrency(report.totals.paid_amount)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.balance_due)}</td>
                      <td />
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
