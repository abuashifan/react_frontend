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
import { formatCurrency, formatDate } from '@/lib/utils'
import { useVendorBillList } from '../hooks/useVendorBillList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { VendorBill, VendorBillStatus } from '../types/vendorBill.types'

const STATUSES: VendorBillStatus[] = ['draft', 'approved', 'posted', 'partially_paid', 'paid', 'void']

export default function VendorBillListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<VendorBillStatus | undefined>()
  const [filterVendor, setFilterVendor] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useVendorBillList({
    page: page + 1,
    per_page: 25,
    status: filterStatus,
    vendor_id: filterVendor ?? undefined,
  })

  const today = new Date().toISOString().slice(0, 10)
  const activeFilters = [filterStatus, filterVendor].filter(Boolean).length
  const columns: ColumnDef<VendorBill>[] = [
    {
      id: 'number',
      header: 'Nomor Bill',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/purchase/bills/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    {
      id: 'due_date',
      header: 'Jatuh Tempo',
      size: 120,
      cell: ({ original }) => {
        if (!original.due_date) return '-'
        const overdue = original.due_date < today && !['paid', 'void'].includes(original.status)
        return <span className={overdue ? 'font-semibold text-red-600' : ''}>{formatDate(original.due_date)}</span>
      },
    },
    { id: 'vendor', header: 'Vendor', size: 190, cell: ({ original }) => original.vendor?.name ?? '-' },
    {
      id: 'grand_total',
      header: 'Total',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.grand_total),
    },
    {
      id: 'balance_due',
      header: 'Sisa',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(original.balance_due),
    },
    { id: 'status', header: 'Status', size: 130, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
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
      title="Tagihan Vendor"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'Tagihan' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="purchase.bills.create">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/purchase/bills/create')}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Buat Bill
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
        emptyTitle="Belum ada tagihan vendor"
        emptyDescription="Buat tagihan dari PO atau GR yang sudah diterima."
      />
    </WorkspaceLayout>
  )
}
