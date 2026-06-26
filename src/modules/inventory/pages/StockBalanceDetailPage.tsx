import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Button } from '@/components/ui/button'
import { formatNumber, formatDate } from '@/lib/utils'
import { reportsApi } from '@/modules/reports/services/reportsApi'
import { useStockBalance } from '../hooks/useStockBalanceList'
import type { StockCardLine } from '@/modules/reports/types/reports.types'

export default function StockBalanceDetailPage() {
  const { productId, warehouseId } = useParams<{ productId: string; warehouseId: string }>()
  const navigate = useNavigate()

  const pId = productId ? Number(productId) : undefined
  const wId = warehouseId ? Number(warehouseId) : undefined

  const { data, isLoading } = useStockBalance(pId, wId)

  const { data: stockCardData, isLoading: isCardLoading } = useQuery({
    queryKey: ['inventory', 'stock-card', pId, wId],
    queryFn: () => reportsApi.stockCard({ product_id: pId, warehouse_id: wId }),
    enabled: !!pId && !!wId,
  })

  const balance = data?.data
  const policy = data?.policy
  const card = stockCardData?.data

  if (isLoading) {
    return (
      <FormLayout
        title="Detail Saldo Stok"
        breadcrumb={[
          { label: 'Inventori' },
          { label: 'Saldo Stok', path: '/inventory/stock-balances' },
          { label: 'Memuat...' },
        ]}
      >
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  if (!balance) {
    return (
      <FormLayout
        title="Detail Saldo Stok"
        breadcrumb={[
          { label: 'Inventori' },
          { label: 'Saldo Stok', path: '/inventory/stock-balances' },
          { label: 'Tidak ditemukan' },
        ]}
      >
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Data tidak ditemukan.</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout
      title="Detail Saldo Stok"
      breadcrumb={[
        { label: 'Inventori' },
        { label: 'Saldo Stok', path: '/inventory/stock-balances' },
        { label: `${balance.product?.name ?? productId} — ${balance.warehouse?.name ?? warehouseId}` },
      ]}
    >
      <div className="space-y-3">
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[12px]" onClick={() => navigate('/inventory/stock-balances')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali
        </Button>

        <FormSection title="Informasi Produk">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Produk</span>
            <span className="text-[13px] text-[#334155]">{balance.product?.name ?? '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode Produk</span>
            <span className="text-[13px] text-[#334155]">{balance.product?.code ?? '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</span>
            <span className="text-[13px] text-[#334155]">{balance.product?.description ?? '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang</span>
            <span className="text-[13px] text-[#334155]">{balance.warehouse?.name ?? '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode Gudang</span>
            <span className="text-[13px] text-[#334155]">{balance.warehouse?.code ?? '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pergerakan Terakhir</span>
            <span className="text-[13px] text-[#334155]">{balance.last_movement_at ? formatDate(balance.last_movement_at) : '-'}</span>
          </div>
        </FormSection>

        <FormSection title="Posisi Stok">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty On Hand</span>
            <span className={`text-[13px] tabular-nums font-semibold ${balance.quantity_on_hand < 0 ? 'text-red-600' : 'text-[#334155]'}`}>
              {formatNumber(balance.quantity_on_hand, 4)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Direservasi</span>
            <span className="text-[13px] tabular-nums text-[#334155]">{formatNumber(balance.quantity_reserved, 4)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Tersedia</span>
            <span className={`text-[13px] tabular-nums font-semibold ${balance.quantity_available < 0 ? 'text-red-600' : 'text-[#334155]'}`}>
              {formatNumber(balance.quantity_available, 4)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Harga Rata-rata</span>
            <span className="text-[13px] tabular-nums text-[#334155]">{formatNumber(balance.average_cost, 6)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nilai Total</span>
            <span className="text-[13px] tabular-nums font-semibold text-[#334155]">{formatNumber(balance.total_value, 2)}</span>
          </div>
          {policy && (
            <div className="flex flex-col gap-0.5 md:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kebijakan Stok Negatif</span>
              <span className="text-[13px] text-[#334155]">
                {policy.allow_negative_stock ? 'Diizinkan' : 'Dibatasi'}
                <span className="ml-2 text-[#64748b]">
                  (precision stok {policy.stock_precision}, biaya {policy.cost_precision}, nilai {policy.amount_precision})
                </span>
              </span>
            </div>
          )}
        </FormSection>

        {/* A13-190: Stock card movement history */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Riwayat Pergerakan Stok</p>
          {isCardLoading ? (
            <div className="flex h-20 items-center justify-center text-[13px] text-[#64748b]">Memuat riwayat...</div>
          ) : !card || card.lines.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center">
              <p className="text-[13px] text-[#64748b]">Belum ada riwayat pergerakan stok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Tanggal</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Referensi</th>
                    <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Keterangan</th>
                    <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Masuk</th>
                    <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Keluar</th>
                    <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Saldo</th>
                    <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr className="border-b border-[#e2e8f0] bg-[#f1f5f9]">
                    <td className="px-3 py-2 text-[#64748b]" colSpan={3}>Saldo Awal ({formatDate(card.date_from)})</td>
                    <td className="px-3 py-2 tabular-nums text-right text-[#94a3b8]">—</td>
                    <td className="px-3 py-2 tabular-nums text-right text-[#94a3b8]">—</td>
                    <td className="px-3 py-2 tabular-nums text-right font-semibold text-[#334155]">{formatNumber(card.opening_qty, 4)}</td>
                    <td className="px-3 py-2 tabular-nums text-right text-[#334155]">{formatNumber(card.opening_cost, 2)}</td>
                  </tr>
                  {card.lines.map((line: StockCardLine, idx: number) => (
                    <tr key={idx} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="px-3 py-2 text-[#334155]">{formatDate(line.date)}</td>
                      <td className="px-3 py-2 font-medium text-[#5c9ead]">{line.reference}</td>
                      <td className="px-3 py-2 text-[#64748b]">{line.description}</td>
                      <td className="px-3 py-2 tabular-nums text-right text-green-700">
                        {line.qty_in > 0 ? formatNumber(line.qty_in, 4) : '—'}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-right text-red-600">
                        {line.qty_out > 0 ? formatNumber(line.qty_out, 4) : '—'}
                      </td>
                      <td className={`px-3 py-2 tabular-nums text-right font-semibold ${line.qty_balance < 0 ? 'text-red-600' : 'text-[#334155]'}`}>
                        {formatNumber(line.qty_balance, 4)}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-right text-[#334155]">{formatNumber(line.total_cost, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </FormLayout>
  )
}
