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
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { useStockOpnameList, useStockOpnameMutations } from '../hooks/useStockOpnameList'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { StockOpname, StockOpnameStatus } from '../types/stockOpname.types'

const STATUSES: StockOpnameStatus[] = ['draft', 'counted', 'finalized', 'void']

export default function StockOpnameListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const [filterStatuses, setFilterStatuses] = useState<StockOpnameStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [filterWarehouse, setFilterWarehouse] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidOpname } = useStockOpnameMutations()

  const { data, isLoading, isFetching, isError, refetch } = useStockOpnameList({
    page: page + 1,
    per_page: perPage,
    search: search || undefined,
    warehouse_id: filterWarehouse ?? undefined,
    status: filterStatuses.length > 0 ? filterStatuses.join(',') as StockOpnameStatus : undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  })

  const rows = data?.data ?? []

  const activeFilters = [filterStatuses.length > 0, dateRange.from, dateRange.to, filterWarehouse, search].filter(Boolean).length

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
      permission: 'inventory.opname.void',
      onClick: (ids) => {
        const eligible = rows.filter((opname) => ids.includes(String(opname.id)) && opname.status !== 'void')
        if (eligible.length === 0) {
          toast.warning('Dokumen yang dipilih tidak bisa di-void.')
          return
        }
        setBulkVoidIds(eligible.map((opname) => String(opname.id)))
        setBulkVoidOpen(true)
      },
    },
  ]

  const handleBulkVoid = async (reason: string) => {
    const selectedOpnames = rows.filter((opname) => bulkVoidIds.includes(String(opname.id)))
    if (selectedOpnames.length === 0) {
      toast.warning('Tidak ada opname stok valid untuk di-void.')
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      return
    }

    try {
      const results = await Promise.allSettled(selectedOpnames.map((opname) => voidOpname.mutateAsync({ id: Number(opname.id), reason })))
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (failureCount === 0) {
        toast.success(`${successCount} opname stok berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} opname stok.`)
      } else {
        toast.warning(`${successCount} opname stok berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<StockOpname>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/inventory/opnames/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.opname_date) },
    { id: 'warehouse', header: 'Gudang', size: 160, cell: ({ original }) => original.warehouse?.name ?? '-' },
    {
      id: 'items',
      header: 'Jumlah Item',
      size: 110,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => {
        // lines_count dari withCount('lines') di backend; fallback ke lines.length.
        const raw = original as StockOpname & { lines_count?: number }
        const count = raw.lines_count ?? original.lines?.length
        return count != null ? count : '-'
      },
    },
    {
      id: 'counted_at',
      header: 'Tgl Hitung',
      size: 110,
      cell: ({ original }) => (original.counted_at ? formatDate(original.counted_at) : '-'),
    },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilters}
      onReset={() => {
        setFilterStatuses([])
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
          placeholder="Nomor opname..."
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
        title="Opname Stok"
        breadcrumb={[{ label: 'Inventori' }, { label: 'Opname' }]}
        sidebar={sidebar}
        action={
          <PermissionGuard permission="inventory.opname.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/inventory/opnames/create')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat Opname
            </Button>
          </PermissionGuard>
        }
      >
        {isError ? (
          <EmptyState
            title="Gagal memuat opname stok"
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
            emptyTitle="Belum ada opname stok"
            emptyDescription="Buat opname untuk menghitung stok fisik di gudang."
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
        isLoading={voidOpname.isPending}
      />
    </>
  )
}
