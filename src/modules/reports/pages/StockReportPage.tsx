import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileDown } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { reportsApi } from '../services/reportsApi'
import { useReportExport } from '../hooks/useReportExport'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

type StockTab = 'balance' | 'movement'
const TAB_LABELS: Record<StockTab, string> = { balance: 'Saldo Stok', movement: 'Mutasi Stok' }

export default function StockReportPage() {
  const [tab, setTab] = useState<StockTab>('balance')
  const [params, setParams] = useState<ReportParams>({ date_from: firstOfMonth, date_to: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const { exportPdf, isExportingPdf } = useReportExport('stock')

  const { data: balanceData, isLoading: loadingBalance } = useQuery({ queryKey: ['reports', 'stock-balances', activeParams], queryFn: () => reportsApi.stockBalances(activeParams!), enabled: !!activeParams && tab === 'balance' })
  const { data: movData, isLoading: loadingMovement } = useQuery({ queryKey: ['reports', 'stock-movements', activeParams], queryFn: () => reportsApi.stockMovements(activeParams!), enabled: !!activeParams && tab === 'movement' })
  const isLoading = loadingBalance || loadingMovement
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Laporan Stok" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Laporan Stok' }]}
      action={activeParams && <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void exportPdf(activeParams)} disabled={isExportingPdf}><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>}>
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['balance', 'movement'] as StockTab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${tab === t ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}>{TAB_LABELS[t]}</button>
          ))}
        </div>
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}

        {tab === 'balance' && balanceData?.data && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Produk</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Satuan</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Harga Rata-rata</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {balanceData.data.map((line) => (
                  <tr key={`${line.product_id}-${line.warehouse_id}`} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 text-[#64748b]">{line.product_code}</td>
                    <td className="px-3 py-1.5 text-[#334155]">{line.product_name}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">{line.warehouse_name}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${line.qty_on_hand < 0 ? 'text-red-600' : ''}`}>{line.qty_on_hand.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">{line.unit}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(line.avg_cost)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(line.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'movement' && movData?.data && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No. Dokumen</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tipe</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Produk</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Masuk</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keluar</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {movData.data.map((line, i) => (
                  <tr key={i} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 text-[#64748b]">{formatDate(line.date)}</td>
                    <td className="px-3 py-1.5 text-[#5c9ead]">{line.movement_number}</td>
                    <td className="px-3 py-1.5 text-[#64748b] capitalize">{line.movement_type.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-1.5 text-[#334155]">{line.product_name}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">{line.warehouse_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{line.qty_in ? line.qty_in.toLocaleString() : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{line.qty_out ? line.qty_out.toLocaleString() : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium">{line.qty_balance.toLocaleString()}</td>
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
