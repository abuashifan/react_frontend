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
import type { ReportParams, CashFlowSection } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

function CFSection({ section }: { section: CashFlowSection }) {
  return (
    <>
      <tr className="bg-[#f8fafc]"><td colSpan={2} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{section.title}</td></tr>
      {section.items.map((item, i) => (
        <tr key={i} className="hover:bg-[#f8fafc]/50">
          <td className="px-3 py-1 pl-6 text-[12px] text-[#334155]">{item.label}</td>
          <td className={`px-3 py-1 text-right tabular-nums text-[12px] ${item.amount < 0 ? 'text-red-600' : 'text-[#334155]'}`}>{formatCurrency(item.amount)}</td>
        </tr>
      ))}
      <tr className="border-t border-[#e2e8f0]">
        <td className="px-3 py-1.5 pl-6 text-[12px] font-semibold text-[#1e293b]">Total {section.title}</td>
        <td className={`px-3 py-1.5 text-right tabular-nums text-[12px] font-semibold ${section.total < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(section.total)}</td>
      </tr>
    </>
  )
}

export default function CashFlowPage() {
  const [params, setParams] = useState<ReportParams>({ date_from: firstOfMonth, date_to: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const { exportPdf, exportExcel, isExportingPdf, isExportingExcel } = useReportExport('cash-flow')

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'cash-flow', activeParams], queryFn: () => reportsApi.cashFlow(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Arus Kas" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Arus Kas' }]}
      action={activeParams && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void exportPdf(activeParams)} disabled={isExportingPdf}><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void exportExcel(activeParams)} disabled={isExportingExcel}><FileDown className="mr-1 h-3.5 w-3.5" /> Excel</Button>
        </div>
      )}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full">
              <colgroup><col /><col className="w-40" /></colgroup>
              <tbody className="divide-y divide-[#f1f5f9]">
                <CFSection section={report.operating} />
                <CFSection section={report.investing} />
                <CFSection section={report.financing} />
                <tr className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <td className="px-3 py-2 text-[13px] font-bold text-[#1e293b]">Kenaikan (Penurunan) Kas Bersih</td>
                  <td className={`px-3 py-2 text-right tabular-nums text-[13px] font-bold ${report.net_change >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(report.net_change)}</td>
                </tr>
                <tr className="hover:bg-[#f8fafc]/50">
                  <td className="px-3 py-1.5 text-[12px] text-[#64748b]">Saldo Kas Awal</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[12px]">{formatCurrency(report.opening_cash)}</td>
                </tr>
                <tr className="bg-[#f1f5f9]">
                  <td className="px-3 py-2 text-[13px] font-bold text-[#1e293b]">Saldo Kas Akhir</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[13px] font-bold text-[#1e293b]">{formatCurrency(report.closing_cash)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
