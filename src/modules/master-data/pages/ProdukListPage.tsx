import { useState } from 'react'
import { Plus, Power, PowerOff } from 'lucide-react'
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
import { useToast } from '@/hooks/useToast'
import { getBulkFailureDetail } from '@/lib/apiError'
import { useProdukList, useProdukMutations } from '../hooks/useProdukList'
import { kategoriProdukApi } from '../services/kategoriProdukApi'
import type { Produk } from '../types/produk.types'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'

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
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null)
  // Default: hanya tampilkan produk aktif. Pilih "Semua" di filter Status untuk menampilkan semuanya.
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const { data, isLoading, isFetching } = useProdukList({
    page,
    per_page: perPage,
    product_category_id: filterCategoryId ?? undefined,
    is_active: filterActive,
    search: search || undefined,
  })

  // Setiap perubahan filter mengembalikan ke halaman 1 dan mengosongkan
  // seleksi — kalau tidak, memilih kategori saat berada di halaman 3 mendarat
  // di halaman kosong, dan aksi massal bisa mengenai baris yang tidak terlihat.
  const [prevFilters, setPrevFilters] = useState('')
  const filterKey = `${search}|${String(filterCategoryId)}|${String(filterActive)}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(1)
    setSelectedRows([])
  }

  const { activate, deactivate } = useProdukMutations()

  const activeFilterCount = [filterCategoryId, filterActive].filter((v) => v !== undefined && v !== null).length

  // Pola identik dengan KontakListPage (halaman acuan): baris yang sudah dalam
  // status tujuan tidak ikut dikirim, dan menonaktifkan minta konfirmasi
  // sedangkan mengaktifkan tidak.
  const runBulkStatusChange = async (
    ids: string[],
    targetActive: boolean,
    mutateAsync: (id: number) => Promise<unknown>,
  ) => {
    const rows = data?.data ?? []
    const eligible = rows.filter((p) => ids.includes(String(p.id)) && p.is_active !== targetActive)
    const verb = targetActive ? 'diaktifkan' : 'dinonaktifkan'
    if (eligible.length === 0) {
      toast.warning(`Produk yang dipilih sudah ${verb}.`)
      return
    }
    if (!targetActive && !confirm(`Nonaktifkan ${eligible.length} produk terpilih?`)) return

    const results = await Promise.allSettled(eligible.map((p) => mutateAsync(p.id)))
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.length - successCount
    const failureDetail = getBulkFailureDetail(results)

    if (failureCount === 0) {
      toast.success(`${successCount} produk berhasil ${verb}.`)
    } else if (successCount === 0) {
      toast.error(`Gagal ${targetActive ? 'mengaktifkan' : 'menonaktifkan'} ${failureCount} produk.${failureDetail ? ` ${failureDetail}` : ''}`)
    } else {
      toast.warning(`${successCount} produk ${verb}, ${failureCount} gagal.${failureDetail ? ` ${failureDetail}` : ''}`)
    }
    setSelectedRows([])
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-activate',
      label: 'Aktifkan Terpilih',
      icon: <Power className="h-3.5 w-3.5" />,
      permission: 'products.edit',
      onClick: (ids) => runBulkStatusChange(ids, true, (id) => activate.mutateAsync(id)),
    },
    {
      id: 'bulk-deactivate',
      label: 'Nonaktifkan Terpilih',
      icon: <PowerOff className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'products.deactivate',
      onClick: (ids) => runBulkStatusChange(ids, false, (id) => deactivate.mutateAsync(id)),
    },
  ]

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
        selectedRows={selectedRows}
        onRowSelect={setSelectedRows}
        bulkActions={bulkActions}
        onRowClick={(row) => openRecordTab({ label: row.product_name, path: `/master-data/products/${row.id}` })}
        emptyTitle="Belum ada produk"
        emptyDescription="Tambahkan produk pertama untuk memulai."
      />
    </WorkspaceLayout>
  )
}
