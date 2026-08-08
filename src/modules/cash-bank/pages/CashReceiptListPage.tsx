import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
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
import { useCashReceiptList, useCashReceiptMutations } from '../hooks/useCashBankList'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { CashReceipt, CashBankStatus } from '../types/cashBank.types'
import { useRecordTab } from '@/hooks/useRecordTab'

const STATUSES: CashBankStatus[] = ['draft', 'posted', 'void']
export default function CashReceiptListPage() {
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
  const { void: voidReceipt } = useCashReceiptMutations()

  const resetSelection = () => {
    setPage(0)
    setSelectedRows([])
  }

  // Semua filter kini dikirim ke server, jadi perubahannya harus
  // mengembalikan halaman ke 1 -- kalau tidak, memfilter dari halaman jauh
  // akan mendarat di daftar kosong.
  const filterKey = `${search}|${filterStatuses.join(',')}|${dateRange.from}|${dateRange.to}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(0)
    setSelectedRows([])
  }

  const { data, isLoading, isFetching } = useCashReceiptList({
    page: page + 1,
    per_page: 25,
    search: search || undefined,
    status: filterStatuses.length > 0 ? filterStatuses.join(',') : undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  })
  const rows = useMemo(() => data?.data ?? [], [data])

  const activeFilters = [filterStatuses.length > 0, dateRange.from, dateRange.to].filter(Boolean).length

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-void',
      label: 'Void Terpilih',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'cash_bank.void',
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
      toast.warning('Tidak ada penerimaan kas valid untuk di-void.')
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
        toast.success(`${successCount} penerimaan kas berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} penerimaan kas.${failureDetail ? ` ${failureDetail}` : ''}`)
      } else {
        toast.warning(`${successCount} penerimaan kas berhasil di-void, ${failureCount} gagal.${failureDetail ? ` ${failureDetail}` : ''}`)
      }
    } catch (bulkError) {
      toast.error(getApiErrorMessage(bulkError, 'Gagal memproses bulk void.'))
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<CashReceipt>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => openRecordTab({ label: original.number, path: `/cash-bank/cash-receipts/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.receipt_date) },
    { id: 'account', header: 'Akun Kas/Bank', size: 180, cell: ({ original }) => original.cash_bank_account?.name ?? '-' },
    { id: 'contact', header: 'Kontak', size: 160, cell: ({ original }) => original.contact?.name ?? '-' },
    { id: 'amount', header: 'Jumlah', size: 140, meta: { className: 'tabular-nums text-right' }, cell: ({ original }) => formatCurrency(original.amount) },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilters}
      onReset={() => {
        setFilterStatuses([])
        setDateRange({ from: '', to: '' })
        resetSelection()
      }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari nomor penerimaan..."
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
        title="Penerimaan Kas"
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Penerimaan Kas' }]}
        sidebar={sidebar}
        action={
          <PermissionGuard permission="cash_bank.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => openRecordTab({ label: 'Penerimaan Baru', path: '/cash-bank/cash-receipts/create' })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat Penerimaan
            </Button>
          </PermissionGuard>
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
          emptyTitle="Belum ada penerimaan kas"
          emptyDescription="Catat penerimaan kas atau transfer masuk."
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
