import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { ReportExportButton } from '../components/ReportExportButton'
import { toExcelNumber } from '@/lib/exportXlsx'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { useReportParams } from '../hooks/useReportParams'

const today = new Date().toISOString().slice(0, 10)

export default function ArAgingReportPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } = useReportParams({ as_of_date: today })

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'ar-aging', activeParams], queryFn: () => reportsApi.arAging(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  // Baris total ikut diekspor supaya angka di file sama persis dengan cetakannya.
  const tools = !isLoading && !isError && report && report.lines.length > 0 ? (
    <ReportExportButton
      filename={`ar-aging-${activeParams?.as_of_date ?? today}`}
      sheetName="AR Aging"
      headers={['Pelanggan', 'Belum Jatuh Tempo', '1-30 Hari', '31-60 Hari', '61-90 Hari', '>90 Hari', 'Total']}
      rows={() => [
        ...report.lines.map((line) => [
          line.contact_name,
          toExcelNumber(line.buckets.current),
          toExcelNumber(line.buckets.days_1_30),
          toExcelNumber(line.buckets.days_31_60),
          toExcelNumber(line.buckets.days_61_90),
          toExcelNumber(line.buckets.days_over_90),
          toExcelNumber(line.buckets.total),
        ]),
        [
          'Total',
          toExcelNumber(report.totals.current),
          toExcelNumber(report.totals.days_1_30),
          toExcelNumber(report.totals.days_31_60),
          toExcelNumber(report.totals.days_61_90),
          toExcelNumber(report.totals.days_over_90),
          toExcelNumber(report.totals.total),
        ],
      ]}
      formats={['text', 'currency', 'currency', 'currency', 'currency', 'currency', 'currency']}
    />
  ) : undefined

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={<ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} mode="as_of_date" filterSummary={activeParams?.customer_id ? 'Pelanggan difilter' : undefined} actions={tools} />}
    >
      <div className="space-y-4">
        {showFilter && <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} contextFilters={{ customer: true }} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}
        {!isLoading && !isError && report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pelanggan</th>
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
