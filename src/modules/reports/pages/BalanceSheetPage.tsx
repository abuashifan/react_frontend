import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileDown } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { reportsApi } from '../services/reportsApi'
import { useReportExport } from '../hooks/useReportExport'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams, BalanceSheetSection } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)

function BSSection({ section, accent = false }: { section: BalanceSheetSection; accent?: boolean }) {
  return (
    <>
      <tr className={accent ? 'bg-[#f0fdf4]' : 'bg-[#f8fafc]'}>
        <td colSpan={2} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{section.title}</td>
      </tr>
      {section.items.map((item, i) => (
        <tr key={i} className="hover:bg-[#f8fafc]/50">
          <td className="px-3 py-1 pl-6 text-[12px] text-[#334155]" style={{ paddingLeft: `${(item.level ?? 1) * 16 + 12}px` }}>{item.account_code ? `${item.account_code} — ` : ''}{item.account_name}</td>
          <td className="px-3 py-1 text-right tabular-nums text-[12px] text-[#334155]">{formatCurrency(item.amount)}</td>
        </tr>
      ))}
      <tr className="border-t border-[#e2e8f0]">
        <td className="px-3 py-1.5 pl-6 text-[12px] font-semibold text-[#1e293b]">Total {section.title}</td>
        <td className="px-3 py-1.5 text-right tabular-nums text-[12px] font-semibold text-[#1e293b]">{formatCurrency(section.total)}</td>
      </tr>
    </>
  )
}

export default function BalanceSheetPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const { exportPdf, exportExcel, isExportingPdf, isExportingExcel } = useReportExport('balance-sheet')

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'balance-sheet', activeParams], queryFn: () => reportsApi.balanceSheet(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Neraca" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Neraca' }]}
      action={activeParams && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void exportPdf(activeParams)} disabled={isExportingPdf}><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void exportExcel(activeParams)} disabled={isExportingExcel}><FileDown className="mr-1 h-3.5 w-3.5" /> Excel</Button>
        </div>
      )}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} mode="as_of_date" />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {report && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* ASET */}
            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full">
                <colgroup><col /><col className="w-36" /></colgroup>
                <thead className="bg-[#1e293b]"><tr><th colSpan={2} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">ASET</th></tr></thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  <BSSection section={report.assets.current_assets} />
                  <BSSection section={report.assets.non_current_assets} />
                  <tr className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-3 py-2 text-[13px] font-bold text-[#1e293b]">TOTAL ASET</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[13px] font-bold text-[#1e293b]">{formatCurrency(report.assets.total_assets)}</td>
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
                  <BSSection section={report.liabilities.current_liabilities} accent />
                  <BSSection section={report.liabilities.non_current_liabilities} accent />
                  <tr className="border-t border-[#e2e8f0] bg-[#f0fdf4]">
                    <td className="px-3 py-1.5 text-[12px] font-semibold text-[#1e293b]">Total Kewajiban</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[12px] font-semibold">{formatCurrency(report.liabilities.total_liabilities)}</td>
                  </tr>
                  <tr className="bg-[#f8fafc]"><td colSpan={2} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Ekuitas</td></tr>
                  {report.equity.items.map((item, i) => (
                    <tr key={i}><td className="px-3 py-1 pl-6 text-[12px] text-[#334155]">{item.account_name}</td><td className="px-3 py-1 text-right tabular-nums text-[12px]">{formatCurrency(item.amount)}</td></tr>
                  ))}
                  <tr className="border-t border-[#e2e8f0]"><td className="px-3 py-1.5 pl-6 text-[12px] font-semibold text-[#1e293b]">Total Ekuitas</td><td className="px-3 py-1.5 text-right tabular-nums text-[12px] font-semibold">{formatCurrency(report.equity.total_equity)}</td></tr>
                  <tr className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-3 py-2 text-[13px] font-bold text-[#1e293b]">TOTAL KEWAJIBAN & EKUITAS</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[13px] font-bold text-[#1e293b]">{formatCurrency(report.total_liabilities_and_equity)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
