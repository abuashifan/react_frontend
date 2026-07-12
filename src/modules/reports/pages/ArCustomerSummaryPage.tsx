import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
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

export default function ArCustomerSummaryPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'ar-customer-summary', activeParams],
    queryFn: () => reportsApi.arCustomerSummary({ as_of_date: activeParams?.as_of_date }),
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
      title="Ringkasan Piutang Pelanggan"
      breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Piutang', path: '/reports/ar' }, { label: 'Ringkasan Pelanggan' }]}
    >
      <div className="space-y-4">
        {showFilter
          ? <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} />
          : <ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} mode="as_of_date" />}

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
                    `ringkasan-piutang-${activeParams?.as_of_date ?? today}.csv`,
                    ['Pelanggan', 'Debit', 'Kredit', 'Saldo Piutang', 'Deposit Belum Dialokasikan', 'Net Exposure'],
                    allRows.map((r) => [r.customer_name, r.debit, r.credit, r.balance, r.unapplied_deposit_total, r.net_customer_exposure]),
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
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pelanggan</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Piutang</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deposit Belum Dialokasi</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Net Exposure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {pagedRows.map((row) => (
                    <tr key={row.customer_id} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 text-[#334155]">{row.customer_name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(row.debit)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(row.credit)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(row.balance)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{row.unapplied_deposit_total > 0 ? formatCurrency(row.unapplied_deposit_total) : '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(row.net_customer_exposure)}</td>
                    </tr>
                  ))}
                  {allRows.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-[#94a3b8]">Tidak ada data piutang pelanggan.</td></tr>
                  )}
                </tbody>
                {allRows.length > 0 && (
                  <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <tr>
                      <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total ({allRows.length} pelanggan)</td>
                      <td colSpan={2} />
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.balance)}</td>
                      <td />
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.net_customer_exposure)}</td>
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
