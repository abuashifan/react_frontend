import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { ListExportButton, type ExportColumn } from '@/components/shared/table/ListExportButton'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { MultiCheckboxFilter } from '@/components/shared/filter/MultiCheckboxFilter'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage, getBulkFailureDetail } from '@/lib/apiError'
import { useSalesReceiptList, useSalesReceiptMutations } from '../hooks/useSalesReceiptList'
import { salesReceiptApi } from '../services/salesReceiptApi'
import { toExcelDate } from '@/lib/exportXlsx'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { SalesReceipt, SalesReceiptStatus } from '../types/salesReceipt.types'

const STATUSES: SalesReceiptStatus[] = ['draft', 'posted', 'void']
/**
 * Kolom file ekspor: sama dengan kolom tabel, ditambah `ID` di depan.
 * ID dibutuhkan supaya baris hasil ekspor bisa dicocokkan kembali dengan
 * record di sistem (impor balik, rekonsiliasi manual, tiket dukungan).
 */
const EXPORT_COLUMNS: ExportColumn<SalesReceipt>[] = [
  { header: 'ID', value: (row) => row.id },
  { header: 'Nomor', value: (row) => row.number },
  { header: 'Tanggal', value: (row) => toExcelDate(row.date), format: 'date' },
  { header: 'Customer', value: (row) => row.customer?.name },
  { header: 'Akun', value: (row) => row.cash_bank_account?.name },
  { header: 'Jumlah', value: (row) => row.amount, format: 'currency' },
  { header: 'Status', value: (row) => row.status },
]

export default function SalesReceiptListPage() {
  const { openRecordTab } = useRecordTab()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [filterStatuses, setFilterStatuses] = useState<SalesReceiptStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [prevFilters, setPrevFilters] = useState('')
  // Semua filter kini dikirim ke server, jadi perubahannya harus
  // mengembalikan halaman ke 1 -- kalau tidak, memfilter dari halaman jauh
  // akan mendarat di daftar kosong.
  const filterKey = `${search}|${filterStatuses.join(',')}|${dateRange.from}|${dateRange.to}|${String(filterCustomer)}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(0)
  }
  const { void: voidReceipt } = useSalesReceiptMutations()

  // Dipisah dari page/per_page supaya tombol ekspor memakai filter yang PERSIS
  // sama dengan tabel.
  const listParams = {
    search: search || undefined,
    customer_id: filterCustomer ?? undefined,
    status: filterStatuses.length > 0 ? filterStatuses.join(',') : undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  }

  const { data, isLoading, isFetching } = useSalesReceiptList({
    page: page + 1,
    per_page: 25,
    ...listParams,
  })

  const rows = useMemo(() => data?.data ?? [], [data])

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
        const eligible = rows.filter((receipt) => ids.includes(String(receipt.id)) && receipt.status !== 'void')
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
    const selectedReceipts = rows.filter((receipt) => bulkVoidIds.includes(String(receipt.id)))
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
      const failureDetail = getBulkFailureDetail(results)

      if (failureCount === 0) {
        toast.success(`${successCount} penerimaan penjualan berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} penerimaan penjualan.${failureDetail ? ` ${failureDetail}` : ''}`)
      } else {
        toast.warning(`${successCount} penerimaan penjualan berhasil di-void, ${failureCount} gagal.${failureDetail ? ` ${failureDetail}` : ''}`)
      }
    } catch (bulkError) {
      toast.error(getApiErrorMessage(bulkError, 'Gagal memproses bulk void.'))
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
        <button type="button" onClick={() => openRecordTab({ label: original.number, path: `/sales/receipts/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">
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
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari nomor penerimaan, customer..."
          className="w-full max-w-none"
        />
      </div>
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
          <>
            <ListExportButton
              filename="penerimaan-penjualan"
              sheetName="Penerimaan"
              columns={EXPORT_COLUMNS}
              totalRows={data?.meta.total}
              fetchPage={(exportPage, exportPerPage) => salesReceiptApi.list({ ...listParams, page: exportPage, per_page: exportPerPage })}
            />
            <PermissionGuard permission="sales.receipts.create">
              <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => openRecordTab({ label: 'Penerimaan Baru', path: '/sales/receipts/create' })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Catat Penerimaan
              </Button>
            </PermissionGuard>
          </>
        }
      >
        <DataTable
          data={rows}
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
            ? (rows.find((row) => String(row.id) === bulkVoidIds[0])?.number ?? '1 dokumen terpilih')
            : `${bulkVoidIds.length} dokumen terpilih`
        }
        isLoading={voidReceipt.isPending}
      />
    </>
  )
}
