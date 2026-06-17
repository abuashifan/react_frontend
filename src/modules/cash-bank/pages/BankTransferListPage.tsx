import { useMemo, useState } from 'react'
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
import { isDateInRange } from '@/components/shared/filter/dateRangeUtils'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useBankTransferList, useBankTransferMutations } from '../hooks/useCashBankList'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { BankTransfer, CashBankStatus } from '../types/cashBank.types'

const STATUSES: CashBankStatus[] = ['draft', 'posted', 'void']
const FILTER_HINT = 'Filter multi-select dan tanggal berlaku pada data halaman yang sedang dimuat.'

export default function BankTransferListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [filterStatuses, setFilterStatuses] = useState<CashBankStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidTransfer } = useBankTransferMutations()

  const { data, isLoading, isFetching } = useBankTransferList({ page: page + 1, per_page: 25 })
  const rows = data?.data ?? []
  const visibleRows = useMemo(
    () =>
      rows.filter((transfer) => {
        const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(transfer.status)
        const matchesDate = isDateInRange(transfer.transfer_date, dateRange.from, dateRange.to)
        return matchesStatus && matchesDate
      }),
    [rows, filterStatuses, dateRange.from, dateRange.to],
  )

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
        const eligible = visibleRows.filter((transfer) => ids.includes(String(transfer.id)) && transfer.status !== 'void')
        if (eligible.length === 0) {
          toast.warning('Dokumen yang dipilih tidak bisa di-void.')
          return
        }
        setBulkVoidIds(eligible.map((transfer) => String(transfer.id)))
        setBulkVoidOpen(true)
      },
    },
  ]

  const handleBulkVoid = async (reason: string) => {
    const selectedTransfers = visibleRows.filter((transfer) => bulkVoidIds.includes(String(transfer.id)))
    if (selectedTransfers.length === 0) {
      toast.warning('Tidak ada transfer bank valid untuk di-void.')
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      return
    }

    try {
      const results = await Promise.allSettled(
        selectedTransfers.map((transfer) => voidTransfer.mutateAsync({ id: Number(transfer.id), reason })),
      )
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (failureCount === 0) {
        toast.success(`${successCount} transfer bank berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} transfer bank.`)
      } else {
        toast.warning(`${successCount} transfer bank berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<BankTransfer>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/cash-bank/bank-transfers/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.transfer_date) },
    { id: 'from', header: 'Dari Akun', size: 180, cell: ({ original }) => original.from_cash_bank_account?.name ?? '-' },
    { id: 'to', header: 'Ke Akun', size: 180, cell: ({ original }) => original.to_cash_bank_account?.name ?? '-' },
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
    </FilterSidebar>
  )

  return (
    <>
      <WorkspaceLayout
        title="Transfer Bank"
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Transfer Bank' }]}
        sidebar={sidebar}
        action={
          <PermissionGuard permission="cash_bank.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/cash-bank/bank-transfers/create')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat Transfer
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
          emptyTitle="Belum ada transfer bank"
          emptyDescription="Catat transfer antar akun kas/bank."
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
        isLoading={voidTransfer.isPending}
      />
    </>
  )
}
