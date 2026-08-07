import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useRecordTab } from '@/hooks/useRecordTab'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActiveStatusBadge } from '@/components/shared/badge/ActiveStatusBadge'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useProdukList } from '../hooks/useProdukList'
import { kategoriProdukApi } from '../services/kategoriProdukApi'
import type { Produk } from '../types/produk.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'

const STATUS_OPTIONS: { value: boolean | undefined; label: string }[] = [
  { value: true, label: 'Aktif' },
  { value: false, label: 'Nonaktif' },
  { value: undefined, label: 'Semua' },
]

const columns: ColumnDef<Produk>[] = [
  {
    id: 'product_code',
    header: 'Kode',
    size: 100,
    meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
    cell: ({ original }) => original.product_code ?? '-',
  },
  {
    id: 'product_name',
    header: 'Nama Produk',
    size: 200,
    cell: ({ original }) => original.product_name,
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
    cell: ({ original }) => <ActiveStatusBadge isActive={original.is_active} />,
  },
]

export default function ProdukListPage() {
  const { openRecordTab } = useRecordTab()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null)
  // Default: hanya tampilkan produk aktif. Pilih "Semua" di filter Status untuk menampilkan semuanya.
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true)
  const [search, setSearch] = useState('')
  const [prevSearch, setPrevSearch] = useState('')
  const { data, isLoading, isFetching } = useProdukList({
    page,
    per_page: perPage,
    product_category_id: filterCategoryId ?? undefined,
    is_active: filterActive,
    search: search || undefined,
  })

  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }

  const activeFilterCount = [filterCategoryId, filterActive].filter((v) => v !== undefined && v !== null).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterCategoryId(null); setFilterActive(true) }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari kode atau nama produk..."
          className="w-full max-w-none"
        />
      </div>
      <FilterSection title="Kategori">
        <SearchableSelect
          value={filterCategoryId}
          onChange={setFilterCategoryId}
          onSearch={kategoriProdukApi.search}
          placeholder="Cari kategori..."
          size="sm"
        />
      </FilterSection>
      <SingleCheckboxFilter
        title="Status"
        options={STATUS_OPTIONS}
        value={filterActive}
        onChange={setFilterActive}
      />
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
            onClick={() => openRecordTab({ label: 'Produk Baru', path: '/master-data/products/create' })}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Produk
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
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(s) => { setPage(s.pageIndex + 1); setPerPage(s.pageSize) }}
        onRowClick={(row) => openRecordTab({ label: row.product_name, path: `/master-data/products/${row.id}` })}
        emptyTitle="Belum ada produk"
        emptyDescription="Tambahkan produk pertama untuk memulai."
      />
    </WorkspaceLayout>
  )
}
