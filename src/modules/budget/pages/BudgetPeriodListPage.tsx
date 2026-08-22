import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useListSort } from '@/hooks/useListSort'
import { formatDate } from '@/lib/utils'
import { budgetApi } from '../services/budgetApi'
import { useBudgetPeriods } from '../hooks/useBudgetPeriods'
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

  // Sorting dilakukan server-side; nilai `key` harus cocok dengan allowlist
  // `$listSortable` di BudgetPeriodService.
  const { sort, toggleSort, setSort, sortParams } = useListSort({ key: 'fiscal_year', direction: 'desc' })

  // Seluruh filter dikirim ke server (sebelumnya disaring & dipotong di browser
  // atas koleksi penuh). Karena itu perubahannya harus mengembalikan halaman ke
  // 1 — memfilter dari halaman jauh akan mendarat di daftar kosong.
  const filterKey = `${search}|${String(filterStatus)}|${sort?.key ?? ''}|${sort?.direction ?? ''}`
  const [prevFilters, setPrevFilters] = useState('')
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPagination((s) => ({ ...s, pageIndex: 0 }))
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['budget', 'periods', 'list', { search, filterStatus, pagination, sort }],
    queryFn: () =>
      budgetApi.listPeriodsPaginated({
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        search: search || undefined,
        status: filterStatus,
        ...sortParams,
      }),
  })

  const rows = data?.data ?? []

  // Tombol "Buat Pagu" dikunci selama masih ada pagu `open`, dan itu harus
  // dinilai dari SELURUH data — bukan dari `rows` halaman aktif, yang bisa saja
  // sedang difilter ke "Ditutup" sehingga pagu terbuka tidak ikut terlihat.
  const { periods: allPeriods } = useBudgetPeriods()
  const openPeriod = allPeriods.find((p) => p.status === 'open')

  const columns: ColumnDef<BudgetPeriod>[] = [
    {
      id: 'name',
      header: 'Nama',
      size: 220,
      sortable: true,
      meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.name,
    },
    {
      id: 'fiscal_year',
      header: 'Tahun',
      size: 90,
      sortable: true,
      meta: { className: 'tabular-nums' },
      cell: ({ original }) => original.fiscal_year,
    },
    {
      id: 'period_from',
      header: 'Periode',
      size: 220,
      sortable: true,
      cell: ({ original }) => `${formatDate(original.period_from)} — ${formatDate(original.period_to)}`,
    },
    {
      id: 'status',
      header: 'Status',
      size: 100,
      sortable: true,
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
      onReset={() => {
        setFilterStatus(undefined)
        setSort({ key: 'fiscal_year', direction: 'desc' })
      }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari nama atau tahun anggaran..."
          hint="Mencari di nama pagu dan tahun fiskal."
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
      title="Pagu Anggaran"
      breadcrumb={[{ label: 'Anggaran' }, { label: 'Pagu Anggaran' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="budgets.manage">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              {/* Bungkus dengan <span> supaya tooltip tetap muncul saat hover —
                  <button disabled> menekan pointer events di sebagian besar
                  browser, jadi TooltipTrigger tidak akan pernah menyala kalau
                  langsung dipasang di tombolnya sendiri. */}
              <TooltipTrigger asChild>
                <span tabIndex={openPeriod ? 0 : undefined}>
                  <Button
                    className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]"
                    disabled={!!openPeriod}
                    onClick={() => openRecordTab({ label: 'Pagu Baru', path: '/budget/periods/new' })}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Buat Pagu
                  </Button>
                </span>
              </TooltipTrigger>
              {openPeriod && (
                <TooltipContent className="max-w-64 text-[12px]">
                  Sudah ada pagu &amp; periode aktif: <strong>{openPeriod.name}</strong>. Tutup periode ini dulu untuk membuat yang baru.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </PermissionGuard>
      }
    >
      <DataTable
        data={rows}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        sort={sort}
        onSortChange={toggleSort}
        onRowClick={(row) => openRecordTab({ label: row.name, path: `/budget/periods/${row.id}` })}
        emptyTitle="Belum ada pagu anggaran"
        emptyDescription="Buat pagu anggaran untuk mulai mengumpulkan pengajuan per departemen."
      />
    </WorkspaceLayout>
  )
}
