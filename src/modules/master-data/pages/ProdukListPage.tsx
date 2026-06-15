import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useProdukList } from '../hooks/useProdukList'
import { kategoriProdukApi } from '../services/kategoriProdukApi'
import type { Produk } from '../types/produk.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { cn } from '@/lib/utils'

const columns: ColumnDef<Produk>[] = [
  {
    id: 'code',
    header: 'Kode',
    size: 100,
    meta: { sticky: true, stickyLeft: 32, className: 'font-medium text-[#5c9ead]' },
    cell: ({ original }) => original.code,
  },
  {
    id: 'name',
    header: 'Nama Produk',
    size: 200,
    cell: ({ original }) => original.name,
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
    cell: ({ original }) => original.unit?.symbol ?? '-',
  },
  {
    id: 'sell_price',
    header: 'Harga Jual',
    size: 130,
    meta: { className: 'text-right tabular-nums' },
    cell: ({ original }) =>
      Number(original.sell_price).toLocaleString('id-ID', { minimumFractionDigits: 0 }),
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
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | undefined>()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading, isFetching } = useProdukList({
    page,
    per_page: perPage,
    category_id: filterCategoryId ?? undefined,
    is_active: filterActive,
  })

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
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(s) => { setPage(s.pageIndex + 1); setPerPage(s.pageSize) }}
        selectedRows={selectedIds}
        onRowSelect={setSelectedIds}
        emptyTitle="Belum ada produk"
        emptyDescription="Tambahkan produk pertama untuk memulai."
      />
    </WorkspaceLayout>
  )
}
