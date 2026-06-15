import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatNumber, formatDate } from '@/lib/utils'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { useStockMovementList } from '../hooks/useStockMovementList'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { StockMovement, StockMovementStatus, StockMovementType } from '../types/stockMovement.types'

const STATUSES: StockMovementStatus[] = ['draft', 'posted', 'void']
const MOVEMENT_TYPES: { value: StockMovementType; label: string }[] = [
  { value: 'purchase_in', label: 'Pembelian Masuk' },
  { value: 'purchase_return_out', label: 'Retur Pembelian' },
  { value: 'sales_out', label: 'Penjualan Keluar' },
  { value: 'sales_return_in', label: 'Retur Penjualan' },
  { value: 'adjustment_in', label: 'Penyesuaian Masuk' },
  { value: 'adjustment_out', label: 'Penyesuaian Keluar' },
  { value: 'opening_stock', label: 'Stok Awal' },
  { value: 'opname_in', label: 'Opname Masuk' },
  { value: 'opname_out', label: 'Opname Keluar' },
]

export default function StockMovementListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<StockMovementStatus | undefined>()
  const [filterType, setFilterType] = useState<StockMovementType | undefined>()
  const [filterWarehouse, setFilterWarehouse] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useStockMovementList({
    page: page + 1,
    per_page: 25,
    status: filterStatus,
    movement_type: filterType,
    warehouse_id: filterWarehouse ?? undefined,
  })

  const columns: ColumnDef<StockMovement>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/inventory/movements/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.movement_date) },
    {
      id: 'type',
      header: 'Tipe',
      size: 160,
      cell: ({ original }) => {
        const found = MOVEMENT_TYPES.find((t) => t.value === original.movement_type)
        return found?.label ?? original.movement_type
      },
    },
    { id: 'warehouse', header: 'Gudang', size: 140, cell: ({ original }) => original.warehouse?.name ?? '-' },
    {
      id: 'total_qty',
      header: 'Total Qty',
      size: 110,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatNumber(original.total_quantity, 4),
    },
    {
      id: 'total_value',
      header: 'Nilai Total',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatNumber(original.total_value, 2),
    },
    { id: 'source', header: 'Sumber', size: 150, cell: ({ original }) => original.source_number ?? '-' },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const activeFilterCount = [filterStatus, filterType, filterWarehouse].filter(Boolean).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterStatus(undefined); setFilterType(undefined); setFilterWarehouse(null) }}
    >
      <FilterSection title="Gudang">
        <SearchableSelect value={filterWarehouse} onChange={(v) => setFilterWarehouse(v)} onSearch={gudangApi.search} placeholder="Semua gudang..." size="sm" />
      </FilterSection>
      <FilterSection title="Tipe">
        {MOVEMENT_TYPES.map((t) => (
          <label key={t.value} className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={filterType === t.value} onCheckedChange={(c) => setFilterType(c ? t.value : undefined)} />
            <span className="text-[12px] text-[#334155]">{t.label}</span>
          </label>
        ))}
      </FilterSection>
      <FilterSection title="Status">
        {STATUSES.map((s) => (
          <label key={s} className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={filterStatus === s} onCheckedChange={(c) => setFilterStatus(c ? s : undefined)} />
            <span className="text-[12px] capitalize text-[#334155]">{s}</span>
          </label>
        ))}
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Mutasi Stok"
      breadcrumb={[{ label: 'Inventori' }, { label: 'Mutasi Stok' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="inventory.movements.create">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/inventory/movements/create')}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Buat Mutasi
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: page, pageSize: 25 }}
        onPaginationChange={(p) => setPage(p.pageIndex)}
        emptyTitle="Belum ada mutasi stok"
        emptyDescription="Mutasi stok dibuat otomatis dari transaksi atau secara manual."
      />
    </WorkspaceLayout>
  )
}
