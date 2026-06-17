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
import { useSalesReceiptList, useSalesReceiptMutations } from '../hooks/useSalesReceiptList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { SalesReceipt, SalesReceiptStatus } from '../types/salesReceipt.types'

const STATUSES: SalesReceiptStatus[] = ['draft', 'posted', 'void']
const FILTER_HINT = 'Filter multi-select dan tanggal berlaku pada data halaman yang sedang dimuat.'

export default function SalesReceiptListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [filterStatuses, setFilterStatuses] = useState<SalesReceiptStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidReceipt } = useSalesReceiptMutations()

  const { data, isLoading, isFetching } = useSalesReceiptList({
    page: page + 1,
    per_page: 25,
    customer_id: filterCustomer ?? undefined,
  })

  const rows = data?.data ?? []
  const visibleRows = useMemo(
    () =>
      rows.filter((receipt) => {
        const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(receipt.status)
        const matchesDate = isDateInRange(receipt.date, dateRange.from, dateRange.to)
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
      permission: 'sales.receipts.void',
      onClick: (ids) => {
        const eligible = visibleRows.filter((receipt) => ids.includes(String(receipt.id)) && receipt.status !== 'void')
        if (eligible.length === 0) {
          toast.warning('Dokumen yang dipilih tidak bisa di-void.')
          return
        }
        setBulkVoidIds(eligible.map((receipt) => String(receipt.id)))
        setBulkVoidOpen(true)
      },
    },
  ]

  const handleBulkVoid = async (reason: string) => {
    const selectedReceipts = visibleRows.filter((receipt) => bulkVoidIds.includes(String(receipt.id)))
    if (selectedReceipts.length === 0) {
      toast.warning('Tidak ada penerimaan penjualan valid untuk di-void.')
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      return
    }

    try {
      const results = await Promise.allSettled(
        selectedReceipts.map((receipt) => voidReceipt.mutateAsync({ id: Number(receipt.id), reason })),
      )
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (failureCount === 0) {
        toast.success(`${successCount} penerimaan penjualan berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} penerimaan penjualan.`)
      } else {
        toast.warning(`${successCount} penerimaan penjualan berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<SalesReceipt>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/sales/receipts/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'customer', header: 'Customer', size: 180, cell: ({ original }) => original.customer?.name ?? '-' },
    { id: 'account', header: 'Akun', size: 150, cell: ({ original }) => original.cash_bank_account?.name ?? '-' },
    {
      id: 'amount',
      header: 'Jumlah',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.amount),
    },
    {
      id: 'status',
      header: 'Status',
      size: 100,
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
        title="Penerimaan Penjualan"
        breadcrumb={[{ label: 'Sales' }, { label: 'Penerimaan' }]}
        sidebar={sidebar}
        action={
          <PermissionGuard permission="sales.receipts.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/sales/receipts/create')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Catat Penerimaan
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
          emptyTitle="Belum ada penerimaan"
          emptyDescription="Catat pembayaran yang diterima dari customer."
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
        isLoading={voidReceipt.isPending}
      />
    </>
  )
}
