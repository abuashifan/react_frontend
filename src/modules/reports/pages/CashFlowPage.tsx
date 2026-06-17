import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function CashFlowPage() {
  const [params, setParams] = useState<ReportParams>({ date_from: firstOfMonth, date_to: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'cash-flow', activeParams], queryFn: () => reportsApi.cashFlow(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const summary = report?.summary
  const accounts = report?.accounts ?? []
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Arus Kas" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Arus Kas' }]}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {report && report.no_cash_accounts && (
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-8 text-center text-[13px] text-[#64748b]">
            Belum ada akun kas/bank yang ditandai. Atur akun kas/bank di Bagan Akun terlebih dahulu.
          </div>
        )}
        {report && !report.no_cash_accounts && summary && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Awal</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kas Masuk</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kas Keluar</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Arus Kas Bersih</th>
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
                {accounts.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-[#94a3b8]">Tidak ada mutasi kas pada periode ini.</td></tr>
                )}
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
    </WorkspaceLayout>
  )
}
