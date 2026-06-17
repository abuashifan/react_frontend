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
import { useCashPaymentList, useCashPaymentMutations } from '../hooks/useCashBankList'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { CashPayment, CashBankStatus } from '../types/cashBank.types'

const STATUSES: CashBankStatus[] = ['draft', 'posted', 'void']
const FILTER_HINT = 'Filter multi-select dan tanggal berlaku pada data halaman yang sedang dimuat.'

export default function CashPaymentListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [filterStatuses, setFilterStatuses] = useState<CashBankStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidPayment } = useCashPaymentMutations()

  const { data, isLoading, isFetching } = useCashPaymentList({ page: page + 1, per_page: 25 })
  const rows = data?.data ?? []
  const visibleRows = useMemo(
    () =>
      rows.filter((payment) => {
        const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(payment.status)
        const matchesDate = isDateInRange(payment.payment_date, dateRange.from, dateRange.to)
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
        const eligible = visibleRows.filter((payment) => ids.includes(String(payment.id)) && payment.status !== 'void')
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
    const selectedPayments = visibleRows.filter((payment) => bulkVoidIds.includes(String(payment.id)))
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

      if (failureCount === 0) {
        toast.success(`${successCount} pengeluaran kas berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} pengeluaran kas.`)
      } else {
        toast.warning(`${successCount} pengeluaran kas berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
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
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/cash-bank/cash-payments/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.payment_date) },
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
        title="Pengeluaran Kas"
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Pengeluaran Kas' }]}
        sidebar={sidebar}
        action={
          <PermissionGuard permission="cash_bank.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/cash-bank/cash-payments/create')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat Pengeluaran
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
            ? (visibleRows.find((row) => String(row.id) === bulkVoidIds[0])?.number ?? '1 dokumen terpilih')
            : `${bulkVoidIds.length} dokumen terpilih`
        }
        isLoading={voidPayment.isPending}
      />
    </>
  )
}
