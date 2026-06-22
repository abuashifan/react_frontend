import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useBankReconciliationList } from '../hooks/useCashBankList'
import { cashBankAccountApi } from '../services/cashBankApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { BankReconciliation } from '../types/cashBank.types'

export default function BankReconciliationListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const query = useBankReconciliationList({
    page: page + 1,
    per_page: pageSize,
    search: deferredSearch || undefined,
    cash_bank_account_id: accountId ?? undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  })

  const columns: ColumnDef<BankReconciliation>[] = [
    { id: 'number', header: 'Nomor', size: 140, meta: { sticky: true, stickyLeft: 0 }, cell: ({ original }) => <button type="button" onClick={() => navigate(`/cash-bank/bank-reconciliations/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">{original.number}</button> },
    { id: 'account', header: 'Akun Bank', size: 180, cell: ({ original }) => original.cash_bank_account ? `${original.cash_bank_account.code} · ${original.cash_bank_account.name}` : '-' },
    { id: 'start', header: 'Tgl Mulai', size: 110, cell: ({ original }) => formatDate(original.statement_start_date) },
    { id: 'end', header: 'Tgl Akhir', size: 110, cell: ({ original }) => formatDate(original.statement_end_date) },
    { id: 'opening_balance', header: 'Saldo Awal', size: 140, meta: { className: 'tabular-nums text-right' }, cell: ({ original }) => formatCurrency(original.statement_opening_balance) },
    { id: 'ending_balance', header: 'Saldo Akhir', size: 140, meta: { className: 'tabular-nums text-right' }, cell: ({ original }) => formatCurrency(original.statement_ending_balance) },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const resetPage = () => setPage(0)
  const sidebar = (
    <FilterSidebar
      activeCount={[accountId, dateRange.from, dateRange.to].filter(Boolean).length}
      onReset={() => {
        setAccountId(null)
        setDateRange({ from: '', to: '' })
        resetPage()
      }}
      hint="Filter akun dan periode diterapkan server-side."
    >
      <div className="space-y-1">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Bank</Label>
        <SearchableSelect value={accountId} onChange={(value) => { setAccountId(value); resetPage() }} onSearch={cashBankAccountApi.search} placeholder="Semua akun" ariaLabel="Filter akun rekonsiliasi" />
      </div>
      <DateRangeFilterSection from={dateRange.from} to={dateRange.to} onChange={(next) => { setDateRange(next); resetPage() }} note="Mencari periode statement yang beririsan." />
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Rekonsiliasi Bank"
      breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Rekonsiliasi Bank' }]}
      sidebar={sidebar}
      action={<PermissionGuard permission="cash_bank.create"><Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/cash-bank/bank-reconciliations/create')}><Plus className="mr-1 h-3.5 w-3.5" /> Buat Rekonsiliasi</Button></PermissionGuard>}
    >
      <Input type="search" value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="Cari nomor, akun, atau catatan..." aria-label="Cari rekonsiliasi bank" className="mb-3 h-9 max-w-md text-[13px]" />
      {query.isError ? (
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Rekonsiliasi bank gagal dimuat" />
      ) : (
        <DataTable
          data={query.data?.data ?? []}
          columns={columns}
          totalRows={query.data?.meta.total ?? 0}
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          pagination={{ pageIndex: page, pageSize }}
          onPaginationChange={(state) => {
            setPage(state.pageIndex)
            setPageSize(state.pageSize as 25 | 50 | 100)
          }}
          emptyTitle="Belum ada rekonsiliasi bank"
          emptyDescription="Rekonsiliasi saldo buku dengan rekening koran."
        />
      )}
    </WorkspaceLayout>
  )
}
