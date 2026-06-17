import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatNumber } from '@/lib/utils'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { useStockBalanceList } from '../hooks/useStockBalanceList'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { StockBalance } from '../types/stockBalance.types'

export default function StockBalanceListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [warehouseId, setWarehouseId] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useStockBalanceList({
    page: page + 1,
    per_page: 25,
    warehouse_id: warehouseId ?? undefined,
  })

  const columns: ColumnDef<StockBalance>[] = [
    {
      id: 'product',
      header: 'Produk',
      size: 240,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <div className="min-w-0 space-y-0.5">
          <button
            type="button"
            onClick={() => navigate(`/inventory/stock-balances/${original.product_id}/${original.warehouse_id}`)}
            className="block max-w-full truncate text-left font-medium text-[#5c9ead] hover:underline"
          >
            {original.product?.name ?? '-'}
          </button>
          <div className="max-w-full truncate text-[11px] text-[#64748b]">
            {original.product?.description ?? '-'}
          </div>
        </div>
      ),
    },
    { id: 'product_code', header: 'Kode', size: 110, cell: ({ original }) => original.product?.code ?? '-' },
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

  const activeFilterCount = [warehouseId].filter(Boolean).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => {
        setWarehouseId(null)
      }}
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
