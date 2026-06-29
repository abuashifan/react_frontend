import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { CashFlowSection, ReportParams } from '../types/reports.types'

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
    <tr className="hover:bg-[#f8fafc]">
      <td className="px-3 py-1.5 pl-6 text-[12px] text-[#334155]">{label}</td>
      <td className="px-3 py-1.5 text-right tabular-nums text-[12px] text-green-700">{formatCurrency(section.cash_in)}</td>
      <td className="px-3 py-1.5 text-right tabular-nums text-[12px] text-red-600">{formatCurrency(section.cash_out)}</td>
      <td className={`px-3 py-1.5 text-right tabular-nums text-[12px] font-semibold ${section.net < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(section.net)}</td>
    </tr>
  )
}

export default function CashFlowPage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfMonth, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'cash-flow', activeParams], queryFn: () => reportsApi.cashFlow(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const summary = report?.summary
  const accounts = report?.accounts ?? []
  const sections = report?.sections
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  const sectionOrder = ['operating', 'investing', 'financing', 'unclassified'] as const

  return (
    <WorkspaceLayout title="Arus Kas" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Arus Kas' }]}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}
        {!isLoading && !isError && report && report.no_cash_accounts && (
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-8 text-center text-[13px] text-[#64748b]">
            Belum ada akun kas/bank yang ditandai. Atur akun kas/bank di Bagan Akun terlebih dahulu.
          </div>
        )}
        {!isLoading && !isError && report && !report.no_cash_accounts && summary && accounts.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-[12px]"
              onClick={() => exportCsv(
                `arus-kas-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
                ['Akun', 'Saldo Awal', 'Kas Masuk', 'Kas Keluar', 'Arus Bersih', 'Saldo Akhir'],
                accounts.map((a) => [a.account_name, a.opening_balance, a.cash_in, a.cash_out, a.net_cash_flow, a.ending_balance])
              )}
            >
              Export CSV
            </Button>
          </div>
        )}
        {!isLoading && !isError && report && !report.no_cash_accounts && summary && (
          <div className="space-y-4">
            {/* Section breakdown table */}
            {sections && (
              <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#1e293b]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Klasifikasi Arus Kas</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Kas Masuk</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Kas Keluar</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Arus Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {sectionOrder.map((key) => {
                      const sec = sections[key]
                      if (!sec) return null
                      return <SectionRow key={key} label={SECTION_LABELS[key]} section={sec} />
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <tr>
                      <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total Pergerakan Kas</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-green-700">{formatCurrency(summary.cash_in)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-red-600">{formatCurrency(summary.cash_out)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-bold ${summary.net_cash_flow < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.net_cash_flow)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Summary KPIs */}
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

            {/* Per-account detail table */}
            {accounts.length > 0 && (
              <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Awal</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kas Masuk</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kas Keluar</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Arus Bersih</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {accounts.map((a) => (
                      <tr key={a.account_id} className="hover:bg-[#f8fafc]">
                        <td className="px-3 py-1.5 text-[#1e293b]">{a.account_code} — {a.account_name}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(a.opening_balance)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{a.cash_in ? formatCurrency(a.cash_in) : '-'}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{a.cash_out ? formatCurrency(a.cash_out) : '-'}</td>
                        <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${a.net_cash_flow < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{formatCurrency(a.net_cash_flow)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium">{formatCurrency(a.ending_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <tr>
                      <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(summary.opening_cash_balance)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-green-700">{formatCurrency(summary.cash_in)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-red-600">{formatCurrency(summary.cash_out)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-bold ${summary.net_cash_flow < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.net_cash_flow)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(summary.ending_cash_balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
