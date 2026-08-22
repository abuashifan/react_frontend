import { useState, useMemo } from 'react'
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
import { exportCsv } from '@/lib/exportCsv'
import { SaveReportButton } from '../components/SaveReportButton'
import type { ColumnConfig } from '../types/reports.types'
import { useReportParams } from '../hooks/useReportParams'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

// Kolom mode ringkasan (Fase 14 — column selection).
const SUMMARY_COLUMNS: ColumnConfig[] = [
  { key: 'account_code', label: 'Kode' },
  { key: 'account_name', label: 'Akun' },
  { key: 'opening_balance', label: 'Saldo Awal' },
  { key: 'period_debit', label: 'Debit' },
  { key: 'period_credit', label: 'Kredit' },
  { key: 'ending_balance', label: 'Saldo Akhir' },
]

type LedgerMode = 'summary' | 'detail'

export default function GeneralLedgerPage() {
  const [searchParams] = useSearchParams()
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstOfMonth, end_date: today })
  const [mode, setMode] = useState<LedgerMode>(searchParams.get('mode') === 'detail' ? 'detail' : 'summary')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(SUMMARY_COLUMNS.map((c) => c.key))
  const showCol = (key: string) => visibleColumns.includes(key)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  // Dua query terpisah agar jalur ringkasan (rentan crash historis A13-232) tetap utuh
  // dan mode rincian bersifat aditif — masing-masing hanya aktif pada mode-nya.
  const summaryQuery = useQuery({
    queryKey: ['reports', 'general-ledger', 'summary', activeParams],
    queryFn: () => reportsApi.generalLedger(activeParams!),
    enabled: !!activeParams && mode === 'summary',
  })
  const detailQuery = useQuery({
    queryKey: ['reports', 'general-ledger', 'detail', activeParams],
    queryFn: () => reportsApi.generalLedgerDetail(activeParams!),
    enabled: !!activeParams && mode === 'detail',
  })

  const active = mode === 'detail' ? detailQuery : summaryQuery
  const { isLoading, isError, refetch } = active

  const summaryAccounts = useMemo(() => summaryQuery.data?.data.accounts ?? [], [summaryQuery.data])
  const detailAccounts = useMemo(() => detailQuery.data?.data.accounts ?? [], [detailQuery.data])
  const accounts = mode === 'detail' ? detailAccounts : summaryAccounts
  const hasReport = mode === 'detail' ? !!detailQuery.data : !!summaryQuery.data

  const pagedSummary = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return summaryAccounts.slice(start, start + pagination.pageSize)
  }, [summaryAccounts, pagination])

  const pagedDetail = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return detailAccounts.slice(start, start + pagination.pageSize)
  }, [detailAccounts, pagination])

  const handleSubmit = () => {
    setActiveParams({ ...params })
    setShowFilter(false)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const handleMode = (next: LedgerMode) => {
    setMode(next)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const viewToggle = (
    <div className="flex items-center gap-1 border-r border-[#e2e8f0] pr-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tampilan</span>
      <Button variant={mode === 'summary' ? 'default' : 'outline'} size="sm" className={mode === 'summary' ? 'h-7 bg-[#5c9ead] px-2.5 text-[12px] hover:bg-[#4a8a9b]' : 'h-7 px-2.5 text-[12px]'} onClick={() => handleMode('summary')}>Ringkasan</Button>
      <Button variant={mode === 'detail' ? 'default' : 'outline'} size="sm" className={mode === 'detail' ? 'h-7 bg-[#5c9ead] px-2.5 text-[12px] hover:bg-[#4a8a9b]' : 'h-7 px-2.5 text-[12px]'} onClick={() => handleMode('detail')}>Rincian</Button>
    </div>
  )

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={<ReportCompactBar
              params={activeParams ?? params}
              onOpenModal={() => setShowFilter(true)}
              columnSummary={mode === 'summary' ? `${visibleColumns.length} kolom` : undefined}
              actions={
                <>
                  {viewToggle}
                  {!isLoading && !isError && hasReport && (
                    <>
                      <SaveReportButton reportKey={mode === 'detail' ? 'general-ledger-detail' : 'general-ledger'} params={activeParams} />
                      {accounts.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[12px]"
                          onClick={() => exportCsv(
                            `buku-besar-${mode}-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
                            ['Kode', 'Akun', 'Saldo Awal', 'Debit Periode', 'Kredit Periode', 'Saldo Akhir'],
                            accounts.map((a) => [a.account_code, a.account_name, a.opening_balance, a.period_debit, a.period_credit, a.ending_balance])
                          )}
                        >
                          Export CSV
                        </Button>
                      )}
                    </>
                  )}
                </>
              }
            />}
    >
      <div className="space-y-4">
        {showFilter && <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} extras={{ include_zero_balance: true }} columns={mode === 'summary' ? SUMMARY_COLUMNS : undefined} visibleColumns={visibleColumns} onColumnsChange={setVisibleColumns} />}

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {/* Mode Ringkasan: saldo per akun */}
        {!isLoading && !isError && mode === 'summary' && hasReport && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  {showCol('account_code') && <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>}
                  {showCol('account_name') && <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun</th>}
                  {showCol('opening_balance') && <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Awal</th>}
                  {showCol('period_debit') && <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit</th>}
                  {showCol('period_credit') && <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>}
                  {showCol('ending_balance') && <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Akhir</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {pagedSummary.map((acc) => (
                  <tr key={acc.account_id} className="hover:bg-[#f8fafc]">
                    {showCol('account_code') && <td className="px-3 py-1.5 text-[#64748b]">{acc.account_code}</td>}
                    {showCol('account_name') && <td className="px-3 py-1.5 text-[#334155]">{acc.account_name}</td>}
                    {showCol('opening_balance') && <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(acc.opening_balance)}</td>}
                    {showCol('period_debit') && <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{acc.period_debit ? formatCurrency(acc.period_debit) : '-'}</td>}
                    {showCol('period_credit') && <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{acc.period_credit ? formatCurrency(acc.period_credit) : '-'}</td>}
                    {showCol('ending_balance') && <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(acc.ending_balance)}</td>}
                  </tr>
                ))}
                {summaryAccounts.length === 0 && (
                  <tr><td colSpan={visibleColumns.length} className="py-8 text-center text-[#94a3b8]">Tidak ada transaksi pada periode ini.</td></tr>
                )}
              </tbody>
            </table>
            {summaryAccounts.length > 0 && (
              <TablePagination pagination={pagination} totalRows={summaryAccounts.length} onChange={setPagination} isFetching={isLoading} />
            )}
          </div>
        )}

        {/* Mode Rincian: baris jurnal per akun */}
        {!isLoading && !isError && mode === 'detail' && hasReport && (
          <div className="space-y-3">
            {pagedDetail.map((acc) => (
              <div key={acc.account_id} className="overflow-auto rounded-lg border border-[#e2e8f0]">
                <div className="flex items-center justify-between bg-[#f8fafc] px-3 py-2">
                  <div className="text-[12px] font-semibold text-[#334155]">
                    <span className="text-[#64748b]">{acc.account_code}</span> · {acc.account_name}
                  </div>
                  <div className="text-[11px] text-[#64748b]">Saldo Akhir: <span className="tabular-nums font-semibold text-[#1e293b]">{formatCurrency(acc.ending_balance)}</span></div>
                </div>
                <table className="w-full text-[12px]">
                  <thead className="bg-white">
                    <tr className="border-b border-[#f1f5f9]">
                      <th className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No Jurnal</th>
                      <th className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                      <th className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</th>
                      <th className="px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit</th>
                      <th className="px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>
                      <th className="px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    <tr className="bg-[#fbfdfe]">
                      <td colSpan={5} className="px-3 py-1.5 text-[11px] italic text-[#94a3b8]">Saldo Awal</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(acc.opening_balance)}</td>
                    </tr>
                    {acc.lines.map((line, idx) => (
                      <tr key={`${line.journal_entry_id}-${idx}`} className="hover:bg-[#f8fafc]">
                        <td className="px-3 py-1.5 font-mono text-[11px] text-[#5c9ead]">{line.journal_number}</td>
                        <td className="px-3 py-1.5 tabular-nums text-[#64748b]">{line.journal_date}</td>
                        <td className="px-3 py-1.5 text-[#334155]">{line.description ?? '-'}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{line.debit ? formatCurrency(line.debit) : '-'}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{line.credit ? formatCurrency(line.credit) : '-'}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#1e293b]">{formatCurrency(line.running_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {detailAccounts.length === 0 && (
              <div className="rounded-lg border border-[#e2e8f0] py-8 text-center text-[#94a3b8]">Tidak ada transaksi pada periode ini.</div>
            )}
            {detailAccounts.length > 0 && (
              <TablePagination pagination={pagination} totalRows={detailAccounts.length} onChange={setPagination} isFetching={isLoading} />
            )}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
