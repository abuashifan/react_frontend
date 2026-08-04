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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { useSatuanList, useSatuanMutations } from '../hooks/useSimpleLists'
import { satuanSchema, type SatuanFormValues } from '../schemas/satuanSchema'
import type { Satuan } from '../types/satuan.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'

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
    setError,
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
    } catch (error) {
      // DUPLICATE_UNIT_CODE dsb. ditandai di field terkait sekaligus di toast.
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan satuan.'))
    }
  }

  const handleDeactivate = async (item: Satuan) => {
    if (!confirm(`Nonaktifkan satuan "${item.name}"? Data historis tidak akan dihapus.`)) return
    try {
      await deactivate.mutateAsync(item.id)
      toast.success('Satuan berhasil dinonaktifkan.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menonaktifkan satuan.'))
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
            <DialogDescription className="text-[13px] text-[#64748b]">Lengkapi nama dan kode satuan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Kilogram" className={cn('h-9 text-[13px]', fieldErrorClass(errors.name))} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Kode <span className="text-red-500">*</span>
              </Label>
              <Input {...register('code')} placeholder="kg" className={cn('h-9 text-[13px]', fieldErrorClass(errors.code))} />
              <FieldError message={errors.code?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Presisi Desimal</Label>
              <Input {...register('precision', { valueAsNumber: true })} type="number" min="0" max="8" className={cn('h-9 text-[13px] tabular-nums', fieldErrorClass(errors.precision))} />
              <FieldError message={errors.precision?.message} />
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
