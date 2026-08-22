import { useState } from 'react'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useListSort } from '@/hooks/useListSort'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BudgetStatusBadge } from '../components/BudgetStatusBadge'
import { useBudgetSubmissionList } from '../hooks/useBudgetSubmissions'
import { useBudgetPeriods } from '../hooks/useBudgetPeriods'
import type { BudgetSubmissionListRow, BudgetSubmissionStatus } from '../types/budget.types'
import type { ColumnDef, PaginationState } from '@/components/shared/table/DataTable'

const STATUS_OPTIONS: { value: BudgetSubmissionStatus | undefined; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Diajukan' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: undefined, label: 'Semua' },
]

const VERSION_OPTIONS: { value: boolean | undefined; label: string }[] = [
  { value: undefined, label: 'Versi aktif' },
  { value: false, label: 'Termasuk versi lama' },
]

export default function BudgetSubmissionListPage() {
  const { openRecordTab } = useRecordTab()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<BudgetSubmissionStatus | undefined>()
  const [filterPeriodId, setFilterPeriodId] = useState<number | undefined>()
  const [includeOldVersions, setIncludeOldVersions] = useState<boolean | undefined>(undefined)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  // Sorting server-side; `key` harus cocok dengan allowlist `$listSortable` di
  // BudgetSubmissionService. `useListSort` menggantikan state + handler toggle
  // yang sebelumnya ditulis tangan di halaman ini.
  const { sort, toggleSort, setSort, sortParams } = useListSort()

  const { periods } = useBudgetPeriods()

  const { data, isLoading, isFetching } = useBudgetSubmissionList({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    budget_period_id: filterPeriodId,
    status: filterStatus,
    // Hanya dikirim saat pengguna sengaja meminta versi lama. Backend sudah
    // default ke versi aktif, jadi mengirim `true` cuma menambah noise di URL.
    is_active: includeOldVersions === false ? false : undefined,
    search: search || undefined,
    ...sortParams,
  })

  const rows = data?.data ?? []
  const totalRows = data?.meta.total ?? 0

  // Kembali ke halaman 1 saat filter berubah, supaya tidak mendarat di halaman
  // kosong setelah hasilnya menyusut. Sort ikut dihitung: mengubah urutan pada
  // halaman jauh membuat baris teratas hasil pengurutan tidak pernah terlihat.
  const filterKey = `${search}|${String(filterStatus)}|${String(filterPeriodId)}|${String(includeOldVersions)}|${sort?.key ?? ''}|${sort?.direction ?? ''}`
  const [prevFilters, setPrevFilters] = useState('')
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPagination((s) => ({ ...s, pageIndex: 0 }))
  }

  const columns: ColumnDef<BudgetSubmissionListRow>[] = [
    {
      id: 'budget_period_id',
      header: 'Periode',
      size: 170,
      sortable: true,
      meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.period?.name ?? `#${original.budget_period_id}`,
    },
    {
      id: 'department_id',
      header: 'Departemen',
      size: 180,
      sortable: true,
      // department_id null bukan data hilang — itu anggaran tingkat perusahaan.
      // Menampilkan "—" akan membuatnya terbaca seperti isian yang terlewat.
      cell: ({ original }) =>
        original.department
          ? `${original.department.code} — ${original.department.name}`
          : <span className="text-[#64748b]">Perusahaan</span>,
    },
    {
      id: 'version_no',
      header: 'Versi',
      size: 100,
      sortable: true,
      meta: { className: 'tabular-nums' },
      cell: ({ original }) => (
        <span className="inline-flex items-center gap-1">
          v{original.version_no}
          {original.is_active && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Aktif</span>
          )}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      size: 130,
      sortable: true,
      cell: ({ original }) => <BudgetStatusBadge status={original.status} />,
    },
    {
      id: 'total_amount',
      header: 'Total Anggaran',
      size: 150,
      meta: { className: 'text-right tabular-nums', headerClassName: 'text-right' },
      // null = belum ada baris anggaran. "Rp 0" akan terbaca sebagai
      // "dianggarkan nol", padahal artinya "belum diisi".
      cell: ({ original }) =>
        original.total_amount === null ? '—' : formatCurrency(parseFloat(original.total_amount)),
    },
    {
      id: 'submitted_at',
      header: 'Diajukan',
      size: 120,
      cell: ({ original }) => (original.submitted_at ? formatDate(original.submitted_at) : '—'),
    },
  ]

  const activeFilterCount =
    (filterStatus !== undefined ? 1 : 0) +
    (filterPeriodId !== undefined ? 1 : 0) +
    (includeOldVersions !== undefined ? 1 : 0)

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => {
        setFilterStatus(undefined)
        setFilterPeriodId(undefined)
        setIncludeOldVersions(undefined)
        setSort(null)
      }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari departemen atau alasan revisi..."
          className="w-full max-w-none"
        />
      </div>
      <SingleCheckboxFilter
        title="Periode"
        options={[
          ...periods.map((p) => ({ value: p.id as number | undefined, label: p.name })),
          { value: undefined, label: 'Semua' },
        ]}
        value={filterPeriodId}
        onChange={setFilterPeriodId}
      />
      <SingleCheckboxFilter
        title="Status"
        options={STATUS_OPTIONS}
        value={filterStatus}
        onChange={setFilterStatus}
      />
      <SingleCheckboxFilter
        title="Versi"
        options={VERSION_OPTIONS}
        value={includeOldVersions}
        onChange={setIncludeOldVersions}
      />
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Daftar Budget"
      breadcrumb={[{ label: 'Anggaran' }, { label: 'Daftar Budget' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="budgets.submit">
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
            onClick={() => openRecordTab({ label: 'Budget Baru', path: '/budget/submissions/new' })}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Buat Budget
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        data={rows}
        columns={columns}
        totalRows={totalRows}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        sort={sort}
        onSortChange={toggleSort}
        onRowClick={(row) =>
          openRecordTab({
            label: row.department?.name ?? 'Perusahaan',
            path: `/budget/submissions/${row.id}`,
          })
        }
        emptyTitle="Belum ada pengajuan anggaran"
        emptyDescription="Buat pengajuan anggaran untuk satu departemen atau untuk perusahaan."
      />
    </WorkspaceLayout>
  )
}
