import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function CashFlowDirectReportPage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfMonth, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'cash-flow-direct', activeParams],
    queryFn: () => reportsApi.cashFlowDirect(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const summary = report?.summary
  const sections = report?.sections ?? []
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }
  const paramLabel = `${activeParams?.start_date ? formatDate(activeParams.start_date) : '-'} — ${activeParams?.end_date ? formatDate(activeParams.end_date) : '-'}`

  return (
    <WorkspaceLayout title="Arus Kas (Metode Langsung)" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Arus Kas (Langsung)' }]}>
      <div className="space-y-4">
        <div className="no-print">
          {showFilter
            ? <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} />
            : <ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} />}

          <p className="mt-2 text-[11px] text-[#94a3b8]">
            Metode langsung: penerimaan &amp; pembayaran kas aktual dirinci per akun lawan dan dikelompokkan
            ke aktivitas operasi/investasi/pendanaan berdasarkan klasifikasi arus kas akun.
          </p>
        </div>

        {isLoading && <div className="no-print flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <div className="no-print"><ReportError onRetry={() => refetch()} /></div>}

        {!isLoading && !isError && report && report.no_cash_accounts && (
          <div className="no-print rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-8 text-center text-[13px] text-[#64748b]">
            Belum ada akun kas/bank yang ditandai. Atur akun kas/bank di Bagan Akun terlebih dahulu.
          </div>
        )}

        {!isLoading && !isError && report && !report.no_cash_accounts && summary && (
          <ReportPrintToolbar
            extra={sections.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => exportCsv(
                  `arus-kas-langsung-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
                  ['Aktivitas', 'Akun', 'Kas Masuk', 'Kas Keluar', 'Bersih'],
                  sections.flatMap((s) => s.lines.map((l) => [s.label, l.account_name, l.cash_in, l.cash_out, l.net]))
                )}
              >
                Export CSV
              </Button>
            )}
          />
        )}

        {!isLoading && !isError && report && !report.no_cash_accounts && summary && (
          <ReportPrintDocument title="Arus Kas (Metode Langsung)" paramLabel={paramLabel}>
            <div className="space-y-4">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="report-print-avoid-break border-b border-[#cbd5e1]">
                    <th className="px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-[#334155]">Aktivitas / Akun</th>
                    <th className="px-2 py-1 text-right text-[11px] font-bold uppercase tracking-wide text-[#334155]">Kas Masuk</th>
                    <th className="px-2 py-1 text-right text-[11px] font-bold uppercase tracking-wide text-[#334155]">Kas Keluar</th>
                    <th className="px-2 py-1 text-right text-[11px] font-bold uppercase tracking-wide text-[#334155]">Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => (
                    <Fragment key={section.key}>
                      <tr className="report-print-avoid-break bg-[#f8fafc]">
                        <td className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#334155]">{section.label}</td>
                        <td colSpan={2}></td>
                        <td className={`px-2 py-1 text-right tabular-nums font-bold ${section.subtotal_net < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(section.subtotal_net)}</td>
                      </tr>
                      {section.lines.map((line, i) => (
                        <tr key={`${section.key}-${line.account_id ?? i}`}>
                          <td className="px-2 py-0.5 pl-6 text-[#334155]">{line.account_code ? <span className="text-[#64748b]">{line.account_code} · </span> : null}{line.account_name}</td>
                          <td className="px-2 py-0.5 text-right tabular-nums text-green-700">{line.cash_in ? formatCurrency(line.cash_in) : '-'}</td>
                          <td className="px-2 py-0.5 text-right tabular-nums text-red-600">{line.cash_out ? formatCurrency(line.cash_out) : '-'}</td>
                          <td className={`px-2 py-0.5 text-right tabular-nums font-medium ${line.net < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{formatCurrency(line.net)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                  {sections.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-[#94a3b8]">Tidak ada pergerakan kas pada periode ini.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Arus Kas Bersih</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-bold text-green-700">{formatCurrency(summary.cash_in)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-bold text-red-600">{formatCurrency(summary.cash_out)}</td>
                    <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${summary.net_cash_flow < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.net_cash_flow)}</td>
                  </tr>
                </tfoot>
              </table>

              <table className="report-print-avoid-break w-full text-[12px]">
                <tbody>
                  <tr>
                    <td className="px-2 py-1 text-[#334155]">Saldo Awal Kas</td>
                    <td className="px-2 py-1 text-right tabular-nums font-semibold text-[#334155]">{formatCurrency(summary.opening_cash_balance)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-[#334155]">Arus Kas Bersih</td>
                    <td className={`px-2 py-1 text-right tabular-nums font-semibold ${summary.net_cash_flow < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.net_cash_flow)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-[#334155]">Saldo Akhir Kas</td>
                    <td className="px-2 py-1 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(summary.ending_cash_balance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ReportPrintDocument>
        )}
      </div>
    </WorkspaceLayout>
  )
}
