import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfYear = today.slice(0, 4) + '-01-01'

export default function RetainedEarningsReportPage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfYear, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'retained-earnings', activeParams],
    queryFn: () => reportsApi.retainedEarnings(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Laba Ditahan" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Laba Ditahan' }]}>
      <div className="space-y-4">
        {showFilter
          ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && (
          <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[13px]">
              <tbody className="divide-y divide-[#f1f5f9]">
                <tr className="hover:bg-[#f8fafc]">
                  <td className="px-4 py-3 text-[#334155]">Laba Ditahan Awal Periode</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-[#334155]">{formatCurrency(report.beginning_retained_earnings)}</td>
                </tr>
                <tr className="hover:bg-[#f8fafc]">
                  <td className="px-4 py-3 text-[#334155]">Laba / Rugi Periode Berjalan</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${report.net_income < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(report.net_income)}</td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                <tr>
                  <td className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#334155]">Laba Ditahan Akhir Periode</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[15px] font-bold text-[#1e293b]">{formatCurrency(report.ending_retained_earnings)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
