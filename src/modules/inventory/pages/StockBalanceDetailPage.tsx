import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Button } from '@/components/ui/button'
import { formatNumber, formatDate } from '@/lib/utils'
import { useStockBalance } from '../hooks/useStockBalanceList'

export default function StockBalanceDetailPage() {
  const { productId, warehouseId } = useParams<{ productId: string; warehouseId: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useStockBalance(
    productId ? Number(productId) : undefined,
    warehouseId ? Number(warehouseId) : undefined,
  )

  const balance = data?.data

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
        </FormSection>
      </div>
    </FormLayout>
  )
}
