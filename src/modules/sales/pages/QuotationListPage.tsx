import { useState } from 'react'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useQuotationList } from '../hooks/useQuotationList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { SalesQuotation } from '../types/quotation.types'
import type { QuotationStatus } from '../types/quotation.types'
const STATUSES: QuotationStatus[] = ['draft', 'sent', 'approved', 'accepted', 'rejected', 'cancelled', 'converted']

export default function QuotationListPage() {
  const { openRecordTab } = useRecordTab()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<QuotationStatus | undefined>()
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [search, setSearch] = useState('')
  const [prevFilters, setPrevFilters] = useState('')
  // Seluruh filter dikirim ke server, jadi perubahannya harus mengembalikan
  // halaman ke 1 -- memfilter dari halaman jauh akan mendarat di daftar kosong.
  const filterKey = `${search}|${String(filterStatus)}|${dateRange.from}|${dateRange.to}|${String(filterCustomer)}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(0)
  }

  const { data, isLoading, isFetching } = useQuotationList({
    page: page + 1,
    per_page: 25,
    search: search || undefined,
    status: filterStatus,
    customer_id: filterCustomer ?? undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  })

  const activeFilters = [filterStatus, filterCustomer, dateRange.from, dateRange.to].filter(Boolean).length
  const columns: ColumnDef<SalesQuotation>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button
          type="button"
          onClick={() => openRecordTab({ label: original.number, path: `/sales/quotations/${original.id}` })}
          className="font-medium text-[#5c9ead] hover:underline"
        >
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'customer', header: 'Customer', size: 200, cell: ({ original }) => original.customer?.name ?? '-' },
    {
      id: 'expiry_date',
      header: 'Exp. Date',
      size: 110,
      cell: ({ original }) => original.expiry_date ? formatDate(original.expiry_date) : '-',
    },
    {
      id: 'grand_total',
      header: 'Total',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.grand_total),
    },
    {
      id: 'status',
      header: 'Status',
      size: 120,
      cell: ({ original }) => <DocumentStatusBadge status={original.status} />,
    },
  ]

  const sidebar = (
    <FilterSidebar activeCount={activeFilters} onReset={() => { setFilterStatus(undefined); setFilterCustomer(null); setDateRange({ from: '', to: '' }) }}>
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari nomor quotation, customer..."
          className="w-full max-w-none"
        />
      </div>
      <FilterSection title="Status">
        {STATUSES.map((s) => (
          <label key={s} className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={filterStatus === s} onCheckedChange={(c) => setFilterStatus(c ? s : undefined)} />
            <span className="text-[12px] text-[#334155] capitalize">{s}</span>
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
      <DateRangeFilterSection
        title="Tanggal"
        from={dateRange.from}
        to={dateRange.to}
        onChange={setDateRange}
      />
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Quotation"
      breadcrumb={[{ label: 'Sales' }, { label: 'Quotation' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="sales.quotations.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={() => openRecordTab({ label: 'Quotation Baru', path: '/sales/quotations/create' })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Buat Quotation
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: page, pageSize: 25 }}
        onPaginationChange={(p) => setPage(p.pageIndex)}
        emptyTitle="Belum ada quotation"
        emptyDescription="Buat quotation pertama untuk memulai proses penjualan."
      />
    </WorkspaceLayout>
  )
}
