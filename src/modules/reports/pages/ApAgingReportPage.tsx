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
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)

export default function ApAgingReportPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const { exportPdf, exportExcel, isExportingPdf, isExportingExcel } = useReportExport('ap-aging')

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'ap-aging', activeParams], queryFn: () => reportsApi.apAging(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="AP Aging" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'AP Aging' }]}
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
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Supplier</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Belum Jatuh Tempo</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">1-30 Hari</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">31-60 Hari</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">61-90 Hari</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">&gt;90 Hari</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {report.lines.map((line) => (
                  <tr key={line.contact_id} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 font-medium text-[#334155]">{line.contact_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(line.buckets.current)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(line.buckets.days_1_30)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-amber-600">{formatCurrency(line.buckets.days_31_60)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-orange-600">{formatCurrency(line.buckets.days_61_90)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{formatCurrency(line.buckets.days_over_90)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(line.buckets.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                <tr>
                  <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(report.totals.current)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(report.totals.days_1_30)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-amber-600">{formatCurrency(report.totals.days_31_60)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-orange-600">{formatCurrency(report.totals.days_61_90)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-red-600">{formatCurrency(report.totals.days_over_90)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
