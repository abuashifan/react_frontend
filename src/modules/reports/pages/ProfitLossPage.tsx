import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams, ReportSection } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

function PLSection({ section }: { section: ReportSection }) {
  return (
    <>
      <tr className="bg-[#f8fafc]">
        <td colSpan={2} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{section.label}</td>
      </tr>
      {section.accounts.map((item, i) => (
        <tr key={item.account_id ?? i} className="hover:bg-[#f8fafc]/50">
          <td className="px-3 py-1 pl-6 text-[12px] text-[#334155]">{item.account_code ? `${item.account_code} — ` : ''}{item.account_name}</td>
          <td className="px-3 py-1 text-right tabular-nums text-[12px] text-[#334155]">{formatCurrency(item.amount)}</td>
        </tr>
      ))}
      {section.accounts.length === 0 && (
        <tr><td colSpan={2} className="px-3 py-1 pl-6 text-[12px] text-[#94a3b8]">Tidak ada akun.</td></tr>
      )}
      <tr className="border-t border-[#e2e8f0]">
        <td className="px-3 py-1.5 pl-6 text-[12px] font-semibold text-[#1e293b]">Total {section.label}</td>
        <td className="px-3 py-1.5 text-right tabular-nums text-[12px] font-semibold text-[#1e293b]">{formatCurrency(section.total)}</td>
      </tr>
    </>
  )
}

export default function ProfitLossPage() {
  const [params, setParams] = useState<ReportParams>({ date_from: firstOfMonth, date_to: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'profit-loss', activeParams], queryFn: () => reportsApi.profitLoss(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const sections = report?.sections ?? []
  const net = report?.totals.net_profit_or_loss ?? 0
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Laba Rugi" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Laba Rugi' }]}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full">
              <colgroup><col /><col className="w-40" /></colgroup>
              <tbody className="divide-y divide-[#f1f5f9]">
                {sections.map((section) => <PLSection key={section.key} section={section} />)}
                {sections.length === 0 && (
                  <tr><td colSpan={2} className="px-3 py-8 text-center text-[12px] text-[#94a3b8]">Tidak ada data laba rugi pada periode ini.</td></tr>
                )}
                <tr className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <td className="px-3 py-2.5 text-[14px] font-bold text-[#1e293b]">{net >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums text-[14px] font-bold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(net)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
