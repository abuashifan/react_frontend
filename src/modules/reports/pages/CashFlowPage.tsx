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
import type { CashFlowSection } from '../types/reports.types'
import { useReportParams } from '../hooks/useReportParams'
import { useReportFilterSummary } from '../hooks/useReportFilterSummary'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

const SECTION_LABELS: Record<string, string> = {
  operating: 'Arus Kas Operasional',
  investing: 'Arus Kas Investasi',
  financing: 'Arus Kas Pendanaan',
  unclassified: 'Tidak Terklasifikasi',
}

function SectionRow({ label, section }: { label: string; section: CashFlowSection }) {
  return (
    <tr>
      <td className="px-2 py-0.5 pl-6 text-[12px] text-[#334155]">{label}</td>
      <td className="px-2 py-0.5 text-right tabular-nums text-[12px] text-green-700">{formatCurrency(section.cash_in)}</td>
      <td className="px-2 py-0.5 text-right tabular-nums text-[12px] text-red-600">{formatCurrency(section.cash_out)}</td>
      <td className={`px-2 py-0.5 text-right tabular-nums text-[12px] font-semibold ${section.net < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(section.net)}</td>
    </tr>
  )
}

export default function CashFlowPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ start_date: firstOfMonth, end_date: today })
  const filterSummary = useReportFilterSummary(activeParams)

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'cash-flow', activeParams], queryFn: () => reportsApi.cashFlow(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const summary = report?.summary
  const accounts = report?.accounts ?? []
  const sections = report?.sections
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }
  const paramLabel = `${activeParams?.start_date ? formatDate(activeParams.start_date) : '-'} — ${activeParams?.end_date ? formatDate(activeParams.end_date) : '-'}`

  const sectionOrder = ['operating', 'investing', 'financing', 'unclassified'] as const

  // Alat laporan menempel di filter bar supaya tidak memakai baris toolbar sendiri.
  const tools = !isLoading && !isError && report && !report.no_cash_accounts && summary ? (
    <ReportPrintToolbar
      extra={accounts.length > 0 && (
        <ReportToolButton icon={Download} label="Export CSV" onClick={() => exportCsv(
            `arus-kas-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
            ['Akun', 'Saldo Awal', 'Kas Masuk', 'Kas Keluar', 'Arus Bersih', 'Saldo Akhir'],
            accounts.map((a) => [a.account_name, a.opening_balance, a.cash_in, a.cash_out, a.net_cash_flow, a.ending_balance])
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
        {!isLoading && !isError && report && report.no_cash_accounts && (
          <div className="no-print rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-8 text-center text-[13px] text-[#64748b]">
            Belum ada akun kas/bank yang ditandai. Atur akun kas/bank di Bagan Akun terlebih dahulu.
          </div>
        )}
        {!isLoading && !isError && report && !report.no_cash_accounts && summary && (
          <ReportPrintDocument title="Arus Kas" paramLabel={paramLabel} filterSummary={filterSummary}>
            <div className="space-y-4">
              {/* Section breakdown table */}
              {sections && (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="report-print-avoid-break border-b border-[#cbd5e1]">
                      <th className="px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-[#334155]">Klasifikasi Arus Kas</th>
                      <th className="px-2 py-1 text-right text-[11px] font-bold uppercase tracking-wide text-[#334155]">Kas Masuk</th>
                      <th className="px-2 py-1 text-right text-[11px] font-bold uppercase tracking-wide text-[#334155]">Kas Keluar</th>
                      <th className="px-2 py-1 text-right text-[11px] font-bold uppercase tracking-wide text-[#334155]">Arus Bersih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionOrder.map((key) => {
                      const sec = sections[key]
                      if (!sec) return null
                      return <SectionRow key={key} label={SECTION_LABELS[key]} section={sec} />
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                      <td className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total Pergerakan Kas</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold text-green-700">{formatCurrency(summary.cash_in)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold text-red-600">{formatCurrency(summary.cash_out)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${summary.net_cash_flow < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.net_cash_flow)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* Summary KPIs */}
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

              {/* Per-account detail table */}
              {accounts.length > 0 && (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="report-print-avoid-break border-b border-[#cbd5e1]">
                      <th className="px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Awal</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kas Masuk</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kas Keluar</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Arus Bersih</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((a) => (
                      <tr key={a.account_id}>
                        <td className="px-2 py-0.5 text-[#1e293b]">{a.account_code} — {a.account_name}</td>
                        <td className="px-2 py-0.5 text-right tabular-nums">{formatCurrency(a.opening_balance)}</td>
                        <td className="px-2 py-0.5 text-right tabular-nums text-green-700">{a.cash_in ? formatCurrency(a.cash_in) : '-'}</td>
                        <td className="px-2 py-0.5 text-right tabular-nums text-red-600">{a.cash_out ? formatCurrency(a.cash_out) : '-'}</td>
                        <td className={`px-2 py-0.5 text-right tabular-nums font-medium ${a.net_cash_flow < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{formatCurrency(a.net_cash_flow)}</td>
                        <td className="px-2 py-0.5 text-right tabular-nums font-medium">{formatCurrency(a.ending_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                      <td className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold">{formatCurrency(summary.opening_cash_balance)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold text-green-700">{formatCurrency(summary.cash_in)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold text-red-600">{formatCurrency(summary.cash_out)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${summary.net_cash_flow < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.net_cash_flow)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold">{formatCurrency(summary.ending_cash_balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </ReportPrintDocument>
        )}
      </div>
    </WorkspaceLayout>
  )
}
