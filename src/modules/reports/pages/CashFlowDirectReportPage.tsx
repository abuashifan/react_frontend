import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
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

  return (
    <WorkspaceLayout title="Arus Kas (Metode Langsung)" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Arus Kas (Langsung)' }]}>
      <div className="space-y-4">
        {showFilter
          ? <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} />
          : <ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} />}

        <p className="text-[11px] text-[#94a3b8]">
          Metode langsung: penerimaan &amp; pembayaran kas aktual dirinci per akun lawan dan dikelompokkan
          ke aktivitas operasi/investasi/pendanaan berdasarkan klasifikasi arus kas akun.
        </p>

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && report.no_cash_accounts && (
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-8 text-center text-[13px] text-[#64748b]">
            Belum ada akun kas/bank yang ditandai. Atur akun kas/bank di Bagan Akun terlebih dahulu.
          </div>
        )}

        {!isLoading && !isError && report && !report.no_cash_accounts && summary && (
          <div className="space-y-4">
            {sections.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[12px]"
                  onClick={() => exportCsv(
                    `arus-kas-langsung-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
                    ['Aktivitas', 'Akun', 'Kas Masuk', 'Kas Keluar', 'Bersih'],
                    sections.flatMap((s) => s.lines.map((l) => [s.label, l.account_name, l.cash_in, l.cash_out, l.net]))
                  )}
                >
                  Export CSV
                </Button>
              </div>
            )}

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#1e293b]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Aktivitas / Akun</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Kas Masuk</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Kas Keluar</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {sections.map((section) => (
                    <Fragment key={section.key}>
                      <tr className="bg-[#f8fafc]">
                        <td className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]">{section.label}</td>
                        <td colSpan={2}></td>
                        <td className={`px-3 py-1.5 text-right tabular-nums font-bold ${section.subtotal_net < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(section.subtotal_net)}</td>
                      </tr>
                      {section.lines.map((line, i) => (
                        <tr key={`${section.key}-${line.account_id ?? i}`} className="hover:bg-[#f8fafc]">
                          <td className="px-3 py-1.5 pl-6 text-[#334155]">{line.account_code ? <span className="text-[#64748b]">{line.account_code} · </span> : null}{line.account_name}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{line.cash_in ? formatCurrency(line.cash_in) : '-'}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{line.cash_out ? formatCurrency(line.cash_out) : '-'}</td>
                          <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${line.net < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{formatCurrency(line.net)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                  {sections.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-[#94a3b8]">Tidak ada pergerakan kas pada periode ini.</td></tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Arus Kas Bersih</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-green-700">{formatCurrency(summary.cash_in)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-red-600">{formatCurrency(summary.cash_out)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-bold ${summary.net_cash_flow < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.net_cash_flow)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                <p className="text-[11px] text-[#64748b]">Saldo Awal Kas</p>
                <p className="text-[16px] font-semibold tabular-nums text-[#334155]">{formatCurrency(summary.opening_cash_balance)}</p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                <p className="text-[11px] text-[#64748b]">Arus Kas Bersih</p>
                <p className={`text-[16px] font-semibold tabular-nums ${summary.net_cash_flow < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.net_cash_flow)}</p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                <p className="text-[11px] text-[#64748b]">Saldo Akhir Kas</p>
                <p className="text-[16px] font-semibold tabular-nums text-[#1e293b]">{formatCurrency(summary.ending_cash_balance)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
