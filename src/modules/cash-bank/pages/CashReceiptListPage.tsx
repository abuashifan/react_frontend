import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { MultiCheckboxFilter } from '@/components/shared/filter/MultiCheckboxFilter'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useCashReceiptList, useCashReceiptMutations } from '../hooks/useCashBankList'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { CashReceipt, CashBankStatus } from '../types/cashBank.types'

const STATUSES: CashBankStatus[] = ['draft', 'posted', 'void']
export default function CashReceiptListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filterStatuses, setFilterStatuses] = useState<CashBankStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidReceipt } = useCashReceiptMutations()

  const query = useCashReceiptList({
    page: page + 1,
    per_page: pageSize,
    search: deferredSearch || undefined,
    statuses: filterStatuses.length ? filterStatuses : undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  })
  const { data, isLoading, isFetching } = query
  const visibleRows = data?.data ?? []

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

      if (failureCount === 0) {
        toast.success(`${successCount} penerimaan kas berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} penerimaan kas.`)
      } else {
        toast.warning(`${successCount} penerimaan kas berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
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
        <button type="button" onClick={() => navigate(`/cash-bank/cash-receipts/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
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
      hint="Filter diterapkan server-side sebelum pagination."
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
        note="Diterapkan ke seluruh dataset."
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
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/cash-bank/cash-receipts/create')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat Penerimaan
            </Button>
          </PermissionGuard>
        }
      >
        <Input type="search" value={search} onChange={(event) => { setSearch(event.target.value); resetSelection() }} placeholder="Cari nomor, kontak, atau catatan..." aria-label="Cari penerimaan kas" className="mb-3 h-9 max-w-md text-[13px]" />
        {query.isError ? <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Penerimaan kas gagal dimuat" /> : <DataTable
          data={visibleRows}
          columns={columns}
          totalRows={data?.meta.total ?? 0}
          isLoading={isLoading}
          isFetching={isFetching}
          pagination={{ pageIndex: page, pageSize }}
          onPaginationChange={(p) => {
            setPage(p.pageIndex)
            setPageSize(p.pageSize as 25 | 50 | 100)
            setSelectedRows([])
          }}
          selectedRows={selectedRows}
          onRowSelect={setSelectedRows}
          bulkActions={bulkActions}
          emptyTitle="Belum ada penerimaan kas"
          emptyDescription="Catat penerimaan kas atau transfer masuk."
        />}
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
