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
import { usePurchaseOrderList } from '../hooks/usePurchaseOrderList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { PurchaseOrder, PurchaseOrderStatus } from '../types/purchaseOrder.types'
import { useRecordTab } from '@/hooks/useRecordTab'

const STATUSES: PurchaseOrderStatus[] = ['draft', 'approved', 'confirmed', 'cancelled', 'closed']

export default function PurchaseOrderListPage() {
  const { openRecordTab } = useRecordTab()
  const [page, setPage] = useState(0)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [search, setSearch] = useState('')
  const [prevFilters, setPrevFilters] = useState('')
  const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | undefined>()
  const [filterVendor, setFilterVendor] = useState<number | null>(null)

  // Seluruh filter dikirim ke server, jadi perubahannya harus mengembalikan
  // halaman ke 1 -- memfilter dari halaman jauh akan mendarat di daftar kosong.
  const filterKey = `${search}|${String(filterStatus)}|${dateRange.from}|${dateRange.to}|${String(filterVendor)}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(0)
  }

  const { data, isLoading, isFetching } = usePurchaseOrderList({
    page: page + 1,
    per_page: 25,
    search: search || undefined,
    status: filterStatus,
    vendor_id: filterVendor ?? undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
  })

  const activeFilters = [filterStatus, filterVendor, dateRange.from, dateRange.to].filter(Boolean).length
  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      id: 'number',
      header: 'Nomor PO',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => openRecordTab({ label: original.number, path: `/purchase/orders/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'pr', header: 'Nomor PR', size: 130, cell: ({ original }) => original.purchase_request_number ?? '-' },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'vendor', header: 'Vendor', size: 200, cell: ({ original }) => original.vendor?.name ?? '-' },
    {
      id: 'grand_total',
      header: 'Total',
      size: 140,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.grand_total),
    },
    { id: 'status', header: 'Status', size: 120, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const sidebar = (
    <FilterSidebar activeCount={activeFilters} onReset={() => { setFilterStatus(undefined); setFilterVendor(null); setDateRange({ from: '', to: '' }) }}>
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari nomor PO, vendor..."
          className="w-full max-w-none"
        />
      </div>
      <FilterSection title="Status">
        {STATUSES.map((s) => (
          <label key={s} className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={filterStatus === s} onCheckedChange={(c) => setFilterStatus(c ? s : undefined)} />
            <span className="text-[12px] capitalize text-[#334155]">{s}</span>
          </label>
        ))}
      </FilterSection>
      <FilterSection title="Vendor">
        <SearchableSelect
          value={filterVendor}
          onChange={(v) => setFilterVendor(v)}
          onSearch={(q) => kontakApi.search(q, 'supplier')}
          placeholder="Semua vendor"
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
      title="Purchase Order"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'Purchase Order' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="purchase.orders.create">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => openRecordTab({ label: 'Purchase Order Baru', path: '/purchase/orders/create' })}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Buat PO
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
        emptyTitle="Belum ada purchase order"
        emptyDescription="Buat PO baru atau konversi dari Purchase Request."
      />
    </WorkspaceLayout>
  )
}
