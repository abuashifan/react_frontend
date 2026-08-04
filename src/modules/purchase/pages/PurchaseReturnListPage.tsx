import { useState } from 'react'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatCurrency, formatDate } from '@/lib/utils'
import { usePurchaseReturnList } from '../hooks/usePurchaseReturnList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { PurchaseReturn, PurchaseReturnStatus } from '../types/purchaseReturn.types'
import { useRecordTab } from '@/hooks/useRecordTab'

const STATUSES: PurchaseReturnStatus[] = ['draft', 'approved', 'posted', 'void']

export default function PurchaseReturnListPage() {
  const { openRecordTab } = useRecordTab()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [prevSearch, setPrevSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<PurchaseReturnStatus | undefined>()
  const [filterVendor, setFilterVendor] = useState<number | null>(null)

  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(0)
  }

  const { data, isLoading, isFetching } = usePurchaseReturnList({
    page: page + 1,
    per_page: 25,
    search: search || undefined,
    status: filterStatus,
    vendor_id: filterVendor ?? undefined,
  })

  const activeFilters = [filterStatus, filterVendor].filter(Boolean).length
  const columns: ColumnDef<PurchaseReturn>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => openRecordTab({ label: original.number, path: `/purchase/returns/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'vendor', header: 'Vendor', size: 200, cell: ({ original }) => original.vendor?.name ?? '-' },
    {
      id: 'source',
      header: 'Sumber',
      size: 150,
      cell: ({ original }) => original.vendor_bill_number ?? original.goods_receipt_number ?? '-',
    },
    {
      id: 'total',
      header: 'Total',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.total),
    },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const sidebar = (
    <FilterSidebar activeCount={activeFilters} onReset={() => { setFilterStatus(undefined); setFilterVendor(null) }}>
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
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Retur Pembelian"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'Retur' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="purchase.returns.create">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => openRecordTab({ label: 'Retur Baru', path: '/purchase/returns/create' })}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Buat Retur
          </Button>
        </PermissionGuard>
      }
    >
      <ListSearchBar value={search} onChange={setSearch} placeholder="Cari nomor retur, vendor..." className="mb-3" />
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: page, pageSize: 25 }}
        onPaginationChange={(p) => setPage(p.pageIndex)}
        emptyTitle="Belum ada retur pembelian"
        emptyDescription="Buat retur dari tagihan atau penerimaan barang."
      />
    </WorkspaceLayout>
  )
}
