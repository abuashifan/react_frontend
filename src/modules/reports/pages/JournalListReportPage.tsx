import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { ReportExportButton } from '../components/ReportExportButton'
import { toExcelDate, toExcelNumber } from '@/lib/exportXlsx'
import type { JournalSource, ReportParams } from '../types/reports.types'
import { useReportParams } from '../hooks/useReportParams'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

const SOURCE_OPTIONS: { value: JournalSource; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'sales', label: 'Penjualan' },
  { value: 'purchase', label: 'Pembelian' },
  { value: 'inventory', label: 'Persediaan' },
  { value: 'general', label: 'Umum' },
]

function isSource(value: string | null): value is JournalSource {
  return value === 'all' || value === 'sales' || value === 'purchase' || value === 'inventory' || value === 'general'
}

export default function JournalListReportPage() {
  const [searchParams] = useSearchParams()
  const initialSource = searchParams.get('source')

  const [source, setSource] = useState<JournalSource>(isSource(initialSource) ? initialSource : 'all')
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams(
    { start_date: firstOfMonth, end_date: today },
    { autoRun: true },
  )
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const query = useMemo<ReportParams | null>(
    () => (activeParams ? { ...activeParams, source } : null),
    [activeParams, source],
  )

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'journals', query],
    queryFn: () => reportsApi.journalList(query!),
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

  const handleSource = (value: JournalSource) => {
    setSource(value)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={<ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} />}
    >
      <div className="space-y-4">
        {showFilter && (
          <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />
        )}

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sumber</span>
          {SOURCE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={source === opt.value ? 'default' : 'outline'}
              size="sm"
              className={source === opt.value ? 'h-7 bg-[#5c9ead] px-3 text-[12px] hover:bg-[#4a8a9b]' : 'h-7 px-3 text-[12px]'}
              onClick={() => handleSource(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && allRows.length > 0 && (
          <div className="flex justify-end">
            <ReportExportButton
              variant="outline"
              filename={`jurnal-${source}-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}`}
              sheetName="Jurnal"
              headers={['No Jurnal', 'Tanggal', 'Deskripsi', 'Sumber', 'No Sumber', 'Debit', 'Kredit']}
              rows={() => allRows.map((r) => [r.journal_number, toExcelDate(r.journal_date), r.description ?? '', r.source_module ?? '', r.source_number ?? '', toExcelNumber(r.total_debit), toExcelNumber(r.total_credit)])}
              formats={['text', 'date', 'text', 'text', 'text', 'currency', 'currency']}
            />
          </div>
        )}

        {!isLoading && !isError && report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No Jurnal</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sumber</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {pagedRows.map((r) => (
                  <tr key={r.journal_entry_id} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 font-mono text-[11px] text-[#5c9ead]">{r.journal_number}</td>
                    <td className="px-3 py-1.5 tabular-nums text-[#64748b]">{r.journal_date}</td>
                    <td className="px-3 py-1.5 text-[#334155]">{r.description ?? '-'}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">{r.source_number ? `${r.source_module ?? ''} · ${r.source_number}` : (r.source_module ?? '-')}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{r.total_debit ? formatCurrency(r.total_debit) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{r.total_credit ? formatCurrency(r.total_credit) : '-'}</td>
                  </tr>
                ))}
                {allRows.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-[#94a3b8]">Tidak ada jurnal pada periode ini.</td></tr>
                )}
              </tbody>
              {totals && allRows.length > 0 && (
                <tfoot className="border-t border-[#e2e8f0] bg-[#f8fafc]">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total ({totals.journal_count} jurnal)</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(totals.total_debit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(totals.total_credit)}</td>
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
