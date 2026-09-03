import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ReportExportButton } from '../components/ReportExportButton'
import { toExcelNumber, type XlsxCell, type XlsxFormat } from '@/lib/exportXlsx'
import { SaveReportButton } from '../components/SaveReportButton'
import type { ColumnConfig, TrialBalanceAccount } from '../types/reports.types'
import { useReportParams } from '../hooks/useReportParams'
import { useReportFilterSummary } from '../hooks/useReportFilterSummary'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

// Kolom Neraca Saldo (Fase 14 — column selection).
const TB_COLUMNS: ColumnConfig[] = [
  { key: 'account_code', label: 'Kode' },
  { key: 'account_name', label: 'Akun' },
  { key: 'opening_debit', label: 'Debit Awal' },
  { key: 'opening_credit', label: 'Kredit Awal' },
  { key: 'period_debit', label: 'Debit Periode' },
  { key: 'period_credit', label: 'Kredit Periode' },
  { key: 'ending_debit', label: 'Debit Akhir' },
  { key: 'ending_credit', label: 'Kredit Akhir' },
]

/**
 * Cara mengambil nilai tiap kolom untuk file ekspor.
 *
 * Dipisah dari JSX tabel supaya file mengikuti kolom yang SEDANG dicentang user
 * — versi CSV lama selalu menulis kedelapan kolom apa pun pilihannya, sehingga
 * file tidak pernah cocok dengan yang dilihat di layar.
 */
const TB_EXPORT: Record<string, { format: XlsxFormat; value: (a: TrialBalanceAccount) => XlsxCell }> = {
  account_code: { format: 'text', value: (a) => a.account_code },
  account_name: { format: 'text', value: (a) => a.account_name },
  opening_debit: { format: 'currency', value: (a) => toExcelNumber(a.opening_debit) },
  opening_credit: { format: 'currency', value: (a) => toExcelNumber(a.opening_credit) },
  period_debit: { format: 'currency', value: (a) => toExcelNumber(a.period_debit) },
  period_credit: { format: 'currency', value: (a) => toExcelNumber(a.period_credit) },
  ending_debit: { format: 'currency', value: (a) => toExcelNumber(a.ending_debit) },
  ending_credit: { format: 'currency', value: (a) => toExcelNumber(a.ending_credit) },
}

export default function TrialBalancePage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstOfMonth, end_date: today })
  const filterSummary = useReportFilterSummary(activeParams)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(TB_COLUMNS.map((c) => c.key))
  const showCol = (key: string) => visibleColumns.includes(key)
  // Urutan kolom ekspor mengikuti TB_COLUMNS, bukan urutan klik user di modal.
  const exportColumns = TB_COLUMNS.filter((c) => visibleColumns.includes(c.key))

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'trial-balance', activeParams],
    queryFn: () => reportsApi.trialBalance(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const allAccounts = useMemo(() => report?.accounts ?? [], [report])
  const totals = report?.totals
  const paramLabel = `${activeParams?.start_date ? formatDate(activeParams.start_date) : '-'} — ${activeParams?.end_date ? formatDate(activeParams.end_date) : '-'}`

  const handleSubmit = () => {
    setActiveParams({ ...params })
    setShowFilter(false)
  }

  // Alat laporan menempel di filter bar supaya tidak memakai baris toolbar sendiri.
  const tools = !isLoading && !isError && report ? (
    <ReportPrintToolbar
      extra={
        <>
          <SaveReportButton reportKey="trial-balance" params={activeParams} />
          {allAccounts.length > 0 && (
            <ReportExportButton
              filename={`neraca-saldo-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}`}
              sheetName="Neraca Saldo"
              headers={exportColumns.map((c) => c.label)}
              rows={() => allAccounts.map((a) => exportColumns.map((c) => TB_EXPORT[c.key].value(a)))}
              formats={exportColumns.map((c) => TB_EXPORT[c.key].format)}
            />
          )}
        </>
      }
    />
  ) : undefined

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={<ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} columnSummary={`${visibleColumns.length} kolom`} actions={tools} />}
    >
      <div className="space-y-4">
        <div className="no-print">
          {showFilter && <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} extras={{ include_zero_balance: true }} columns={TB_COLUMNS} visibleColumns={visibleColumns} onColumnsChange={setVisibleColumns} />}
        </div>
        {isLoading && <div className="no-print flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <div className="no-print"><ReportError onRetry={() => refetch()} /></div>}
        {!isLoading && !isError && report && (
          <ReportPrintDocument title="Neraca Saldo" paramLabel={paramLabel} filterSummary={filterSummary}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="report-print-avoid-break border-b border-[#cbd5e1]">
                  {showCol('account_code') && <th className="px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>}
                  {showCol('account_name') && <th className="px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun</th>}
                  {showCol('opening_debit') && <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit Awal</th>}
                  {showCol('opening_credit') && <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit Awal</th>}
                  {showCol('period_debit') && <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit Periode</th>}
                  {showCol('period_credit') && <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit Periode</th>}
                  {showCol('ending_debit') && <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit Akhir</th>}
                  {showCol('ending_credit') && <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit Akhir</th>}
                </tr>
              </thead>
              <tbody>
                {allAccounts.map((l) => (
                  <tr key={l.account_id}>
                    {showCol('account_code') && <td className="px-2 py-0.5 text-[#64748b]">{l.account_code}</td>}
                    {showCol('account_name') && <td className="px-2 py-0.5 text-[#1e293b]">{l.account_name}</td>}
                    {showCol('opening_debit') && <td className="px-2 py-0.5 text-right tabular-nums">{l.opening_debit ? formatCurrency(l.opening_debit) : '-'}</td>}
                    {showCol('opening_credit') && <td className="px-2 py-0.5 text-right tabular-nums">{l.opening_credit ? formatCurrency(l.opening_credit) : '-'}</td>}
                    {showCol('period_debit') && <td className="px-2 py-0.5 text-right tabular-nums">{l.period_debit ? formatCurrency(l.period_debit) : '-'}</td>}
                    {showCol('period_credit') && <td className="px-2 py-0.5 text-right tabular-nums">{l.period_credit ? formatCurrency(l.period_credit) : '-'}</td>}
                    {showCol('ending_debit') && <td className="px-2 py-0.5 text-right tabular-nums font-medium">{l.ending_debit ? formatCurrency(l.ending_debit) : '-'}</td>}
                    {showCol('ending_credit') && <td className="px-2 py-0.5 text-right tabular-nums font-medium">{l.ending_credit ? formatCurrency(l.ending_credit) : '-'}</td>}
                  </tr>
                ))}
                {allAccounts.length === 0 && (
                  <tr><td colSpan={visibleColumns.length} className="py-8 text-center text-[#94a3b8]">Tidak ada saldo akun pada periode ini.</td></tr>
                )}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    {(showCol('account_code') || showCol('account_name')) && (
                      <td colSpan={['account_code', 'account_name'].filter(showCol).length} className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                    )}
                    {showCol('opening_debit') && <td className="px-2 py-1.5 text-right tabular-nums font-bold">{formatCurrency(totals.opening_debit)}</td>}
                    {showCol('opening_credit') && <td className="px-2 py-1.5 text-right tabular-nums font-bold">{formatCurrency(totals.opening_credit)}</td>}
                    {showCol('period_debit') && <td className="px-2 py-1.5 text-right tabular-nums font-bold">{formatCurrency(totals.period_debit)}</td>}
                    {showCol('period_credit') && <td className="px-2 py-1.5 text-right tabular-nums font-bold">{formatCurrency(totals.period_credit)}</td>}
                    {showCol('ending_debit') && <td className="px-2 py-1.5 text-right tabular-nums font-bold">{formatCurrency(totals.ending_debit)}</td>}
                    {showCol('ending_credit') && <td className="px-2 py-1.5 text-right tabular-nums font-bold">{formatCurrency(totals.ending_credit)}</td>}
                  </tr>
                  {!totals.is_balanced && (
                    <tr>
                      <td colSpan={visibleColumns.length} className="px-2 py-1.5 text-[12px] font-medium text-red-600">
                        ⚠ Tidak seimbang — selisih: {formatCurrency(totals.difference)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              )}
            </table>
          </ReportPrintDocument>
        )}
      </div>
    </WorkspaceLayout>
  )
}
