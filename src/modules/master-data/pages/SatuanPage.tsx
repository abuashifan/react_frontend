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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { useSatuanList, useSatuanMutations } from '../hooks/useSimpleLists'
import { satuanSchema, type SatuanFormValues } from '../schemas/satuanSchema'
import type { Satuan } from '../types/satuan.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'

export default function SatuanPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Satuan | null>(null)

  const { data, isLoading, isFetching } = useSatuanList()
  const { create, update, remove } = useSatuanMutations()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SatuanFormValues>({
    resolver: zodResolver(satuanSchema),
    defaultValues: { decimal_places: 0 as number },
  })

  const openCreate = () => {
    setEditingItem(null)
    reset({ name: '', symbol: '', decimal_places: 0 })
    setDialogOpen(true)
  }

  const openEdit = (item: Satuan) => {
    setEditingItem(item)
    reset({ name: item.name, symbol: item.symbol, decimal_places: item.decimal_places })
    setDialogOpen(true)
  }

  const onSubmit = async (values: SatuanFormValues) => {
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload: values })
        toast.success('Satuan berhasil diperbarui.')
      } else {
        await create.mutateAsync(values)
        toast.success('Satuan berhasil dibuat.')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Gagal menyimpan satuan.')
    }
  }

  const handleDelete = async (item: Satuan) => {
    if (!confirm(`Hapus satuan "${item.name}"?`)) return
    try {
      await remove.mutateAsync(item.id)
      toast.success('Satuan berhasil dihapus.')
    } catch {
      toast.error('Gagal menghapus satuan.')
    }
  }

  const columns: ColumnDef<Satuan>[] = [
    {
      id: 'name',
      header: 'Nama',
      size: 180,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'symbol',
      header: 'Simbol',
      size: 100,
      cell: ({ original }) => original.symbol,
    },
    {
      id: 'decimal_places',
      header: 'Desimal',
      size: 90,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => original.decimal_places,
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="master-data.units.edit">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="master-data.units.delete">
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
      title="Satuan"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Satuan' }]}
      action={
        <PermissionGuard permission="master-data.units.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Satuan
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
        emptyTitle="Belum ada satuan"
        emptyDescription="Tambahkan satuan seperti pcs, kg, liter, dll."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Satuan' : 'Tambah Satuan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Kilogram" className="h-9 text-[13px]" />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Simbol <span className="text-red-500">*</span>
              </Label>
              <Input {...register('symbol')} placeholder="kg" className="h-9 text-[13px]" />
              {errors.symbol && <p className="text-[11px] text-red-500">{errors.symbol.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Presisi Desimal</Label>
              <Input {...register('decimal_places', { valueAsNumber: true })} type="number" min="0" max="8" className="h-9 text-[13px] tabular-nums" />
              {errors.decimal_places && <p className="text-[11px] text-red-500">{errors.decimal_places.message}</p>}
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
