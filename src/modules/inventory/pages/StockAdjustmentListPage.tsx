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
import { formatDate } from '@/lib/utils'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { useStockAdjustmentList } from '../hooks/useStockAdjustmentList'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { StockAdjustment, StockAdjustmentStatus } from '../types/stockAdjustment.types'

const STATUSES: StockAdjustmentStatus[] = ['draft', 'approved', 'posted', 'void']

export default function StockAdjustmentListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<StockAdjustmentStatus | undefined>()
  const [filterWarehouse, setFilterWarehouse] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useStockAdjustmentList({
    page: page + 1,
    per_page: 25,
    status: filterStatus,
    warehouse_id: filterWarehouse ?? undefined,
  })

  const columns: ColumnDef<StockAdjustment>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/inventory/adjustments/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.adjustment_date) },
    { id: 'warehouse', header: 'Gudang', size: 160, cell: ({ original }) => original.warehouse?.name ?? '-' },
    { id: 'reason', header: 'Alasan', size: 200, cell: ({ original }) => original.reason ?? '-' },
    { id: 'items', header: 'Jumlah Item', size: 100, meta: { className: 'tabular-nums text-right' }, cell: ({ original }) => original.lines?.length ?? '-' },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const activeFilterCount = [filterStatus, filterWarehouse].filter(Boolean).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterStatus(undefined); setFilterWarehouse(null) }}
    >
      <FilterSection title="Gudang">
        <SearchableSelect value={filterWarehouse} onChange={(v) => setFilterWarehouse(v)} onSearch={gudangApi.search} placeholder="Semua gudang..." size="sm" />
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
      title="Penyesuaian Stok"
      breadcrumb={[{ label: 'Inventori' }, { label: 'Penyesuaian' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="inventory.adjustments.create">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/inventory/adjustments/create')}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Buat Penyesuaian
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
        emptyTitle="Belum ada penyesuaian stok"
        emptyDescription="Buat penyesuaian untuk mengoreksi selisih stok."
      />
    </WorkspaceLayout>
  )
}
