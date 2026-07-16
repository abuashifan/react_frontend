import { Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportToolButton } from '../components/ReportToolButton'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { ReportPrintSection } from '../components/ReportPrintSection'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { SaveReportButton } from '../components/SaveReportButton'
import { useReportParams } from '../hooks/useReportParams'
import { useReportFilterSummary } from '../hooks/useReportFilterSummary'

const today = new Date().toISOString().slice(0, 10)

export default function BalanceSheetPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ as_of_date: today })
  const filterSummary = useReportFilterSummary(activeParams)

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'balance-sheet', activeParams], queryFn: () => reportsApi.balanceSheet(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const sections = report?.sections ?? []
  const totals = report?.totals
  const assetSections = sections.filter((s) => s.key === 'asset' || s.key === 'accounts')
  const liabilitySections = sections.filter((s) => s.key === 'liability')
  const equitySections = sections.filter((s) => s.key === 'equity')
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  // Alat laporan menempel di filter bar supaya tidak memakai baris toolbar sendiri.
  const tools = !isLoading && !isError && report && totals ? (
    <ReportPrintToolbar
      extra={
        <>
          <SaveReportButton reportKey="balance-sheet" params={activeParams} />
          {sections.length > 0 && (
            <ReportToolButton icon={Download} label="Export CSV" onClick={() => {
                const rows = sections.flatMap((s) =>
                  s.accounts.map((a) => [s.label, a.account_code ?? '', a.account_name, a.amount])
                )
                exportCsv(`neraca-${activeParams?.as_of_date ?? ''}.csv`, ['Seksi', 'Kode', 'Akun', 'Jumlah'], rows)
              }} />
          )}
        </>
      }
    />
  ) : undefined

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={<ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} mode="as_of_date" actions={tools} />}
    >
      <div className="space-y-4">
        <div className="no-print">
          {showFilter && <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} dimensions={{ department: true, project: true }} />}
        </div>
        {isLoading && <div className="no-print flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <div className="no-print"><ReportError onRetry={() => refetch()} /></div>}
        {!isLoading && !isError && report && totals && (
          <>
            {!totals.is_balanced && (
              <div className="no-print rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700">
                ⚠ Neraca tidak seimbang — selisih: {formatCurrency(totals.difference)}
              </div>
            )}
            <ReportPrintDocument title="Neraca" paramLabel={`Per ${activeParams?.as_of_date ? formatDate(activeParams.as_of_date) : '-'}`} filterSummary={filterSummary}>
              <table className="w-full">
                <colgroup><col /><col className="w-36" /></colgroup>
                <tbody>
                  <tr className="report-print-avoid-break bg-[#1e293b]">
                    <td colSpan={2} className="px-2 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white">ASET</td>
                  </tr>
                  {assetSections.map((s) => <ReportPrintSection key={s.key} section={s} />)}
                  <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-2 py-1.5 text-[13px] font-bold text-[#1e293b]">TOTAL ASET</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-[13px] font-bold text-[#1e293b]">{formatCurrency(totals.total_assets)}</td>
                  </tr>

                  <tr className="report-print-avoid-break bg-[#1e293b]">
                    <td colSpan={2} className="px-2 py-1.5 pt-4 text-[12px] font-bold uppercase tracking-wide text-white">KEWAJIBAN & EKUITAS</td>
                  </tr>
                  {liabilitySections.map((s) => <ReportPrintSection key={s.key} section={s} />)}
                  <tr className="report-print-avoid-break border-t border-[#e2e8f0] bg-[#f0fdf4]">
                    <td className="px-2 py-1 text-[12px] font-semibold text-[#1e293b]">Total Kewajiban</td>
                    <td className="px-2 py-1 text-right tabular-nums text-[12px] font-semibold">{formatCurrency(totals.total_liabilities)}</td>
                  </tr>
                  {equitySections.map((s) => <ReportPrintSection key={s.key} section={s} />)}
                  <tr className="report-print-avoid-break border-t border-[#e2e8f0] bg-[#f0fdf4]">
                    <td className="px-2 py-1 text-[12px] font-semibold text-[#1e293b]">Total Ekuitas</td>
                    <td className="px-2 py-1 text-right tabular-nums text-[12px] font-semibold">{formatCurrency(totals.total_equity)}</td>
                  </tr>
                  <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-2 py-1.5 text-[13px] font-bold text-[#1e293b]">TOTAL KEWAJIBAN & EKUITAS</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-[13px] font-bold text-[#1e293b]">{formatCurrency(totals.total_liabilities_and_equity)}</td>
                  </tr>
                </tbody>
              </table>
            </ReportPrintDocument>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
