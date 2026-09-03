import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { ReportPrintSection } from '../components/ReportPrintSection'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ReportExportButton } from '../components/ReportExportButton'
import { toExcelNumber, type XlsxCell } from '@/lib/exportXlsx'
import { SaveReportButton } from '../components/SaveReportButton'
import { useReportParams } from '../hooks/useReportParams'
import { useReportFilterSummary } from '../hooks/useReportFilterSummary'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function ProfitLossPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstOfMonth, end_date: today })
  const filterSummary = useReportFilterSummary(activeParams)

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'profit-loss', activeParams], queryFn: () => reportsApi.profitLoss(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const sections = report?.sections ?? []
  const net = report?.totals.net_profit_or_loss ?? 0
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }
  const paramLabel = `${activeParams?.start_date ? formatDate(activeParams.start_date) : '-'} — ${activeParams?.end_date ? formatDate(activeParams.end_date) : '-'}`

  // Alat laporan menempel di filter bar supaya tidak memakai baris toolbar sendiri.
  const tools = !isLoading && !isError && report ? (
    <ReportPrintToolbar
      extra={
        <>
          <SaveReportButton reportKey="profit-loss" params={activeParams} />
          {sections.length > 0 && (
            <ReportExportButton
              filename={`laba-rugi-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}`}
              sheetName="Laba Rugi"
              headers={['Seksi', 'Kode', 'Akun', 'Jumlah']}
              rows={() => {
                // Subtotal per seksi ikut ditulis — lihat alasannya di Neraca.
                const rows: XlsxCell[][] = sections.flatMap((s) => [
                  ...s.accounts.map((a) => [s.label, a.account_code ?? '', a.account_name, toExcelNumber(a.amount)]),
                  [s.label, '', `Total ${s.label}`, toExcelNumber(s.total)],
                ])
                rows.push(['', '', net >= 0 ? 'Laba Bersih' : 'Rugi Bersih', toExcelNumber(net)])
                return rows
              }}
              formats={['text', 'text', 'text', 'currency']}
            />
          )}
        </>
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
          {showFilter && <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} />}
        </div>
        {isLoading && <div className="no-print flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <div className="no-print"><ReportError onRetry={() => refetch()} /></div>}
        {!isLoading && !isError && report && (
          <ReportPrintDocument title="Laba Rugi" paramLabel={paramLabel} filterSummary={filterSummary}>
            <table className="w-full">
              <colgroup><col /><col className="w-40" /></colgroup>
              <tbody>
                {sections.map((section) => <ReportPrintSection key={section.key} section={section} />)}
                {sections.length === 0 && (
                  <tr><td colSpan={2} className="px-2 py-8 text-center text-[12px] text-[#94a3b8]">Tidak ada data laba rugi pada periode ini.</td></tr>
                )}
                <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <td className="px-2 py-2 text-[14px] font-bold text-[#1e293b]">{net >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}</td>
                  <td className={`px-2 py-2 text-right tabular-nums text-[14px] font-bold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(net)}</td>
                </tr>
              </tbody>
            </table>
          </ReportPrintDocument>
        )}
      </div>
    </WorkspaceLayout>
  )
}
