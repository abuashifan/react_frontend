import { useMemo, useState } from 'react'
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
import { toExcelDate, toExcelNumber } from '@/lib/exportXlsx'
import { useReportParams } from '../hooks/useReportParams'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function OutputVatReportPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstOfMonth, end_date: today })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'output-vat', activeParams],
    queryFn: () => reportsApi.outputVat(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const rows = useMemo(() => report?.rows ?? [], [report])
  const totals = report?.totals

  const pagedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return rows.slice(start, start + pagination.pageSize)
  }, [rows, pagination])

  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false); setPagination((p) => ({ ...p, pageIndex: 0 })) }

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={<ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} />}
    >
      <div className="space-y-4">
        {showFilter && <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />}

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && rows.length > 0 && (
          <div className="flex justify-end">
            <ReportExportButton
              variant="outline"
              filename={`ppn-keluaran-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}`}
              sheetName="PPN Keluaran"
              headers={['No Faktur', 'Tanggal', 'Pelanggan', 'DPP', 'PPN', 'Total']}
              rows={() => rows.map((r) => [r.invoice_number, toExcelDate(r.invoice_date), r.customer_name ?? '', toExcelNumber(r.dpp), toExcelNumber(r.ppn), toExcelNumber(r.total)])}
              formats={['text', 'date', 'text', 'currency', 'currency', 'currency']}
            />
          </div>
        )}

        {!isLoading && !isError && report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No Faktur</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pelanggan</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">DPP</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">PPN</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {pagedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 font-mono text-[11px] text-[#5c9ead]">{r.invoice_number}</td>
                    <td className="px-3 py-1.5 tabular-nums text-[#64748b]">{r.invoice_date}</td>
                    <td className="px-3 py-1.5 text-[#334155]">{r.customer_name ?? '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">{formatCurrency(r.dpp)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">{formatCurrency(r.ppn)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(r.total)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-[#94a3b8]">Tidak ada faktur PPN keluaran pada periode ini.</td></tr>
                )}
              </tbody>
              {totals && rows.length > 0 && (
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total ({totals.invoice_count} faktur)</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(totals.dpp)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(totals.ppn)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(totals.total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {rows.length > 0 && <TablePagination pagination={pagination} totalRows={rows.length} onChange={setPagination} isFetching={isLoading} />}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
