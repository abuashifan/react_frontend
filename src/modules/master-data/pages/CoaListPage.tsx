import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Power, PowerOff } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable, type ColumnDef } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { useCoaList, useCoaMutations } from '../hooks/useCoaList'
import { MasterDataSearch } from '../components/MasterDataSearch'
import { MasterDataQueryError } from '../components/MasterDataQueryError'
import type { Coa, CoaType } from '../types/coa.types'

const COA_TYPE_LABELS: Record<CoaType, string> = {
  asset: 'Aset',
  liability: 'Liabilitas',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  expense: 'Beban',
}

const columns: ColumnDef<Coa>[] = [
  {
    id: 'account_code',
    header: 'Kode',
    size: 130,
    meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
    cell: ({ original }) => (
      <Link to={`/master-data/coa/${original.id}`} className="hover:underline">
        {original.account_code}
      </Link>
    ),
  },
  {
    id: 'account_name',
    header: 'Nama Akun',
    size: 220,
    cell: ({ original }) => (
      <Link to={`/master-data/coa/${original.id}`} className="font-medium text-[#24323a] hover:text-[#326273] hover:underline">
        {original.account_name}
      </Link>
    ),
  },
  {
    id: 'parent',
    header: 'Akun Induk',
    size: 190,
    cell: ({ original }) => original.parent
      ? `${original.parent.account_code} — ${original.parent.account_name}`
      : '-',
  },
  {
    id: 'account_type',
    header: 'Tipe',
    size: 120,
    cell: ({ original }) => COA_TYPE_LABELS[original.account_type],
  },
  {
    id: 'is_active',
    header: 'Status',
    size: 100,
    cell: ({ original }) => (
      <Badge
        className={cn(
          'rounded-full px-2 py-0.5 text-[11px] font-medium',
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

export default function CoaListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [filterType, setFilterType] = useState<CoaType | undefined>()
  const [filterActive, setFilterActive] = useState<boolean | undefined>()

  const query = useCoaList({
    page,
    per_page: perPage,
    search: deferredSearch || undefined,
    account_type: filterType,
    is_active: filterActive,
  })
  const { activate, deactivate } = useCoaMutations()

  const updateSelectedStatus = async (active: boolean) => {
    if (!confirm(`${active ? 'Aktifkan' : 'Nonaktifkan'} ${selectedRows.length} akun terpilih?`)) return
    try {
      await Promise.all(selectedRows.map((rowId) =>
        active ? activate.mutateAsync(Number(rowId)) : deactivate.mutateAsync(Number(rowId)),
      ))
      toast.success(`${selectedRows.length} akun berhasil ${active ? 'diaktifkan' : 'dinonaktifkan'}.`)
      setSelectedRows([])
    } catch {
      toast.error('Sebagian status akun gagal diubah. Periksa akun induk/anak yang masih aktif.')
    }
  }

  const activeFilterCount = [filterType, filterActive].filter((value) => value !== undefined).length

  return (
    <WorkspaceLayout
      title="Chart of Accounts"
      breadcrumb={[{ label: 'Master Data' }, { label: 'COA' }]}
      sidebar={(
        <FilterSidebar
          activeCount={activeFilterCount}
          onReset={() => {
            setFilterType(undefined)
            setFilterActive(undefined)
            setPage(1)
          }}
        >
          <FilterSection title="Tipe Akun">
            {(Object.keys(COA_TYPE_LABELS) as CoaType[]).map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={filterType === type}
                  onCheckedChange={(checked) => {
                    setFilterType(checked ? type : undefined)
                    setPage(1)
                  }}
                />
                <span className="text-[12px] text-[#334155]">{COA_TYPE_LABELS[type]}</span>
              </label>
            ))}
          </FilterSection>
          <FilterSection title="Status">
            {[true, false].map((active) => (
              <label key={String(active)} className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={filterActive === active}
                  onCheckedChange={(checked) => {
                    setFilterActive(checked ? active : undefined)
                    setPage(1)
                  }}
                />
                <span className="text-[12px] text-[#334155]">{active ? 'Aktif' : 'Nonaktif'}</span>
              </label>
            ))}
          </FilterSection>
        </FilterSidebar>
      )}
      action={
        <PermissionGuard permission="master-data.coa.create">
          <Button
            className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]"
            onClick={() => navigate('/master-data/coa/create')}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Akun
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
        placeholder="Cari kode atau nama akun..."
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
        onPaginationChange={(state) => {
          setPage(state.pageIndex + 1)
          setPerPage(state.pageSize)
        }}
        selectedRows={selectedRows}
        onRowSelect={setSelectedRows}
        bulkActions={[
          {
            id: 'activate',
            label: 'Aktifkan',
            icon: <Power className="h-3.5 w-3.5" />,
            permission: 'master-data.coa.edit',
            onClick: () => void updateSelectedStatus(true),
          },
          {
            id: 'deactivate',
            label: 'Nonaktifkan',
            icon: <PowerOff className="h-3.5 w-3.5" />,
            permission: 'master-data.coa.edit',
            variant: 'destructive',
            onClick: () => void updateSelectedStatus(false),
          },
        ]}
        emptyTitle="Belum ada akun"
        emptyDescription="Tambahkan akun pertama atau ubah filter pencarian."
      />}
    </WorkspaceLayout>
  )
}
