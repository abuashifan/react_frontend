import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatNumber } from '@/lib/utils'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { useStockBalanceList } from '../hooks/useStockBalanceList'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { StockBalance, StockBalanceListParams } from '../types/stockBalance.types'

type StockStatus = NonNullable<StockBalanceListParams['stock_status']>
const STOCK_STATUSES: { value: StockStatus; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Rendah' },
  { value: 'negative', label: 'Negatif' },
]

export default function StockBalanceListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [stockStatus, setStockStatus] = useState<StockStatus | undefined>()

  const { data, isLoading, isFetching } = useStockBalanceList({
    page: page + 1,
    per_page: 25,
    warehouse_id: warehouseId ?? undefined,
    stock_status: stockStatus,
  })

  const columns: ColumnDef<StockBalance>[] = [
    {
      id: 'product',
      header: 'Produk',
      size: 200,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button
          type="button"
          onClick={() => navigate(`/inventory/stock-balances/${original.product_id}/${original.warehouse_id}`)}
          className="font-medium text-[#5c9ead] hover:underline text-left"
        >
          {original.product?.name ?? '-'}
        </button>
      ),
    },
    { id: 'product_code', header: 'Kode', size: 100, cell: ({ original }) => original.product?.code ?? '-' },
    { id: 'warehouse', header: 'Gudang', size: 140, cell: ({ original }) => original.warehouse?.name ?? '-' },
    {
      id: 'qty_on_hand',
      header: 'Qty On Hand',
      size: 120,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => {
        const qty = original.quantity_on_hand
        const cls = qty < 0 ? 'text-red-600 font-semibold' : qty === 0 ? 'text-[#94a3b8]' : ''
        return <span className={cls}>{formatNumber(qty, 4)}</span>
      },
    },
    {
      id: 'qty_reserved',
      header: 'Direservasi',
      size: 110,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatNumber(original.quantity_reserved, 4),
    },
    {
      id: 'qty_available',
      header: 'Tersedia',
      size: 110,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => {
        const qty = original.quantity_available
        const cls = qty < 0 ? 'text-red-600 font-semibold' : ''
        return <span className={cls}>{formatNumber(qty, 4)}</span>
      },
    },
    {
      id: 'avg_cost',
      header: 'Harga Rata-rata',
      size: 140,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatNumber(original.average_cost, 2),
    },
    {
      id: 'total_value',
      header: 'Nilai Total',
      size: 140,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatNumber(original.total_value, 2),
    },
  ]

  const activeFilterCount = [warehouseId, stockStatus].filter(Boolean).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setWarehouseId(null); setStockStatus(undefined) }}
    >
      <FilterSection title="Gudang">
        <SearchableSelect
          value={warehouseId}
          onChange={(v) => setWarehouseId(v)}
          onSearch={gudangApi.search}
          placeholder="Semua gudang..."
          size="sm"
        />
      </FilterSection>
      <FilterSection title="Status Stok">
        {STOCK_STATUSES.map((s) => (
          <label key={s.value} className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={stockStatus === s.value} onCheckedChange={(c) => setStockStatus(c ? s.value : undefined)} />
            <span className="text-[12px] text-[#334155]">{s.label}</span>
          </label>
        ))}
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Saldo Stok"
      breadcrumb={[{ label: 'Inventori' }, { label: 'Saldo Stok' }]}
      sidebar={sidebar}
    >
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: page, pageSize: 25 }}
        onPaginationChange={(p) => setPage(p.pageIndex)}
        emptyTitle="Belum ada saldo stok"
        emptyDescription="Saldo stok akan muncul setelah ada penerimaan barang."
      />
    </WorkspaceLayout>
  )
}
