import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Power, PowerOff } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActiveStatusBadge } from '@/components/shared/badge/ActiveStatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks/useToast'
import { useProyekList, useProyekMutations } from '../hooks/useSimpleLists'
import type { Proyek, ProyekStatus } from '../types/proyek.types'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import { getBulkFailureDetail } from '@/lib/apiError'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { value: boolean | undefined; label: string }[] = [
  { value: true, label: 'Aktif' },
  { value: false, label: 'Nonaktif' },
  { value: undefined, label: 'Semua' },
]

const STATUS_LABELS: Record<ProyekStatus, string> = {
  active: 'Aktif',
  on_hold: 'Ditunda',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_COLORS: Record<ProyekStatus, string> = {
  active: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]',
  on_hold: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]',
  completed: 'bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE]',
  cancelled: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
}

export default function ProyekPage() {
  const { toast } = useToast()
  const { can } = usePermission()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<ProyekStatus | undefined>()
  const [page, setPage] = useState(1)
  // Dua sumbu berbeda: `status` adalah siklus proyek (aktif/selesai/batal),
  // `is_active` adalah dipakai/tidak. Proyek satu-satunya master data yang
  // punya keduanya -- lihat 00-conventions.md 6b rencana list-filters-frontend.
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const { data, isLoading, isFetching } = useProyekList({
    page,
    per_page: 25,
    status: filterStatus,
    is_active: filterActive,
    search: search || undefined,
  })

  // Kembali ke halaman 1 saat filter berubah, supaya tidak mendarat di
  // halaman kosong setelah hasilnya menyusut.
  const filterKey = `${search}|${String(filterActive)}|${String(filterStatus)}`
  const [prevFilters, setPrevFilters] = useState('')
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(1)
  }
  const { activate, deactivate } = useProyekMutations()

  // Pola identik dengan KontakListPage (halaman acuan).
  const runBulkStatusChange = async (
    ids: string[],
    targetActive: boolean,
    mutateAsync: (id: number) => Promise<unknown>,
  ) => {
    const rows = data?.data ?? []
    const eligible = rows.filter((r) => ids.includes(String(r.id)) && r.is_active !== targetActive)
    const verb = targetActive ? 'diaktifkan' : 'dinonaktifkan'
    if (eligible.length === 0) {
      toast.warning(`Proyek yang dipilih sudah ${verb}.`)
      return
    }
    if (!targetActive && !confirm(`Nonaktifkan ${eligible.length} proyek terpilih? Data historis tidak akan dihapus.`)) return

    const results = await Promise.allSettled(eligible.map((r) => mutateAsync(r.id)))
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.length - successCount
    const failureDetail = getBulkFailureDetail(results)

    if (failureCount === 0) {
      toast.success(`${successCount} proyek berhasil ${verb}.`)
    } else if (successCount === 0) {
      toast.error(`Gagal ${targetActive ? 'mengaktifkan' : 'menonaktifkan'} ${failureCount} proyek.${failureDetail ? ` ${failureDetail}` : ''}`)
    } else {
      toast.warning(`${successCount} proyek ${verb}, ${failureCount} gagal.${failureDetail ? ` ${failureDetail}` : ''}`)
    }
    setSelectedRows([])
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-activate',
      label: 'Aktifkan Terpilih',
      icon: <Power className="h-3.5 w-3.5" />,
      permission: 'projects.edit',
      onClick: (ids) => runBulkStatusChange(ids, true, (id) => activate.mutateAsync(id)),
    },
    {
      id: 'bulk-deactivate',
      label: 'Nonaktifkan Terpilih',
      icon: <PowerOff className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'projects.deactivate',
      onClick: (ids) => runBulkStatusChange(ids, false, (id) => deactivate.mutateAsync(id)),
    },
  ]

  const columns: ColumnDef<Proyek>[] = [
    {
      id: 'code',
      header: 'Kode',
      size: 100,
      meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.code,
    },
    {
      id: 'name',
      header: 'Nama',
      size: 200,
      cell: ({ original }) => original.name,
    },
    {
      id: 'status',
      header: 'Status',
      size: 110,
      cell: ({ original }) => (
        <Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', STATUS_COLORS[original.status])}>
          {STATUS_LABELS[original.status]}
        </Badge>
      ),
    },
    {
      id: 'start_date',
      header: 'Mulai',
      size: 110,
      cell: ({ original }) => original.start_date
        ? new Date(original.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-',
    },
    {
      id: 'end_date',
      header: 'Selesai',
      size: 110,
      cell: ({ original }) => original.end_date
        ? new Date(original.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-',
    },
    {
      // Kolom ini `is_active` (dipakai/tidak), berbeda dari kolom "Status" di
      // atas yang menampilkan siklus proyek.
      id: 'is_active',
      header: 'Aktif',
      size: 90,
      cell: ({ original }) => <ActiveStatusBadge isActive={original.is_active} />,
    },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={[filterStatus, filterActive].filter((v) => v !== undefined).length}
      onReset={() => { setFilterStatus(undefined); setFilterActive(true) }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari kode atau nama proyek..."
          className="w-full max-w-none"
        />
      </div>
      {/* Siklus proyek — beda dari filter Aktif/Nonaktif di bawahnya. */}
      <FilterSection title="Status Proyek">
        {(['active', 'completed', 'cancelled'] as ProyekStatus[]).map((s) => (
          <label key={s} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filterStatus === s}
              onCheckedChange={(checked) => setFilterStatus(checked ? s : undefined)}
            />
            <span className="text-[12px] text-[#334155]">{STATUS_LABELS[s]}</span>
          </label>
        ))}
      </FilterSection>
      <SingleCheckboxFilter
        title="Aktif/Nonaktif"
        options={STATUS_OPTIONS}
        value={filterActive}
        onChange={setFilterActive}
      />
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Proyek"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Proyek' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="projects.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={() => navigate('/master-data/projects/create')}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Proyek
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
        pagination={{ pageIndex: page - 1, pageSize: 25 }}
        onPaginationChange={(s) => setPage(s.pageIndex + 1)}
        selectedRows={selectedRows}
        onRowSelect={setSelectedRows}
        bulkActions={bulkActions}
        // Baris dibuka dengan mengklik barisnya — navigasi ke form page proyek.
        // Tanpa izin view, baris tidak bisa diklik.
        onRowClick={can('projects.view') ? (item) => navigate(`/master-data/projects/${item.id}`) : undefined}
        emptyTitle="Belum ada proyek"
        emptyDescription="Tambahkan proyek untuk pelacakan biaya per proyek."
      />

    </WorkspaceLayout>
  )
}
