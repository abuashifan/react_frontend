import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { useGudangList, useGudangMutations } from '../hooks/useSimpleLists'
import { gudangSchema, type GudangFormValues } from '../schemas/gudangSchema'
import type { Gudang } from '../types/gudang.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { cn } from '@/lib/utils'

export default function GudangPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Gudang | null>(null)

  const { data, isLoading, isFetching } = useGudangList()
  const { create, update, remove } = useGudangMutations()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GudangFormValues>({
    resolver: zodResolver(gudangSchema),
    defaultValues: { is_active: true as boolean },
  })

  const openCreate = () => {
    setEditingItem(null)
    reset({ name: '', address: '', is_active: true })
    setDialogOpen(true)
  }

  const openEdit = (item: Gudang) => {
    setEditingItem(item)
    reset({ name: item.name, address: item.address ?? '', is_active: item.is_active })
    setDialogOpen(true)
  }

  const onSubmit = async (values: GudangFormValues) => {
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload: values })
        toast.success('Gudang berhasil diperbarui.')
      } else {
        await create.mutateAsync(values)
        toast.success('Gudang berhasil dibuat.')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Gagal menyimpan gudang.')
    }
  }

  const handleDelete = async (item: Gudang) => {
    if (!confirm(`Hapus gudang "${item.name}"?`)) return
    try {
      await remove.mutateAsync(item.id)
      toast.success('Gudang berhasil dihapus.')
    } catch {
      toast.error('Gagal menghapus gudang.')
    }
  }

  const columns: ColumnDef<Gudang>[] = [
    {
      id: 'name',
      header: 'Nama Gudang',
      size: 200,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'address',
      header: 'Alamat',
      size: 280,
      cell: ({ original }) => original.address ?? '-',
    },
    {
      id: 'is_active',
      header: 'Status',
      size: 90,
      cell: ({ original }) => (
        <Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', original.is_active ? 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]' : 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]')}>
          {original.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="master-data.warehouses.edit">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="master-data.warehouses.delete">
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
      title="Gudang"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Gudang' }]}
      action={
        <PermissionGuard permission="master-data.warehouses.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Gudang
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
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={() => {}}
        emptyTitle="Belum ada gudang"
        emptyDescription="Tambahkan gudang untuk menyimpan stok produk."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Gudang' : 'Tambah Gudang'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Gudang Utama" className="h-9 text-[13px]" />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alamat</Label>
              <Textarea {...register('address')} placeholder="Alamat gudang (opsional)" className="text-[13px] resize-none" rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label className="text-[13px] text-[#24323a]">Gudang aktif</Label>
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
