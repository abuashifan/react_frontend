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

type AnalysisTab = 'valuation' | 'low_stock' | 'negative_stock'
const TAB_LABELS: Record<AnalysisTab, string> = { valuation: 'Valuasi', low_stock: 'Stok Rendah', negative_stock: 'Stok Negatif' }

export default function InventoryAnalysisPage() {
  const [tab, setTab] = useState<AnalysisTab>('valuation')
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data: valData, isLoading: loadingVal, isError: errVal, refetch: refetchVal } = useQuery({ queryKey: ['reports', 'valuation', activeParams], queryFn: () => reportsApi.valuation(activeParams!), enabled: !!activeParams && tab === 'valuation' })
  const { data: lowData, isLoading: loadingLow, isError: errLow, refetch: refetchLow } = useQuery({ queryKey: ['reports', 'low-stock', activeParams], queryFn: () => reportsApi.lowStock(activeParams!), enabled: !!activeParams && tab === 'low_stock' })
  const { data: negData, isLoading: loadingNeg, isError: errNeg, refetch: refetchNeg } = useQuery({ queryKey: ['reports', 'negative-stock', activeParams], queryFn: () => reportsApi.negativeStock(activeParams!), enabled: !!activeParams && tab === 'negative_stock' })
  const isLoading = loadingVal || loadingLow || loadingNeg
  const isError = errVal || errLow || errNeg
  const refetch = tab === 'valuation' ? refetchVal : tab === 'low_stock' ? refetchLow : refetchNeg
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Analisis Inventori" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Analisis Inventori' }]}>
      <div className="space-y-4">
        <div role="tablist" aria-label="Tab Analisis Inventori" className="flex gap-2">
          {(['valuation', 'low_stock', 'negative_stock'] as AnalysisTab[]).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${tab === t ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}>{TAB_LABELS[t]}</button>
          ))}
        </div>
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} mode="as_of_date" />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && tab === 'valuation' && valData?.data && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]"><tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Produk</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Satuan</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Harga Rata-rata</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nilai</th>
              </tr></thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {valData.data.map((line) => (
                  <tr key={line.product_id} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 text-[#64748b]">{line.product_code}</td>
                    <td className="px-3 py-1.5 text-[#334155]">{line.product_name}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">{line.unit}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{line.qty_on_hand.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(line.avg_cost)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(line.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (tab === 'low_stock' || tab === 'negative_stock') && (lowData?.data ?? negData?.data) && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]"><tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Produk</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Tersedia</th>
                {tab === 'low_stock' && <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Stok Minimum</th>}
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Satuan</th>
              </tr></thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {(tab === 'low_stock' ? lowData?.data : negData?.data)?.map((line) => (
                  <tr key={`${line.product_id}-${line.warehouse_name}`} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 text-[#64748b]">{line.product_code}</td>
                    <td className="px-3 py-1.5 text-[#334155]">{line.product_name}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">{line.warehouse_name}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${line.qty_on_hand < 0 ? 'text-red-600' : 'text-amber-600'}`}>{line.qty_on_hand.toLocaleString()}</td>
                    {tab === 'low_stock' && <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{line.min_stock?.toLocaleString() ?? '-'}</td>}
                    <td className="px-3 py-1.5 text-[#64748b]">{line.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
