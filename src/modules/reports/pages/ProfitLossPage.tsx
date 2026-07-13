import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { ReportPrintSection } from '../components/ReportPrintSection'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { SaveReportButton } from '../components/SaveReportButton'
import { useInitialReportParams } from '../hooks/useInitialReportParams'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function ProfitLossPage() {
  const { initialParams, restored } = useInitialReportParams({ start_date: firstOfMonth, end_date: today })
  const [params, setParams] = useState<ReportParams>(initialParams)
  const [activeParams, setActiveParams] = useState<ReportParams | null>(restored ? initialParams : null)
  const [showFilter, setShowFilter] = useState(!restored)

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'profit-loss', activeParams], queryFn: () => reportsApi.profitLoss(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const sections = report?.sections ?? []
  const net = report?.totals.net_profit_or_loss ?? 0
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }
  const paramLabel = `${activeParams?.start_date ? formatDate(activeParams.start_date) : '-'} — ${activeParams?.end_date ? formatDate(activeParams.end_date) : '-'}`

  return (
    <WorkspaceLayout title="Laba Rugi" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Laba Rugi' }]}>
      <div className="space-y-4">
        <div className="no-print">
          {showFilter ? <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} />
            : <ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} />}
        </div>
        {isLoading && <div className="no-print flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <div className="no-print"><ReportError onRetry={() => refetch()} /></div>}
        {!isLoading && !isError && report && (
          <ReportPrintToolbar
            extra={
              <>
                <SaveReportButton reportKey="profit-loss" params={activeParams} />
                {sections.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[12px]"
                    onClick={() => {
                      const rows = sections.flatMap((s) =>
                        s.accounts.map((a) => [s.label, a.account_code ?? '', a.account_name, a.amount])
                      )
                      rows.push(['', '', net >= 0 ? 'Laba Bersih' : 'Rugi Bersih', net])
                      exportCsv(`laba-rugi-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`, ['Seksi', 'Kode', 'Akun', 'Jumlah'], rows)
                    }}
                  >
                    Export CSV
                  </Button>
                )}
              </>
            }
          />
        )}
        {!isLoading && !isError && report && (
          <ReportPrintDocument title="Laba Rugi" paramLabel={paramLabel}>
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
