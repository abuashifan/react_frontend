import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { MultiCheckboxFilter } from '@/components/shared/filter/MultiCheckboxFilter'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { isDateInRange } from '@/components/shared/filter/dateRangeUtils'
import { formatNumber, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { useStockMovementList, useStockMovementMutations } from '../hooks/useStockMovementList'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
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
const FILTER_HINT = 'Filter multi-select dan tanggal berlaku pada data halaman yang sedang dimuat.'

export default function StockMovementListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [filterStatuses, setFilterStatuses] = useState<StockMovementStatus[]>([])
  const [filterTypes, setFilterTypes] = useState<StockMovementType[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [filterWarehouse, setFilterWarehouse] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidMovement } = useStockMovementMutations()

  const { data, isLoading, isFetching } = useStockMovementList({
    page: page + 1,
    per_page: 25,
    warehouse_id: filterWarehouse ?? undefined,
  })

  const rows = data?.data ?? []
  const visibleRows = useMemo(
    () =>
      rows.filter((movement) => {
        const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(movement.status)
        const matchesType = filterTypes.length === 0 || filterTypes.includes(movement.movement_type)
        const matchesDate = isDateInRange(movement.movement_date, dateRange.from, dateRange.to)
        return matchesStatus && matchesType && matchesDate
      }),
    [rows, filterStatuses, filterTypes, dateRange.from, dateRange.to],
  )

  const activeFilters = [filterStatuses.length > 0, filterTypes.length > 0, dateRange.from, dateRange.to, filterWarehouse].filter(Boolean).length

  const resetSelection = () => {
    setPage(0)
    setSelectedRows([])
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-void',
      label: 'Void Terpilih',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'inventory.movements.void',
      onClick: (ids) => {
        const eligible = visibleRows.filter((movement) => ids.includes(String(movement.id)) && movement.status !== 'void')
        if (eligible.length === 0) {
          toast.warning('Dokumen yang dipilih tidak bisa di-void.')
          return
        }
        setBulkVoidIds(eligible.map((movement) => String(movement.id)))
        setBulkVoidOpen(true)
      },
    },
  ]

  const handleBulkVoid = async (reason: string) => {
    const selectedMovements = visibleRows.filter((movement) => bulkVoidIds.includes(String(movement.id)))
    if (selectedMovements.length === 0) {
      toast.warning('Tidak ada mutasi stok valid untuk di-void.')
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      return
    }

    try {
      const results = await Promise.allSettled(selectedMovements.map((movement) => voidMovement.mutateAsync({ id: Number(movement.id), reason })))
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (failureCount === 0) {
        toast.success(`${successCount} mutasi stok berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} mutasi stok.`)
      } else {
        toast.warning(`${successCount} mutasi stok berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<StockMovement>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 32 },
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
        const found = MOVEMENT_TYPES.find((item) => item.value === original.movement_type)
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

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilters}
      onReset={() => {
        setFilterStatuses([])
        setFilterTypes([])
        setDateRange({ from: '', to: '' })
        setFilterWarehouse(null)
        resetSelection()
      }}
      hint={FILTER_HINT}
    >
      <FilterSection title="Gudang">
        <SearchableSelect
          value={filterWarehouse}
          onChange={(v) => {
            setFilterWarehouse(v)
            resetSelection()
          }}
          onSearch={gudangApi.search}
          placeholder="Semua gudang..."
          size="sm"
        />
      </FilterSection>
      <MultiCheckboxFilter
        title="Tipe"
        options={MOVEMENT_TYPES}
        value={filterTypes}
        onChange={(next) => {
          setFilterTypes(next)
          resetSelection()
        }}
      />
      <MultiCheckboxFilter
        title="Status"
        options={STATUSES.map((status) => ({ value: status, label: status }))}
        value={filterStatuses}
        onChange={(next) => {
          setFilterStatuses(next)
          resetSelection()
        }}
      />
      <DateRangeFilterSection
        from={dateRange.from}
        to={dateRange.to}
        onChange={(next) => {
          setDateRange(next)
          resetSelection()
        }}
        note="Berlaku pada data halaman yang sedang dimuat."
      />
    </FilterSidebar>
  )

  return (
    <>
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
          data={visibleRows}
          columns={columns}
          totalRows={data?.meta.total ?? 0}
          isLoading={isLoading}
          isFetching={isFetching}
          pagination={{ pageIndex: page, pageSize: 25 }}
          onPaginationChange={(p) => {
            setPage(p.pageIndex)
            setSelectedRows([])
          }}
          selectedRows={selectedRows}
          onRowSelect={setSelectedRows}
          bulkActions={bulkActions}
          emptyTitle="Belum ada mutasi stok"
          emptyDescription="Mutasi stok dibuat otomatis dari transaksi atau secara manual."
        />
      </WorkspaceLayout>

      <VoidConfirmDialog
        isOpen={isBulkVoidOpen}
        onClose={() => {
          setBulkVoidOpen(false)
          setBulkVoidIds([])
          setSelectedRows([])
        }}
        onConfirm={(reason) => void handleBulkVoid(reason)}
        documentNumber={
          bulkVoidIds.length === 1
            ? (visibleRows.find((row) => String(row.id) === bulkVoidIds[0])?.number ?? '1 dokumen terpilih')
            : `${bulkVoidIds.length} dokumen terpilih`
        }
        isLoading={voidMovement.isPending}
      />
    </>
  )
}
