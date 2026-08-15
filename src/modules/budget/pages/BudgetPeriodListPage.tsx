import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { useRecordTab } from '@/hooks/useRecordTab'
import { formatDate } from '@/lib/utils'
import { budgetApi } from '../services/budgetApi'
import type { BudgetPeriod, BudgetPeriodStatus } from '../types/budget.types'
import type { ColumnDef, PaginationState } from '@/components/shared/table/DataTable'

const STATUS_LABELS: Record<BudgetPeriodStatus, string> = { open: 'Aktif', closed: 'Ditutup' }
const STATUS_CLASSES: Record<BudgetPeriodStatus, string> = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
}

const STATUS_OPTIONS: { value: BudgetPeriodStatus | undefined; label: string }[] = [
  { value: 'open', label: 'Aktif' },
  { value: 'closed', label: 'Ditutup' },
  { value: undefined, label: 'Semua' },
]

export default function BudgetPeriodListPage() {
  const { openRecordTab } = useRecordTab()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<BudgetPeriodStatus | undefined>(undefined)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['budget', 'periods'],
    queryFn: budgetApi.listPeriods,
  })

  // GET /budget-periods mengembalikan seluruh koleksi sekaligus — service-nya
  // tidak memakai AppliesListQuery. Karena semua baris memang sudah ada di
  // klien, menyaring dan memotong halaman di sini berlaku ke seluruh data,
  // bukan hanya satu halaman. Itu membedakannya dari pola yang dibuang
  // list-query-pushdown, di mana filter browser hanya mengenai 25 baris teratas.
  const periods: BudgetPeriod[] = useMemo(() => {
    const rows = data?.data ?? []
    const keyword = search.trim().toLowerCase()

    return rows.filter((p) => {
      if (filterStatus !== undefined && p.status !== filterStatus) return false
      if (keyword === '') return true
      return p.name.toLowerCase().includes(keyword) || String(p.fiscal_year).includes(keyword)
    })
  }, [data, search, filterStatus])

  // Kembali ke halaman 1 saat filter berubah, supaya tidak mendarat di halaman
  // kosong setelah hasilnya menyusut.
  const filterKey = `${search}|${String(filterStatus)}`
  const [prevFilters, setPrevFilters] = useState('')
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPagination((s) => ({ ...s, pageIndex: 0 }))
  }

  const pageRows = periods.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize,
  )

  const columns: ColumnDef<BudgetPeriod>[] = [
    {
      id: 'name',
      header: 'Nama',
      size: 220,
      meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.name,
    },
    {
      id: 'fiscal_year',
      header: 'Tahun',
      size: 90,
      meta: { className: 'tabular-nums' },
      cell: ({ original }) => original.fiscal_year,
    },
    {
      id: 'range',
      header: 'Periode',
      size: 220,
      cell: ({ original }) => `${formatDate(original.period_from)} — ${formatDate(original.period_to)}`,
    },
    {
      id: 'status',
      header: 'Status',
      size: 100,
      cell: ({ original }) => (
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASSES[original.status]}`}>
          {STATUS_LABELS[original.status]}
        </span>
      ),
    },
    {
      id: 'submissions_count',
      header: 'Pengajuan',
      size: 100,
      meta: { className: 'text-right tabular-nums', headerClassName: 'text-right' },
      cell: ({ original }) => original.submissions_count ?? 0,
    },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={filterStatus !== undefined ? 1 : 0}
      onReset={() => setFilterStatus(undefined)}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari nama atau tahun anggaran..."
          className="w-full max-w-none"
        />
      </div>
      <SingleCheckboxFilter
        title="Status"
        options={STATUS_OPTIONS}
        value={filterStatus}
        onChange={setFilterStatus}
      />
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Periode Anggaran"
      breadcrumb={[{ label: 'Anggaran' }, { label: 'Periode Anggaran' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="budgets.manage">
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
            onClick={() => openRecordTab({ label: 'Periode Baru', path: '/budget/periods/new' })}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Buat Periode
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        data={pageRows}
        columns={columns}
        totalRows={periods.length}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        onRowClick={(row) => openRecordTab({ label: row.name, path: `/budget/periods/${row.id}` })}
        emptyTitle="Belum ada periode anggaran"
        emptyDescription="Buat periode anggaran untuk mulai mengumpulkan pengajuan per departemen."
      />
    </WorkspaceLayout>
  )
}
