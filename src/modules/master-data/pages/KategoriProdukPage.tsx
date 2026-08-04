import { useState } from 'react'
import { Plus, Pencil, PowerOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
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
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'

export default function KategoriProdukPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KategoriProduk | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useKategoriProdukList()
  const { create, update, deactivate } = useKategoriProdukMutations()

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

  const handleDeactivate = async (item: KategoriProduk) => {
    if (!confirm(`Nonaktifkan kategori "${item.name}"? Data historis tidak akan dihapus.`)) return
    try {
      await deactivate.mutateAsync(item.id)
      toast.success('Kategori berhasil dinonaktifkan.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menonaktifkan kategori.'))
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
      id: 'is_active',
      header: 'Status',
      size: 100,
      cell: ({ original }) => <ActiveStatusBadge isActive={original.is_active} />,
    },
    {
      id: 'actions',
      header: '',
      size: 120,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="products.edit">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="products.deactivate">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-amber-600" onClick={() => handleDeactivate(original)}>
              <PowerOff className="w-3.5 h-3.5" />
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
