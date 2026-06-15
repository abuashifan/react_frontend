import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { useKategoriProdukList, useKategoriProdukMutations } from '../hooks/useSimpleLists'
import { kategoriProdukSchema, type KategoriProdukFormValues } from '../schemas/kategoriProdukSchema'
import type { KategoriProduk } from '../types/kategoriProduk.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'

export default function KategoriProdukPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KategoriProduk | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useKategoriProdukList()
  const { create, update, remove } = useKategoriProdukMutations()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KategoriProdukFormValues>({
    resolver: zodResolver(kategoriProdukSchema),
  })

  const openCreate = () => {
    setEditingItem(null)
    reset({ name: '', description: '' })
    setDialogOpen(true)
  }

  const openEdit = (item: KategoriProduk) => {
    setEditingItem(item)
    reset({ name: item.name, description: item.description ?? '' })
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
    } catch {
      toast.error('Gagal menyimpan kategori.')
    }
  }

  const handleDelete = async (item: KategoriProduk) => {
    if (!confirm(`Hapus kategori "${item.name}"?`)) return
    try {
      await remove.mutateAsync(item.id)
      toast.success('Kategori berhasil dihapus.')
    } catch {
      toast.error('Gagal menghapus kategori.')
    }
  }

  const columns: ColumnDef<KategoriProduk>[] = [
    {
      id: 'name',
      header: 'Nama Kategori',
      size: 200,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'description',
      header: 'Deskripsi',
      size: 280,
      cell: ({ original }) => original.description ?? '-',
    },
    {
      id: 'product_count',
      header: 'Jumlah Produk',
      size: 130,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => original.product_count,
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="master-data.product-categories.edit">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="master-data.product-categories.delete">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-red-500" onClick={() => handleDelete(original)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ]

  return (
    <WorkspaceLayout
      title="Kategori Produk"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Kategori Produk' }]}
      action={
        <PermissionGuard permission="master-data.product-categories.create">
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
        emptyTitle="Belum ada kategori produk"
        emptyDescription="Tambahkan kategori untuk mengelompokkan produk."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Elektronik" className="h-9 text-[13px]" />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</Label>
              <Textarea {...register('description')} placeholder="Keterangan (opsional)" className="text-[13px] resize-none" rows={2} />
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
