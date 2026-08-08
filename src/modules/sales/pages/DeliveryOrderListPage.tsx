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
import { formatDate } from '@/lib/utils'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useDeliveryOrderList } from '../hooks/useDeliveryOrderList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { DeliveryOrder, DeliveryOrderStatus } from '../types/deliveryOrder.types'

const STATUSES: DeliveryOrderStatus[] = ['draft', 'ready', 'shipped', 'delivered', 'void', 'cancelled']

export default function DeliveryOrderListPage() {
  const { openRecordTab } = useRecordTab()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<DeliveryOrderStatus | undefined>()
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

  const { data, isLoading, isFetching } = useDeliveryOrderList({
    page: page + 1,
    per_page: 25,
    search: search || undefined,
    status: filterStatus,
    customer_id: filterCustomer ?? undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  })

  const activeFilters = [filterStatus, filterCustomer, dateRange.from, dateRange.to].filter(Boolean).length

  const columns: ColumnDef<DeliveryOrder>[] = [
    {
      id: 'number',
      header: 'Nomor DO',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => openRecordTab({ label: original.number, path: `/sales/delivery-orders/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'customer', header: 'Customer', size: 180, cell: ({ original }) => original.customer?.name ?? '-' },
    { id: 'sales_order', header: 'Sales Order', size: 130, cell: ({ original }) => original.sales_order_number ?? '-' },
    { id: 'warehouse', header: 'Gudang', size: 130, cell: ({ original }) => original.warehouse?.name ?? '-' },
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
          placeholder="Cari nomor DO, customer..."
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
      title="Delivery Order"
      breadcrumb={[{ label: 'Sales' }, { label: 'Delivery Order' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="sales.delivery-orders.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={() => openRecordTab({ label: 'Delivery Order Baru', path: '/sales/delivery-orders/create' })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Buat DO
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
        emptyTitle="Belum ada delivery order"
        emptyDescription="Buat delivery order dari sales order."
      />
    </WorkspaceLayout>
  )
}
