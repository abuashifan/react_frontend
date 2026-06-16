import { useState } from 'react'
import { Plus, Pencil, PowerOff } from 'lucide-react'
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
  const { create, update, deactivate } = useSatuanMutations()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SatuanFormValues>({
    resolver: zodResolver(satuanSchema),
    defaultValues: { precision: 0 as number },
  })

  const openCreate = () => {
    setEditingItem(null)
    reset({ name: '', code: '', precision: 0 })
    setDialogOpen(true)
  }

  const openEdit = (item: Satuan) => {
    setEditingItem(item)
    reset({ name: item.name, code: item.code, precision: item.precision })
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

  const handleDeactivate = async (item: Satuan) => {
    if (!confirm(`Nonaktifkan satuan "${item.name}"? Data historis tidak akan dihapus.`)) return
    try {
      await deactivate.mutateAsync(item.id)
      toast.success('Satuan berhasil dinonaktifkan.')
    } catch {
      toast.error('Gagal menonaktifkan satuan.')
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
      id: 'code',
      header: 'Kode',
      size: 100,
      cell: ({ original }) => original.code,
    },
    {
      id: 'precision',
      header: 'Presisi',
      size: 90,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => original.precision,
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="units.edit">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="units.deactivate">
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
      title="Satuan"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Satuan' }]}
      action={
        <PermissionGuard permission="units.create">
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
                Kode <span className="text-red-500">*</span>
              </Label>
              <Input {...register('code')} placeholder="kg" className="h-9 text-[13px]" />
              {errors.code && <p className="text-[11px] text-red-500">{errors.code.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Presisi Desimal</Label>
              <Input {...register('precision', { valueAsNumber: true })} type="number" min="0" max="8" className="h-9 text-[13px] tabular-nums" />
              {errors.precision && <p className="text-[11px] text-red-500">{errors.precision.message}</p>}
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
