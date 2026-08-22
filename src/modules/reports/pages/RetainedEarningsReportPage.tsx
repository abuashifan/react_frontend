import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useReportParams } from '../hooks/useReportParams'
import { useReportFilterSummary } from '../hooks/useReportFilterSummary'

const today = new Date().toISOString().slice(0, 10)
const firstOfYear = today.slice(0, 4) + '-01-01'

export default function RetainedEarningsReportPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstOfYear, end_date: today })
  const filterSummary = useReportFilterSummary(activeParams)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'retained-earnings', activeParams],
    queryFn: () => reportsApi.retainedEarnings(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }
  const paramLabel = `${activeParams?.start_date ? formatDate(activeParams.start_date) : '-'} — ${activeParams?.end_date ? formatDate(activeParams.end_date) : '-'}`

  // Alat laporan menempel di filter bar supaya tidak memakai baris toolbar sendiri.
  const tools = !isLoading && !isError && report ? <ReportPrintToolbar /> : undefined

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
          <ReportPrintDocument title="Laba Ditahan" paramLabel={paramLabel} filterSummary={filterSummary}>
            <table className="w-full text-[13px]">
              <tbody>
                <tr>
                  <td className="px-2 py-1.5 text-[#334155]">Laba Ditahan Awal Periode</td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium text-[#334155]">{formatCurrency(report.beginning_retained_earnings)}</td>
                </tr>
                <tr>
                  <td className="px-2 py-1.5 text-[#334155]">Laba / Rugi Periode Berjalan</td>
                  <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${report.net_income < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(report.net_income)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <td className="px-2 py-1.5 text-[13px] font-bold uppercase tracking-wide text-[#334155]">Laba Ditahan Akhir Periode</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-[15px] font-bold text-[#1e293b]">{formatCurrency(report.ending_retained_earnings)}</td>
                </tr>
              </tfoot>
            </table>
          </ReportPrintDocument>
        )}
      </div>
    </WorkspaceLayout>
  )
}
