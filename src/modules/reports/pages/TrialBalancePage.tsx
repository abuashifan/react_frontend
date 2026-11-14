import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { TrialBalanceTable } from '../components/TrialBalanceTable'
import { reportsApi } from '../services/reportsApi'
import { formatDate } from '@/lib/utils'
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
          <ReportPrintDocument title="Neraca Saldo" paramLabel={paramLabel} filterSummary={['Dalam Rupiah', filterSummary].filter(Boolean).join(' · ')}>
            <TrialBalanceTable accounts={allAccounts} totals={totals} visibleColumns={visibleColumns} />
          </ReportPrintDocument>
        )}
      </div>
    </WorkspaceLayout>
  )
}
