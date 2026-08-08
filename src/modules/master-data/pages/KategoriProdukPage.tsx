import { useState } from 'react'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActiveStatusBadge } from '@/components/shared/badge/ActiveStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { useKategoriProdukList, useKategoriProdukMutations } from '../hooks/useSimpleLists'
import { kategoriProdukSchema, type KategoriProdukFormValues } from '../schemas/kategoriProdukSchema'
import type { KategoriProduk } from '../types/kategoriProduk.types'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import { applyApiValidationErrors, getApiErrorMessage, getBulkFailureDetail } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'

const STATUS_OPTIONS: { value: boolean | undefined; label: string }[] = [
  { value: true, label: 'Aktif' },
  { value: false, label: 'Nonaktif' },
  { value: undefined, label: 'Semua' },
]

export default function KategoriProdukPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KategoriProduk | null>(null)
  const [page, setPage] = useState(1)

  // Default: hanya tampilkan kategori produk aktif. Pilih "Semua" di filter Status untuk menampilkan semuanya.
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [prevFilters, setPrevFilters] = useState('')

  const { data, isLoading, isFetching } = useKategoriProdukList({
    page,
    is_active: filterActive,
    search: search || undefined,
  })

  // Kembali ke halaman 1 saat filter berubah, supaya tidak mendarat di halaman kosong.
  const filterKey = `${search}|${String(filterActive)}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(1)
  }

  const { create, update, activate, deactivate } = useKategoriProdukMutations()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<KategoriProdukFormValues>({
    resolver: zodResolver(kategoriProdukSchema),
  })

  const openCreate = () => {
    setEditingItem(null)
    reset({ name: '' })
    setDialogOpen(true)
  }

  const openEdit = (item: KategoriProduk) => {
    setEditingItem(item)
    reset({ name: item.name })
    setDialogOpen(true)
  }

  const onSubmit = async (values: KategoriProdukFormValues) => {
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload: values })
        toast.success('Kategori berhasil diperbarui.')
      } else {
        await create.mutateAsync(values)
        toast.success('Kategori berhasil dibuat.')
      }
      setDialogOpen(false)
    } catch (error) {
      // Penyebab spesifik dari backend ditandai di field terkait sekaligus di toast.
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan kategori.'))
    }
  }

  const runBulkStatusChange = async (
    ids: string[],
    targetActive: boolean,
    mutateAsync: (id: number) => Promise<unknown>,
  ) => {
    const rows = data?.data ?? []
    const eligible = rows.filter((r) => ids.includes(String(r.id)) && r.is_active !== targetActive)
    const verb = targetActive ? 'diaktifkan' : 'dinonaktifkan'
    if (eligible.length === 0) {
      toast.warning(`Kategori yang dipilih sudah ${verb}.`)
      return
    }
    if (!targetActive && !confirm(`Nonaktifkan ${eligible.length} kategori produk terpilih? Data historis tidak akan dihapus.`)) return

    const results = await Promise.allSettled(eligible.map((r) => mutateAsync(r.id)))
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.length - successCount
    const failureDetail = getBulkFailureDetail(results)

    if (failureCount === 0) {
      toast.success(`${successCount} kategori produk berhasil ${verb}.`)
    } else if (successCount === 0) {
      toast.error(`Gagal ${targetActive ? 'mengaktifkan' : 'menonaktifkan'} ${failureCount} kategori produk.${failureDetail ? ` ${failureDetail}` : ''}`)
    } else {
      toast.warning(`${successCount} kategori produk ${verb}, ${failureCount} gagal.${failureDetail ? ` ${failureDetail}` : ''}`)
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
      activeCount={filterActive !== undefined ? 1 : 0}
      onReset={() => setFilterActive(true)}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari nama kategori..."
          className="w-full max-w-none"
        />
      </div>
      <SingleCheckboxFilter
        title="Status"
        options={STATUS_OPTIONS}
        value={filterActive}
        onChange={setFilterActive}
      />
    </FilterSidebar>
  )

  const columns: ColumnDef<KategoriProduk>[] = [
    {
      id: 'name',
      header: 'Nama Kategori',
      size: 200,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'is_active',
      header: 'Status',
      size: 100,
      cell: ({ original }) => <ActiveStatusBadge isActive={original.is_active} />,
    },
    {
      // Aktif/nonaktif pindah ke bulkActions (format KontakListPage).
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ original }) => (
        <PermissionGuard permission="products.edit">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </PermissionGuard>
      ),
    },
  ]

  return (
    <WorkspaceLayout
      title="Kategori Produk"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Kategori Produk' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="products.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Kategori
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
        emptyTitle="Belum ada kategori produk"
        emptyDescription="Tambahkan kategori untuk mengelompokkan produk."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">Lengkapi nama kategori produk.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Elektronik" className={cn('h-9 text-[13px]', fieldErrorClass(errors.name))} />
              <FieldError message={errors.name?.message} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
