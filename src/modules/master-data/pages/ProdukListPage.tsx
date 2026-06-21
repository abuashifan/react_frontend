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
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useProdukList, useProdukMutations } from '../hooks/useProdukList'
import { kategoriProdukApi } from '../services/kategoriProdukApi'
import { MasterDataSearch } from '../components/MasterDataSearch'
import { MasterDataQueryError } from '../components/MasterDataQueryError'
import { useToast } from '@/hooks/useToast'
import type { Produk } from '../types/produk.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { cn } from '@/lib/utils'

const columns: ColumnDef<Produk>[] = [
  {
    id: 'product_code',
    header: 'Kode',
    size: 100,
    meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
    cell: ({ original }) => (
      <Link to={`/master-data/products/${original.id}`} className="hover:underline">
        {original.product_code ?? `#${original.id}`}
      </Link>
    ),
  },
  {
    id: 'product_name',
    header: 'Nama Produk',
    size: 200,
    cell: ({ original }) => (
      <Link to={`/master-data/products/${original.id}`} className="font-medium text-[#24323a] hover:text-[#326273] hover:underline">
        {original.product_name}
      </Link>
    ),
  },
  {
    id: 'product_type',
    header: 'Tipe',
    size: 110,
    cell: ({ original }) => original.product_type,
  },
  {
    id: 'category',
    header: 'Kategori',
    size: 130,
    cell: ({ original }) => original.category?.name ?? '-',
  },
  {
    id: 'unit',
    header: 'Satuan',
    size: 90,
    cell: ({ original }) => original.unit?.code ?? '-',
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

export default function ProdukListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | undefined>()
  const query = useProdukList({
    page,
    per_page: perPage,
    search: deferredSearch || undefined,
    product_category_id: filterCategoryId ?? undefined,
    is_active: filterActive,
  })
  const { activate, deactivate } = useProdukMutations()

  const updateSelectedStatus = async (active: boolean) => {
    if (!confirm(`${active ? 'Aktifkan' : 'Nonaktifkan'} ${selectedRows.length} produk terpilih?`)) return
    try {
      await Promise.all(selectedRows.map((rowId) =>
        active ? activate.mutateAsync(Number(rowId)) : deactivate.mutateAsync(Number(rowId)),
      ))
      toast.success(`${selectedRows.length} produk berhasil ${active ? 'diaktifkan' : 'dinonaktifkan'}.`)
      setSelectedRows([])
    } catch {
      toast.error('Sebagian status produk gagal diubah.')
    }
  }

  const activeFilterCount = [filterCategoryId, filterActive].filter((v) => v !== undefined && v !== null).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterCategoryId(null); setFilterActive(undefined) }}
    >
      <FilterSection title="Kategori">
        <SearchableSelect
          value={filterCategoryId}
          onChange={setFilterCategoryId}
          onSearch={kategoriProdukApi.search}
          placeholder="Cari kategori..."
          size="sm"
        />
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
      title="Produk"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Produk' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="master-data.products.create">
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
            onClick={() => navigate('/master-data/products/create')}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Produk
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
        placeholder="Cari kode, nama, atau deskripsi produk..."
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
            permission: 'master-data.products.edit',
            onClick: () => void updateSelectedStatus(true),
          },
          {
            id: 'deactivate',
            label: 'Nonaktifkan',
            icon: <PowerOff className="h-3.5 w-3.5" />,
            permission: 'master-data.products.edit',
            variant: 'destructive',
            onClick: () => void updateSelectedStatus(false),
          },
        ]}
        emptyTitle="Belum ada produk"
        emptyDescription="Tambahkan produk pertama untuk memulai."
      />}
    </WorkspaceLayout>
  )
}
