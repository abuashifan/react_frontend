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

export default function ApVendorSummaryPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ as_of_date: today })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'ap-vendor-summary', activeParams],
    queryFn: () => reportsApi.apVendorSummary({ as_of_date: activeParams?.as_of_date }),
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
      toolbar={<ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} mode="as_of_date" />}
    >
      <div className="space-y-4">
        {showFilter && <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} />}

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && (
          <>
            {allRows.length > 0 && (
              <div className="flex justify-end">
                <ReportExportButton
                  variant="outline"
                  filename={`ringkasan-hutang-${activeParams?.as_of_date ?? today}`}
                  sheetName="Ringkasan Supplier"
                  headers={['Supplier', 'Debit', 'Kredit', 'Saldo Hutang', 'Deposit Belum Dialokasikan', 'Net Exposure']}
                  rows={() => allRows.map((r) => [r.vendor_name, toExcelNumber(r.debit), toExcelNumber(r.credit), toExcelNumber(r.balance), toExcelNumber(r.unapplied_deposit_total), toExcelNumber(r.net_vendor_exposure)])}
                  formats={['text', 'currency', 'currency', 'currency', 'currency', 'currency']}
                />
              </div>
            )}

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Supplier</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Hutang</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deposit Belum Dialokasi</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Net Exposure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {pagedRows.map((row) => (
                    <tr key={row.vendor_id} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 text-[#334155]">{row.vendor_name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(row.debit)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(row.credit)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(row.balance)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{row.unapplied_deposit_total > 0 ? formatCurrency(row.unapplied_deposit_total) : '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(row.net_vendor_exposure)}</td>
                    </tr>
                  ))}
                  {allRows.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-[#94a3b8]">Tidak ada data hutang supplier.</td></tr>
                  )}
                </tbody>
                {allRows.length > 0 && (
                  <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <tr>
                      <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total ({allRows.length} supplier)</td>
                      <td colSpan={2} />
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.balance)}</td>
                      <td />
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.net_vendor_exposure)}</td>
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
