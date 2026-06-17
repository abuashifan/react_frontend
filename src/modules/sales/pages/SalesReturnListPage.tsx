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
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useSalesReturnList, useSalesReturnMutations } from '../hooks/useSalesReturnList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { SalesReturn, SalesReturnStatus } from '../types/salesReturn.types'

const STATUSES: SalesReturnStatus[] = ['draft', 'approved', 'posted', 'void']
const FILTER_HINT = 'Filter multi-select dan tanggal berlaku pada data halaman yang sedang dimuat.'

export default function SalesReturnListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [filterStatuses, setFilterStatuses] = useState<SalesReturnStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidReturn } = useSalesReturnMutations()

  const { data, isLoading, isFetching } = useSalesReturnList({
    page: page + 1,
    per_page: 25,
    customer_id: filterCustomer ?? undefined,
  })

  const rows = data?.data ?? []
  const visibleRows = useMemo(
    () =>
      rows.filter((salesReturn) => {
        const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(salesReturn.status)
        const matchesDate = isDateInRange(salesReturn.date, dateRange.from, dateRange.to)
        return matchesStatus && matchesDate
      }),
    [rows, filterStatuses, dateRange.from, dateRange.to],
  )

  const activeFilters = [filterStatuses.length > 0, dateRange.from, dateRange.to, filterCustomer].filter(Boolean).length

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
      permission: 'sales.returns.void',
      onClick: (ids) => {
        const eligible = visibleRows.filter((salesReturn) => ids.includes(String(salesReturn.id)) && salesReturn.status !== 'void')
        if (eligible.length === 0) {
          toast.warning('Dokumen yang dipilih tidak bisa di-void.')
          return
        }
        setBulkVoidIds(eligible.map((salesReturn) => String(salesReturn.id)))
        setBulkVoidOpen(true)
      },
    },
  ]

  const handleBulkVoid = async (reason: string) => {
    const selectedReturns = visibleRows.filter((salesReturn) => bulkVoidIds.includes(String(salesReturn.id)))
    if (selectedReturns.length === 0) {
      toast.warning('Tidak ada retur penjualan valid untuk di-void.')
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      return
    }

    try {
      const results = await Promise.allSettled(selectedReturns.map((salesReturn) => voidReturn.mutateAsync({ id: Number(salesReturn.id), reason })))
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (failureCount === 0) {
        toast.success(`${successCount} retur penjualan berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} retur penjualan.`)
      } else {
        toast.warning(`${successCount} retur penjualan berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<SalesReturn>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/sales/returns/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'customer', header: 'Customer', size: 180, cell: ({ original }) => original.customer?.name ?? '-' },
    {
      id: 'source',
      header: 'Sumber',
      size: 140,
      cell: ({ original }) => original.sales_invoice_number ?? original.delivery_order_number ?? '-',
    },
    {
      id: 'grand_total',
      header: 'Total',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.grand_total),
    },
    {
      id: 'status',
      header: 'Status',
      size: 110,
      cell: ({ original }) => <DocumentStatusBadge status={original.status} />,
    },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilters}
      onReset={() => {
        setFilterStatuses([])
        setDateRange({ from: '', to: '' })
        setFilterCustomer(null)
        resetSelection()
      }}
      hint={FILTER_HINT}
    >
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
      <FilterSection title="Customer">
        <SearchableSelect
          value={filterCustomer}
          onChange={(v) => {
            setFilterCustomer(v)
            resetSelection()
          }}
          onSearch={(q) => kontakApi.search(q, 'customer')}
          placeholder="Semua customer"
        />
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <>
      <WorkspaceLayout
        title="Retur Penjualan"
        breadcrumb={[{ label: 'Sales' }, { label: 'Retur Penjualan' }]}
        sidebar={sidebar}
        action={
          <PermissionGuard permission="sales.returns.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/sales/returns/create')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat Retur
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
          emptyTitle="Belum ada retur penjualan"
          emptyDescription="Catat pengembalian barang dari customer."
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
        isLoading={voidReturn.isPending}
      />
    </>
  )
}
