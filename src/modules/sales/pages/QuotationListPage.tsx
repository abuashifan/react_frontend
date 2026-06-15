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
import { useQuotationList } from '../hooks/useQuotationList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { SalesQuotation } from '../types/quotation.types'
import type { QuotationStatus } from '../types/quotation.types'
const STATUSES: QuotationStatus[] = ['draft', 'sent', 'approved', 'accepted', 'rejected', 'cancelled', 'converted']

export default function QuotationListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<QuotationStatus | undefined>()
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useQuotationList({
    page: page + 1,
    per_page: 25,
    status: filterStatus,
    customer_id: filterCustomer ?? undefined,
  })

  const activeFilters = [filterStatus, filterCustomer].filter(Boolean).length
  const columns: ColumnDef<SalesQuotation>[] = [
    {
      id: 'number',
      header: 'Nomor',
      size: 140,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button
          type="button"
          onClick={() => navigate(`/sales/quotations/${original.id}`)}
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
    <FilterSidebar activeCount={activeFilters} onReset={() => { setFilterStatus(undefined); setFilterCustomer(null) }}>
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
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Quotation"
      breadcrumb={[{ label: 'Sales' }, { label: 'Quotation' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="sales.quotations.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={() => navigate('/sales/quotations/create')}>
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
