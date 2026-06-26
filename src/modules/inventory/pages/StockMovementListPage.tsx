import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { MultiCheckboxFilter } from '@/components/shared/filter/MultiCheckboxFilter'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
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
  { value: 'transfer_in', label: 'Transfer Masuk' },
  { value: 'transfer_out', label: 'Transfer Keluar' },
]

// Label untuk tipe legacy dari data lama.
const LEGACY_TYPE_LABELS: Record<string, string> = {
  adjustment: 'Penyesuaian',
  purchase_return: 'Retur Pembelian',
  sales_return: 'Retur Penjualan',
  delivery_order: 'Pengiriman',
  goods_receipt: 'Penerimaan',
  opening: 'Stok Awal',
}

function getMovementTypeLabel(type: string): string {
  const found = MOVEMENT_TYPES.find((item) => item.value === type)
  if (found) return found.label
  return LEGACY_TYPE_LABELS[type] ?? type
}

export default function StockMovementListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const [filterStatuses, setFilterStatuses] = useState<StockMovementStatus[]>([])
  const [filterTypes, setFilterTypes] = useState<StockMovementType[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [filterWarehouse, setFilterWarehouse] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidMovement } = useStockMovementMutations()

  const { data, isLoading, isFetching, isError, refetch } = useStockMovementList({
    page: page + 1,
    per_page: perPage,
    search: search || undefined,
    warehouse_id: filterWarehouse ?? undefined,
    status: filterStatuses.length > 0 ? filterStatuses.join(',') as StockMovementStatus : undefined,
    movement_type: filterTypes.length > 0 ? filterTypes.join(',') as StockMovementType : undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  })

  const rows = data?.data ?? []

  const activeFilters = [filterStatuses.length > 0, filterTypes.length > 0, dateRange.from, dateRange.to, filterWarehouse, search].filter(Boolean).length

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
        const eligible = rows.filter((movement) => ids.includes(String(movement.id)) && movement.status !== 'void')
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
    const selectedMovements = rows.filter((movement) => bulkVoidIds.includes(String(movement.id)))
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
      cell: ({ original }) => getMovementTypeLabel(original.movement_type),
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
        setSearch('')
        resetSelection()
      }}
    >
      <FilterSection title="Cari">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetSelection() }}
          placeholder="Nomor, sumber..."
          className="h-8 text-[12px]"
        />
      </FilterSection>
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
      />
      <FilterSection title="Baris per halaman">
        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v) as 25 | 50 | 100); resetSelection() }}>
          <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>
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
        {isError ? (
          <EmptyState
            title="Gagal memuat mutasi stok"
            description="Terjadi kesalahan saat mengambil data. Periksa koneksi dan coba lagi."
            action={
              <Button variant="outline" className="h-8 px-3 text-[13px]" onClick={() => void refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Coba Lagi
              </Button>
            }
          />
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            totalRows={data?.meta.total ?? 0}
            isLoading={isLoading}
            isFetching={isFetching}
            pagination={{ pageIndex: page, pageSize: perPage }}
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
        )}
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
            ? (rows.find((row) => String(row.id) === bulkVoidIds[0])?.number ?? '1 dokumen terpilih')
            : `${bulkVoidIds.length} dokumen terpilih`
        }
        isLoading={voidMovement.isPending}
      />
    </>
  )
}
