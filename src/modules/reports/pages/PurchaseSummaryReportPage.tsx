import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { TablePagination } from '@/components/shared/table/TablePagination'
import type { PaginationState } from '@/components/shared/table/TablePagination'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { ReportExportButton } from '../components/ReportExportButton'
import { toExcelNumber } from '@/lib/exportXlsx'
import { useReportParams } from '../hooks/useReportParams'

const today = new Date().toISOString().slice(0, 10)
const firstDayOfMonth = today.slice(0, 7) + '-01'

export default function PurchaseSummaryReportPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstDayOfMonth, end_date: today, group_by: 'month' })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'purchase-summary', activeParams],
    queryFn: () => reportsApi.purchaseSummary(activeParams!),
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

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={activeParams ? <ReportCompactBar params={activeParams} onOpenModal={() => setShowFilter(true)} mode="range" /> : undefined}
    >
      <div className="space-y-4">
        {activeParams && (
          <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2">
            <label className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">Kelompokkan per</label>
            <select
              className="rounded border border-[#e2e8f0] px-2 py-1 text-[12px] text-[#334155] focus:outline-none"
              value={params.group_by ?? 'month'}
              onChange={(e) => {
                const gb = e.target.value as 'day' | 'month'
                setParams((prev) => ({ ...prev, group_by: gb }))
                setActiveParams((prev) => (prev ? { ...prev, group_by: gb } : prev))
              }}
            >
              <option value="month">Bulan</option>
              <option value="day">Hari</option>
            </select>
          </div>
        )}
        <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)}
          params={params}
          onChange={(p) => setParams((prev) => ({ ...prev, ...p }))}
          onSubmit={handleSubmit}
          mode="range"
          isLoading={isLoading}
        />

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && (
          <>
            {allRows.length > 0 && (
              <div className="flex justify-end">
                <ReportExportButton
                  variant="outline"
                  filename={`ringkasan-pembelian-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}`}
                  sheetName="Ringkasan Pembelian"
                  headers={['Periode', 'Jumlah Tagihan', 'Subtotal', 'Pajak', 'Total']}
                  rows={() => allRows.map((r) => [r.period, toExcelNumber(r.bill_count), toExcelNumber(r.subtotal), toExcelNumber(r.tax), toExcelNumber(r.total)])}
                  formats={['text', 'number', 'currency', 'currency', 'currency']}
                />
              </div>
            )}

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jml Tagihan</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Subtotal</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pajak</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {pagedRows.map((row) => (
                    <tr key={row.period} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 font-medium text-[#334155]">{row.period}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{row.bill_count}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(row.subtotal)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(row.tax)}</td>
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
                      <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total ({allRows.length} periode)</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{report.totals.bill_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.subtotal)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.tax)}</td>
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
