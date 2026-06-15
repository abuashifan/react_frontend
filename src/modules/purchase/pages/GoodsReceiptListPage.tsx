import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatDate } from '@/lib/utils'
import { useGoodsReceiptList } from '../hooks/useGoodsReceiptList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { GoodsReceipt, GoodsReceiptStatus } from '../types/goodsReceipt.types'

const STATUSES: GoodsReceiptStatus[] = ['draft', 'received', 'partially_billed', 'void', 'cancelled']

export default function GoodsReceiptListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<GoodsReceiptStatus | undefined>()
  const [filterVendor, setFilterVendor] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useGoodsReceiptList({
    page: page + 1,
    per_page: 25,
    status: filterStatus,
    vendor_id: filterVendor ?? undefined,
  })

  const activeFilters = [filterStatus, filterVendor].filter(Boolean).length
  const columns: ColumnDef<GoodsReceipt>[] = [
    {
      id: 'number',
      header: 'Nomor GR',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/purchase/goods-receipts/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'po', header: 'Nomor PO', size: 130, cell: ({ original }) => original.purchase_order_number ?? '-' },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'vendor', header: 'Vendor', size: 200, cell: ({ original }) => original.vendor?.name ?? '-' },
    { id: 'warehouse', header: 'Gudang', size: 150, cell: ({ original }) => original.warehouse?.name ?? '-' },
    { id: 'status', header: 'Status', size: 120, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const sidebar = (
    <FilterSidebar activeCount={activeFilters} onReset={() => { setFilterStatus(undefined); setFilterVendor(null) }}>
      <FilterSection title="Status">
        {STATUSES.map((s) => (
          <label key={s} className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={filterStatus === s} onCheckedChange={(c) => setFilterStatus(c ? s : undefined)} />
            <span className="text-[12px] capitalize text-[#334155]">{s.replace('_', ' ')}</span>
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
      title="Penerimaan Barang"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'Penerimaan Barang' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="purchase.goods-receipts.create">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/purchase/goods-receipts/create')}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Buat GR
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
        emptyTitle="Belum ada penerimaan barang"
        emptyDescription="Buat GR dari Purchase Order yang sudah dikonfirmasi."
      />
    </WorkspaceLayout>
  )
}
