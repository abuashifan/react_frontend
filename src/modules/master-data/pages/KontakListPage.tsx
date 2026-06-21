import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Power, PowerOff } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useKontakList } from '../hooks/useKontakList'
import { useKontakMutations } from '../hooks/useKontakList'
import { MasterDataSearch } from '../components/MasterDataSearch'
import { MasterDataQueryError } from '../components/MasterDataQueryError'
import { useToast } from '@/hooks/useToast'
import type { Kontak, KontakType } from '../types/kontak.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { cn } from '@/lib/utils'

const KONTAK_TYPE_LABELS: Record<KontakType, string> = {
  customer: 'Customer',
  supplier: 'Supplier',
  both: 'Keduanya',
  employee: 'Karyawan',
  other: 'Lainnya',
}

const columns: ColumnDef<Kontak>[] = [
  {
    id: 'contact_code',
    header: 'Kode',
    size: 100,
    meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
    cell: ({ original }) => (
      <Link to={`/master-data/contacts/${original.id}`} className="hover:underline">
        {original.contact_code ?? `#${original.id}`}
      </Link>
    ),
  },
  {
    id: 'name',
    header: 'Nama',
    size: 200,
    cell: ({ original }) => (
      <Link to={`/master-data/contacts/${original.id}`} className="font-medium text-[#24323a] hover:text-[#326273] hover:underline">
        {original.name}
      </Link>
    ),
  },
  {
    id: 'contact_type',
    header: 'Tipe',
    size: 110,
    cell: ({ original }) => (
      <Badge className="text-[11px] bg-[#EFF9FB] text-[#326273] hover:bg-[#EFF9FB]">
        {KONTAK_TYPE_LABELS[original.contact_type]}
      </Badge>
    ),
  },
  {
    id: 'phone',
    header: 'Telepon',
    size: 130,
    cell: ({ original }) => original.phone ?? '-',
  },
  {
    id: 'email',
    header: 'Email',
    size: 180,
    cell: ({ original }) => original.email ?? '-',
  },
  {
    id: 'is_active',
    header: 'Status',
    size: 90,
    cell: ({ original }) => (
      <Badge
        className={cn(
          'text-[11px] px-2 py-0.5 rounded-full',
          original.is_active
            ? 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]'
            : 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
        )}
      >
        {original.is_active ? 'Aktif' : 'Nonaktif'}
      </Badge>
    ),
  },
]

export default function KontakListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [filterType, setFilterType] = useState<KontakType | undefined>()
  const [filterActive, setFilterActive] = useState<boolean | undefined>()
  const query = useKontakList({
    page,
    per_page: perPage,
    search: deferredSearch || undefined,
    contact_type: filterType,
    is_active: filterActive,
  })
  const { activate, deactivate } = useKontakMutations()

  const updateSelectedStatus = async (active: boolean) => {
    if (!confirm(`${active ? 'Aktifkan' : 'Nonaktifkan'} ${selectedRows.length} kontak terpilih?`)) return
    try {
      await Promise.all(selectedRows.map((rowId) =>
        active ? activate.mutateAsync(Number(rowId)) : deactivate.mutateAsync(Number(rowId)),
      ))
      toast.success(`${selectedRows.length} kontak berhasil ${active ? 'diaktifkan' : 'dinonaktifkan'}.`)
      setSelectedRows([])
    } catch {
      toast.error('Sebagian status kontak gagal diubah.')
    }
  }

  const activeFilterCount = [filterType, filterActive].filter((v) => v !== undefined).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterType(undefined); setFilterActive(undefined) }}
    >
      <FilterSection title="Tipe Kontak">
        {(Object.keys(KONTAK_TYPE_LABELS) as KontakType[]).map((t) => (
          <label key={t} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filterType === t}
              onCheckedChange={(checked) => setFilterType(checked ? t : undefined)}
            />
            <span className="text-[12px] text-[#334155]">{KONTAK_TYPE_LABELS[t]}</span>
          </label>
        ))}
      </FilterSection>
      <FilterSection title="Status">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filterActive === true}
            onCheckedChange={(checked) => setFilterActive(checked ? true : undefined)}
          />
          <span className="text-[12px] text-[#334155]">Aktif</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filterActive === false}
            onCheckedChange={(checked) => setFilterActive(checked ? false : undefined)}
          />
          <span className="text-[12px] text-[#334155]">Nonaktif</span>
        </label>
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Kontak"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Kontak' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="master-data.contacts.create">
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
            onClick={() => navigate('/master-data/contacts/create')}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Kontak
          </Button>
        </PermissionGuard>
      }
    >
      <MasterDataSearch
        value={search}
        onChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        placeholder="Cari kode, nama, telepon, atau email kontak..."
      />
      {query.isError ? (
        <MasterDataQueryError error={query.error} onRetry={() => void query.refetch()} />
      ) : <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        totalRows={query.data?.meta.total ?? 0}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(s) => { setPage(s.pageIndex + 1); setPerPage(s.pageSize) }}
        selectedRows={selectedRows}
        onRowSelect={setSelectedRows}
        bulkActions={[
          {
            id: 'activate',
            label: 'Aktifkan',
            icon: <Power className="h-3.5 w-3.5" />,
            permission: 'master-data.contacts.edit',
            onClick: () => void updateSelectedStatus(true),
          },
          {
            id: 'deactivate',
            label: 'Nonaktifkan',
            icon: <PowerOff className="h-3.5 w-3.5" />,
            permission: 'master-data.contacts.edit',
            variant: 'destructive',
            onClick: () => void updateSelectedStatus(false),
          },
        ]}
        emptyTitle="Belum ada kontak"
        emptyDescription="Tambahkan customer atau supplier pertama untuk memulai."
      />}
    </WorkspaceLayout>
  )
}
