import { Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportToolButton } from '../components/ReportToolButton'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { useReportParams } from '../hooks/useReportParams'
import { useReportFilterSummary } from '../hooks/useReportFilterSummary'

const today = new Date().toISOString().slice(0, 10)
const firstOfYear = today.slice(0, 4) + '-01-01'

export default function EquityChangesReportPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstOfYear, end_date: today })
  const filterSummary = useReportFilterSummary(activeParams)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'equity-changes', activeParams],
    queryFn: () => reportsApi.equityChanges(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const rows = report?.rows ?? []
  const totals = report?.totals
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }
  const paramLabel = `${activeParams?.start_date ? formatDate(activeParams.start_date) : '-'} — ${activeParams?.end_date ? formatDate(activeParams.end_date) : '-'}`

  // Alat laporan menempel di filter bar supaya tidak memakai baris toolbar sendiri.
  const tools = !isLoading && !isError && report ? (
    <ReportPrintToolbar
      extra={rows.length > 0 && (
        <ReportToolButton icon={Download} label="Export CSV" onClick={() => exportCsv(
            `perubahan-ekuitas-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
            ['Akun', 'Saldo Awal', 'Pergerakan', 'Saldo Akhir'],
            rows.map((r) => [r.account_name, r.opening_balance, r.movement, r.closing_balance])
          )} />
      )}
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
          <ReportPrintDocument title="Perubahan Ekuitas" paramLabel={paramLabel} filterSummary={filterSummary}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="report-print-avoid-break border-b border-[#cbd5e1]">
                  <th className="px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Komponen Ekuitas</th>
                  <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Awal</th>
                  <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pergerakan</th>
                  <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.account_id ?? `earn-${i}`}>
                    <td className={`px-2 py-0.5 ${r.is_current_earnings ? 'italic text-[#64748b]' : 'text-[#334155]'}`}>
                      {r.account_code ? <span className="text-[#64748b]">{r.account_code} · </span> : null}{r.account_name}
                    </td>
                    <td className="px-2 py-0.5 text-right tabular-nums text-[#64748b]">{formatCurrency(r.opening_balance)}</td>
                    <td className={`px-2 py-0.5 text-right tabular-nums font-medium ${r.movement < 0 ? 'text-red-600' : r.movement > 0 ? 'text-green-700' : 'text-[#64748b]'}`}>{formatCurrency(r.movement)}</td>
                    <td className="px-2 py-0.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(r.closing_balance)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-[#94a3b8]">Tidak ada data ekuitas pada periode ini.</td></tr>
                )}
              </tbody>
              {totals && rows.length > 0 && (
                <tfoot>
                  <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total Ekuitas</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(totals.opening_total)}</td>
                    <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${totals.movement_total < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{formatCurrency(totals.movement_total)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(totals.closing_total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </ReportPrintDocument>
        )}
      </div>
    </WorkspaceLayout>
  )
}
