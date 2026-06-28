import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams, ReportSection } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)

function BSSection({ section }: { section: ReportSection }) {
  return (
    <>
      <tr className="bg-[#f8fafc]">
        <td colSpan={2} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{section.label}</td>
      </tr>
      {section.accounts.map((item, i) => (
        <tr key={item.account_id ?? `sys-${i}`} className="hover:bg-[#f8fafc]/50">
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

export default function BalanceSheetPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'balance-sheet', activeParams], queryFn: () => reportsApi.balanceSheet(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const sections = report?.sections ?? []
  const totals = report?.totals
  const assetSections = sections.filter((s) => s.key === 'asset' || s.key === 'accounts')
  const liabilitySections = sections.filter((s) => s.key === 'liability')
  const equitySections = sections.filter((s) => s.key === 'equity')
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Neraca" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Neraca' }]}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} dimensions={{ department: true, project: true }} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} mode="as_of_date" />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}
        {!isLoading && !isError && report && totals && (
          <div className="space-y-3">
          {!totals.is_balanced && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700">
              ⚠ Neraca tidak seimbang — selisih: {formatCurrency(totals.difference)}
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* ASET */}
            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full">
                <colgroup><col /><col className="w-36" /></colgroup>
                <thead className="bg-[#1e293b]"><tr><th colSpan={2} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">ASET</th></tr></thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {assetSections.map((s) => <BSSection key={s.key} section={s} />)}
                  <tr className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-3 py-2 text-[13px] font-bold text-[#1e293b]">TOTAL ASET</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[13px] font-bold text-[#1e293b]">{formatCurrency(totals.total_assets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* KEWAJIBAN & EKUITAS */}
            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full">
                <colgroup><col /><col className="w-36" /></colgroup>
                <thead className="bg-[#1e293b]"><tr><th colSpan={2} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">KEWAJIBAN & EKUITAS</th></tr></thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {liabilitySections.map((s) => <BSSection key={s.key} section={s} />)}
                  <tr className="border-t border-[#e2e8f0] bg-[#f0fdf4]">
                    <td className="px-3 py-1.5 text-[12px] font-semibold text-[#1e293b]">Total Kewajiban</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[12px] font-semibold">{formatCurrency(totals.total_liabilities)}</td>
                  </tr>
                  {equitySections.map((s) => <BSSection key={s.key} section={s} />)}
                  <tr className="border-t border-[#e2e8f0] bg-[#f0fdf4]">
                    <td className="px-3 py-1.5 text-[12px] font-semibold text-[#1e293b]">Total Ekuitas</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[12px] font-semibold">{formatCurrency(totals.total_equity)}</td>
                  </tr>
                  <tr className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-3 py-2 text-[13px] font-bold text-[#1e293b]">TOTAL KEWAJIBAN & EKUITAS</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[13px] font-bold text-[#1e293b]">{formatCurrency(totals.total_liabilities_and_equity)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
