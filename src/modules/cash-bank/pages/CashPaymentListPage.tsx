import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { ListExportButton, type ExportColumn } from '@/components/shared/table/ListExportButton'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { MultiCheckboxFilter } from '@/components/shared/filter/MultiCheckboxFilter'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage, getBulkFailureDetail } from '@/lib/apiError'
import { useListSort } from '@/hooks/useListSort'
import { useCashPaymentList, useCashPaymentMutations } from '../hooks/useCashBankList'
import { cashPaymentApi } from '../services/cashBankApi'
import { toExcelDate } from '@/lib/exportXlsx'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { CashPayment, CashBankStatus } from '../types/cashBank.types'
import { useRecordTab } from '@/hooks/useRecordTab'

const STATUSES: CashBankStatus[] = ['draft', 'posted', 'void']
/**
 * Kolom file ekspor: sama dengan kolom tabel, ditambah `ID` di depan.
 * ID dibutuhkan supaya baris hasil ekspor bisa dicocokkan kembali dengan
 * record di sistem (impor balik, rekonsiliasi manual, tiket dukungan).
 */
const EXPORT_COLUMNS: ExportColumn<CashPayment>[] = [
  { header: 'ID', value: (row) => row.id },
  { header: 'Nomor', value: (row) => row.number },
  { header: 'Tanggal', value: (row) => toExcelDate(row.payment_date), format: 'date' },
  { header: 'Akun Kas/Bank', value: (row) => row.cash_bank_account?.name },
  { header: 'Kontak', value: (row) => row.contact?.name },
  { header: 'Catatan', value: (row) => row.notes },
  { header: 'Jumlah', value: (row) => row.amount, format: 'currency' },
  { header: 'Status', value: (row) => row.status },
  { header: 'Dibuat Oleh', value: (row) => row.created_by_name },
]

export default function CashPaymentListPage() {
  const { openRecordTab } = useRecordTab()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [prevFilters, setPrevFilters] = useState('')
  const [filterStatuses, setFilterStatuses] = useState<CashBankStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidPayment } = useCashPaymentMutations()

  // Sorting dilakukan server-side; nilai `key` harus cocok dengan allowlist
  // `$listSortable` di CashPaymentService.
  const { sort, toggleSort, setSort, sortParams } = useListSort({ key: 'payment_date', direction: 'desc' })

  // Semua filter kini dikirim ke server, jadi perubahannya harus
  // mengembalikan halaman ke 1 -- kalau tidak, memfilter dari halaman jauh
  // akan mendarat di daftar kosong.
  const filterKey = `${search}|${filterStatuses.join(',')}|${dateRange.from}|${dateRange.to}|${sort?.key ?? ''}|${sort?.direction ?? ''}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(0)
    setSelectedRows([])
  }

  // Dipisah dari page/per_page supaya tombol ekspor memakai filter DAN urutan
  // yang persis sama dengan tabel.
  const listParams = {
    search: search || undefined,
    status: filterStatuses.length > 0 ? filterStatuses.join(',') : undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
    ...sortParams,
  }

  const { data, isLoading, isFetching } = useCashPaymentList({
    page: page + 1,
    per_page: 25,
    ...listParams,
  })
  const rows = useMemo(() => data?.data ?? [], [data])

  const activeFilters = [filterStatuses.length > 0, dateRange.from, dateRange.to].filter(Boolean).length

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
      permission: 'cash_bank.void',
      onClick: (ids) => {
        const eligible = rows.filter((payment) => ids.includes(String(payment.id)) && payment.status !== 'void')
        if (eligible.length === 0) {
          toast.warning('Dokumen yang dipilih tidak bisa di-void.')
          return
        }
        setBulkVoidIds(eligible.map((payment) => String(payment.id)))
        setBulkVoidOpen(true)
      },
    },
  ]

  const handleBulkVoid = async (reason: string) => {
    const selectedPayments = rows.filter((payment) => bulkVoidIds.includes(String(payment.id)))
    if (selectedPayments.length === 0) {
      toast.warning('Tidak ada pengeluaran kas valid untuk di-void.')
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      return
    }

    try {
      const results = await Promise.allSettled(
        selectedPayments.map((payment) => voidPayment.mutateAsync({ id: Number(payment.id), reason })),
      )
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failureCount = results.length - successCount
      const failureDetail = getBulkFailureDetail(results)

      if (failureCount === 0) {
        toast.success(`${successCount} pengeluaran kas berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} pengeluaran kas.${failureDetail ? ` ${failureDetail}` : ''}`)
      } else {
        toast.warning(`${successCount} pengeluaran kas berhasil di-void, ${failureCount} gagal.${failureDetail ? ` ${failureDetail}` : ''}`)
      }
    } catch (bulkError) {
      toast.error(getApiErrorMessage(bulkError, 'Gagal memproses bulk void.'))
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<CashPayment>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      sortable: true,
      sortKey: 'payment_number',
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => openRecordTab({ label: original.number, path: `/cash-bank/cash-payments/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, sortable: true, sortKey: 'payment_date', cell: ({ original }) => formatDate(original.payment_date) },
    { id: 'contact', header: 'Kontak', size: 160, cell: ({ original }) => original.contact?.name ?? '-' },
    {
      id: 'notes',
      header: 'Catatan',
      size: 200,
      cell: ({ original }) => (
        <span className="block max-w-[200px] truncate" title={original.notes ?? undefined}>
          {original.notes ?? '-'}
        </span>
      ),
    },
    { id: 'amount', header: 'Jumlah', size: 140, sortable: true, sortKey: 'amount', meta: { className: 'tabular-nums text-right' }, cell: ({ original }) => formatCurrency(original.amount) },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
    {
      id: 'created_by',
      header: 'Dibuat Oleh',
      size: 90,
      cell: ({ original }) => (
        <span className="block max-w-[90px] truncate text-[#64748b]" title={original.created_by_name ?? undefined}>
          {original.created_by_name ?? '-'}
        </span>
      ),
    },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilters}
      onReset={() => {
        setFilterStatuses([])
        setDateRange({ from: '', to: '' })
        setSort({ key: 'payment_date', direction: 'desc' })
        resetSelection()
      }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari pengeluaran kas..."
          hint="Mencari di nomor dokumen dan catatan."
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
    </FilterSidebar>
  )

  return (
    <>
      <WorkspaceLayout
        title="Pengeluaran Kas"
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Pengeluaran Kas' }]}
        sidebar={sidebar}
        action={
          <>
            <ListExportButton
              filename="pengeluaran-kas"
              sheetName="Pengeluaran Kas"
              columns={EXPORT_COLUMNS}
              totalRows={data?.meta.total}
              fetchPage={(exportPage, exportPerPage) => cashPaymentApi.list({ ...listParams, page: exportPage, per_page: exportPerPage })}
            />
            <PermissionGuard permission="cash_bank.create">
              <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => openRecordTab({ label: 'Pengeluaran Baru', path: '/cash-bank/cash-payments/create' })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Buat Pengeluaran
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
          sort={sort}
          onSortChange={toggleSort}
          selectedRows={selectedRows}
          onRowSelect={setSelectedRows}
          bulkActions={bulkActions}
          emptyTitle="Belum ada pengeluaran kas"
          emptyDescription="Catat pengeluaran kas atau pembayaran."
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
        isLoading={voidPayment.isPending}
      />
    </>
  )
}
