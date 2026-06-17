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
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useSalesInvoiceList, useSalesInvoiceMutations } from '../hooks/useSalesInvoiceList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { SalesInvoice, SalesInvoiceStatus } from '../types/salesInvoice.types'

const STATUSES: SalesInvoiceStatus[] = ['draft', 'approved', 'posted', 'partially_paid', 'paid', 'void']
const FILTER_HINT = 'Filter multi-select dan tanggal berlaku pada data halaman yang sedang dimuat.'

function isOverdue(invoice: SalesInvoice): boolean {
  if (!invoice.due_date) return false
  if (invoice.balance_due <= 0) return false
  return new Date(invoice.due_date) < new Date()
}

export default function SalesInvoiceListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [filterStatuses, setFilterStatuses] = useState<SalesInvoiceStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidInvoice } = useSalesInvoiceMutations()

  const { data, isLoading, isFetching } = useSalesInvoiceList({
    page: page + 1,
    per_page: 25,
    customer_id: filterCustomer ?? undefined,
  })

  const rows = data?.data ?? []
  const visibleRows = useMemo(
    () =>
      rows.filter((invoice) => {
        const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(invoice.status)
        const matchesDate = isDateInRange(invoice.date, dateRange.from, dateRange.to)
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
      permission: 'sales.invoices.void',
      onClick: (ids) => {
        const eligible = visibleRows.filter((invoice) => ids.includes(String(invoice.id)) && invoice.status !== 'void')
        if (eligible.length === 0) {
          toast.warning('Dokumen yang dipilih tidak bisa di-void.')
          return
        }
        setBulkVoidIds(eligible.map((invoice) => String(invoice.id)))
        setBulkVoidOpen(true)
      },
    },
  ]

  const handleBulkVoid = async (reason: string) => {
    const selectedInvoices = visibleRows.filter((invoice) => bulkVoidIds.includes(String(invoice.id)))
    if (selectedInvoices.length === 0) {
      toast.warning('Tidak ada invoice valid untuk di-void.')
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      return
    }

    try {
      const results = await Promise.allSettled(
        selectedInvoices.map((invoice) => voidInvoice.mutateAsync({ id: Number(invoice.id), reason })),
      )
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (failureCount === 0) {
        toast.success(`${successCount} invoice berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} invoice.`)
      } else {
        toast.warning(`${successCount} invoice berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<SalesInvoice>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/sales/invoices/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'customer', header: 'Customer', size: 180, cell: ({ original }) => original.customer?.name ?? '-' },
    {
      id: 'due_date',
      header: 'Jatuh Tempo',
      size: 120,
      cell: ({ original }) => (
        <span className={cn(isOverdue(original) && 'text-[#991B1B] font-medium')}>
          {original.due_date ? formatDate(original.due_date) : '-'}
        </span>
      ),
    },
    {
      id: 'grand_total',
      header: 'Total',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.grand_total),
    },
    {
      id: 'paid_amount',
      header: 'Dibayar',
      size: 120,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => <span className="text-[#065F46]">{formatCurrency(original.paid_amount)}</span>,
    },
    {
      id: 'balance_due',
      header: 'Sisa',
      size: 120,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => (
        <span className={cn(original.balance_due > 0 && isOverdue(original) ? 'text-[#991B1B] font-medium' : original.balance_due > 0 ? 'text-[#24323a]' : 'text-[#065F46]')}>
          {formatCurrency(original.balance_due)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      size: 130,
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
        options={STATUSES.map((status) => ({ value: status, label: status.replace('_', ' ') }))}
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
        title="Invoice Penjualan"
        breadcrumb={[{ label: 'Sales' }, { label: 'Invoice Penjualan' }]}
        sidebar={sidebar}
        action={
          <PermissionGuard permission="sales.invoices.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/sales/invoices/create')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat Invoice
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
          emptyTitle="Belum ada invoice penjualan"
          emptyDescription="Buat invoice dari sales order, delivery order, atau manual."
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
        isLoading={voidInvoice.isPending}
      />
    </>
  )
}
