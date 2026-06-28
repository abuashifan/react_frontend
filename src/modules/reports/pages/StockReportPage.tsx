import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

type StockTab = 'balance' | 'movement' | 'stock_card'
const TAB_LABELS: Record<StockTab, string> = {
  balance: 'Saldo Stok',
  movement: 'Mutasi Stok',
  stock_card: 'Kartu Stok',
}

export default function StockReportPage() {
  const [tab, setTab] = useState<StockTab>('balance')
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfMonth, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  // stock card has its own product_id filter
  const [cardProductId, setCardProductId] = useState('')
  const [cardParams, setCardParams] = useState<{ product_id: number; start_date: string; end_date: string } | null>(null)

  const { data: balanceData, isLoading: loadingBalance, isError: errBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['reports', 'stock-balances', activeParams],
    queryFn: () => reportsApi.stockBalances(activeParams!),
    enabled: !!activeParams && tab === 'balance',
  })
  const { data: movData, isLoading: loadingMovement, isError: errMovement, refetch: refetchMovement } = useQuery({
    queryKey: ['reports', 'stock-movements', activeParams],
    queryFn: () => reportsApi.stockMovements(activeParams!),
    enabled: !!activeParams && tab === 'movement',
  })
  const { data: cardData, isLoading: loadingCard, isError: errCard, refetch: refetchCard } = useQuery({
    queryKey: ['reports', 'stock-card', cardParams],
    queryFn: () => reportsApi.stockCard(cardParams!),
    enabled: !!cardParams && tab === 'stock_card',
  })

  const isLoading = loadingBalance || loadingMovement || loadingCard
  const isError = (tab === 'balance' && errBalance) || (tab === 'movement' && errMovement) || (tab === 'stock_card' && errCard)
  const refetch = tab === 'balance' ? refetchBalance : tab === 'movement' ? refetchMovement : refetchCard

  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }
  const handleCardSubmit = () => {
    const id = parseInt(cardProductId, 10)
    if (!id) return
    setCardParams({ product_id: id, start_date: params.start_date ?? firstOfMonth, end_date: params.end_date ?? today })
  }

  return (
    <WorkspaceLayout title="Laporan Stok" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Laporan Stok' }]}>
      <div className="space-y-4">
        <div role="tablist" aria-label="Tab Laporan Stok" className="flex gap-2">
          {(['balance', 'movement', 'stock_card'] as StockTab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${tab === t ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab !== 'stock_card' && (
          showFilter
            ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ warehouse: true }} />
            : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />
        )}

        {tab === 'stock_card' && (
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Parameter Kartu Stok</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="card-product-id" className="text-[11px] font-medium text-[#64748b]">ID Produk</Label>
                <Input
                  id="card-product-id"
                  type="number"
                  min={1}
                  placeholder="cth. 1"
                  value={cardProductId}
                  onChange={(e) => setCardProductId(e.target.value)}
                  className="h-8 w-28 text-[13px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="card-start-date" className="text-[11px] font-medium text-[#64748b]">Dari Tanggal</Label>
                <Input id="card-start-date" type="date" value={params.start_date ?? ''} onChange={(e) => setParams((p) => ({ ...p, start_date: e.target.value }))} className="h-8 w-40 text-[13px]" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="card-end-date" className="text-[11px] font-medium text-[#64748b]">Sampai Tanggal</Label>
                <Input id="card-end-date" type="date" value={params.end_date ?? ''} onChange={(e) => setParams((p) => ({ ...p, end_date: e.target.value }))} className="h-8 w-40 text-[13px]" />
              </div>
              <Button onClick={handleCardSubmit} disabled={!cardProductId || loadingCard} className="h-8 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]">
                {loadingCard ? 'Memuat...' : 'Tampilkan'}
              </Button>
            </div>
          </div>
        )}

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && tab === 'balance' && balanceData?.data && (
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
                {balanceData.data.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-[#94a3b8]">Tidak ada saldo stok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && tab === 'movement' && movData?.data && (
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
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nilai</th>
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
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium">{formatCurrency(line.total_cost)}</td>
                  </tr>
                ))}
                {movData.data.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-[#94a3b8]">Tidak ada mutasi stok pada periode ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && tab === 'stock_card' && cardData?.data && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <p className="text-[13px] font-semibold text-[#1e293b]">{cardData.data.product_code} — {cardData.data.product_name}</p>
              {cardData.data.warehouse_name && (
                <p className="text-[12px] text-[#64748b]">Gudang: {cardData.data.warehouse_name}</p>
              )}
              <div className="mt-2 flex gap-6">
                <span className="text-[12px] text-[#64748b]">Saldo Awal Qty: <strong className="tabular-nums text-[#334155]">{cardData.data.opening_qty.toLocaleString()}</strong></span>
                <span className="text-[12px] text-[#64748b]">Saldo Awal Nilai: <strong className="tabular-nums text-[#334155]">{formatCurrency(cardData.data.opening_cost)}</strong></span>
              </div>
            </div>
            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Referensi</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keterangan</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Masuk</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keluar</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Harga Satuan</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {cardData.data.lines.map((line, i) => (
                    <tr key={i} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 text-[#64748b]">{formatDate(line.date)}</td>
                      <td className="px-3 py-1.5 text-[#5c9ead]">{line.reference}</td>
                      <td className="px-3 py-1.5 text-[#334155]">{line.description}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{line.qty_in ? line.qty_in.toLocaleString() : '-'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{line.qty_out ? line.qty_out.toLocaleString() : '-'}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${line.qty_balance < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{line.qty_balance.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(line.unit_cost)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{formatCurrency(line.total_cost)}</td>
                    </tr>
                  ))}
                  {cardData.data.lines.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-[#94a3b8]">Tidak ada mutasi untuk produk ini pada periode yang dipilih.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
