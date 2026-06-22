import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useCustomerDepositList } from '../hooks/useCustomerDepositList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { CustomerDeposit, CustomerDepositStatus } from '../types/customerDeposit.types'

const STATUSES: CustomerDepositStatus[] = ['draft', 'posted', 'partially_allocated', 'fully_allocated', 'refunded', 'void']

export default function CustomerDepositListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filterStatus, setFilterStatus] = useState<CustomerDepositStatus | undefined>()
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null)

  const query = useCustomerDepositList({
    page: page + 1,
    per_page: perPage,
    search: deferredSearch || undefined,
    status: filterStatus,
    customer_id: filterCustomer ?? undefined,
  })
  const { data, isLoading, isFetching } = query

  const activeFilters = [filterStatus, filterCustomer].filter(Boolean).length

  const columns: ColumnDef<CustomerDeposit>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/sales/customer-deposits/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'customer', header: 'Customer', size: 180, cell: ({ original }) => original.customer?.name ?? '-' },
    {
      id: 'amount',
      header: 'Jumlah',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.amount),
    },
    {
      id: 'remaining_amount',
      header: 'Sisa',
      size: 120,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.remaining_amount),
    },
    {
      id: 'status',
      header: 'Status',
      size: 130,
      cell: ({ original }) => <DocumentStatusBadge status={original.status} />,
    },
  ]

  const sidebar = (
    <FilterSidebar activeCount={activeFilters} onReset={() => { setFilterStatus(undefined); setFilterCustomer(null) }}>
      <FilterSection title="Status">
        {STATUSES.map((s) => (
          <label key={s} className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={filterStatus === s} onCheckedChange={(c) => setFilterStatus(c ? s : undefined)} />
            <span className="text-[12px] text-[#334155] capitalize">{s.replace(/_/g, ' ')}</span>
          </label>
        ))}
      </FilterSection>
      <FilterSection title="Customer">
        <SearchableSelect
          value={filterCustomer}
          onChange={(v) => setFilterCustomer(v)}
          onSearch={(q) => kontakApi.search(q, 'customer')}
          placeholder="Semua customer"
        />
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Deposit Customer"
      breadcrumb={[{ label: 'Sales' }, { label: 'Deposit Customer' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="sales.deposits.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={() => navigate('/sales/customer-deposits/create')}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Buat Deposit
          </Button>
        </PermissionGuard>
      }
    >
      <div className="relative mb-3 max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
        <Input
          type="search"
          role="searchbox"
          aria-label="Cari nomor deposit"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Cari nomor deposit..."
          className="h-9 pl-8 text-[13px]"
        />
      </div>
      {query.isError ? (
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Deposit gagal dimuat" />
      ) : (
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          totalRows={data?.meta.total ?? 0}
          isLoading={isLoading}
          isFetching={isFetching}
          pagination={{ pageIndex: page, pageSize: perPage }}
          onPaginationChange={(p) => { setPage(p.pageIndex); setPerPage(p.pageSize as 25 | 50 | 100) }}
          emptyTitle="Belum ada deposit customer"
          emptyDescription="Catat uang muka/deposit dari customer."
        />
      )}
    </WorkspaceLayout>
  )
}
