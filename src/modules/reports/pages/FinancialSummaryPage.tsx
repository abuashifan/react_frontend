import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { ReportExportButton } from '../components/ReportExportButton'
import { toExcelNumber } from '@/lib/exportXlsx'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useReportParams } from '../hooks/useReportParams'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

function KPICard({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const color = positive !== undefined ? (positive ? 'text-green-700' : 'text-red-600') : 'text-[#1e293b]'
  return (
    <div className="report-print-avoid-break rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className={`text-[18px] font-bold tabular-nums ${color}`}>{formatCurrency(value)}</p>
    </div>
  )
}

export default function FinancialSummaryPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstOfMonth, end_date: today })

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'financial-summary', activeParams], queryFn: () => reportsApi.financialSummary(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }
  const paramLabel = `${activeParams?.start_date ? formatDate(activeParams.start_date) : '-'} — ${activeParams?.end_date ? formatDate(activeParams.end_date) : '-'}`

  // Alat laporan menempel di filter bar supaya tidak memakai baris toolbar sendiri.
  const tools = !isLoading && !isError && report ? (
    <ReportPrintToolbar
      extra={
        <ReportExportButton
          filename={`ringkasan-keuangan-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}`}
          sheetName="Ringkasan Keuangan"
          headers={['Kelompok', 'Indikator', 'Jumlah']}
          rows={() => [
            ['Posisi Keuangan', 'Total Aset', toExcelNumber(report.balance_sheet.total_assets)],
            ['Posisi Keuangan', 'Total Kewajiban', toExcelNumber(report.balance_sheet.total_liabilities)],
            ['Posisi Keuangan', 'Total Ekuitas', toExcelNumber(report.balance_sheet.total_equity)],
            ['Posisi Keuangan', 'Laba/Rugi Tahun Berjalan', toExcelNumber(report.balance_sheet.current_year_profit_or_loss)],
            ['Kinerja Periode', 'Laba/Rugi Bersih', toExcelNumber(report.profit_loss.net_profit_or_loss)],
            ['Kinerja Periode', 'Arus Kas Bersih', toExcelNumber(report.cash_flow.cash_in - report.cash_flow.cash_out)],
            ['Kas', 'Saldo Kas Awal', toExcelNumber(report.cash_flow.opening_cash_balance)],
            ['Kas', 'Kas Masuk', toExcelNumber(report.cash_flow.cash_in)],
            ['Kas', 'Kas Keluar', toExcelNumber(report.cash_flow.cash_out)],
            ['Kas', 'Saldo Kas Akhir', toExcelNumber(report.cash_flow.ending_cash_balance)],
          ]}
          formats={['text', 'text', 'currency']}
        />
      }
    />
  ) : undefined

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={<ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} actions={tools} />}
    >
      <div className="space-y-4">
        <div className="no-print">
          {showFilter && <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />}
        </div>
        {isLoading && <div className="no-print flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <div className="no-print"><ReportError onRetry={() => refetch()} /></div>}
        {!isLoading && !isError && report && (
          <ReportPrintDocument title="Ringkasan Keuangan" paramLabel={paramLabel}>
            <div className="space-y-5">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Posisi Keuangan</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <KPICard label="Total Aset" value={report.balance_sheet.total_assets} />
                  <KPICard label="Total Kewajiban" value={report.balance_sheet.total_liabilities} />
                  <KPICard label="Total Ekuitas" value={report.balance_sheet.total_equity} />
                  <KPICard label="Laba/Rugi Tahun Berjalan" value={report.balance_sheet.current_year_profit_or_loss} positive={report.balance_sheet.current_year_profit_or_loss >= 0} />
                </div>
              </div>
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kinerja Periode</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <KPICard label="Laba/Rugi Bersih" value={report.profit_loss.net_profit_or_loss} positive={report.profit_loss.net_profit_or_loss >= 0} />
                  <KPICard label="Arus Kas Bersih" value={report.cash_flow.cash_in - report.cash_flow.cash_out} positive={report.cash_flow.cash_in - report.cash_flow.cash_out >= 0} />
                </div>
              </div>
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kas</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <KPICard label="Saldo Kas Awal" value={report.cash_flow.opening_cash_balance} />
                  <KPICard label="Kas Masuk" value={report.cash_flow.cash_in} />
                  <KPICard label="Kas Keluar" value={report.cash_flow.cash_out} />
                  <KPICard label="Saldo Kas Akhir" value={report.cash_flow.ending_cash_balance} />
                </div>
              </div>
            </div>
          </ReportPrintDocument>
        )}
      </div>
    </WorkspaceLayout>
  )
}
