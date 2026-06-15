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
import { usePaymentTermsList, usePaymentTermsMutations } from '../hooks/useSimpleLists'
import { paymentTermsSchema, type PaymentTermsFormValues } from '../schemas/paymentTermsSchema'
import type { PaymentTerms } from '../types/paymentTerms.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'

export default function PaymentTermsPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PaymentTerms | null>(null)

  const { data, isLoading, isFetching } = usePaymentTermsList()
  const { create, update, remove } = usePaymentTermsMutations()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentTermsFormValues>({ resolver: zodResolver(paymentTermsSchema) })

  const openCreate = () => {
    setEditingItem(null)
    reset({ name: '', days: 0 as number, description: '' })
    setDialogOpen(true)
  }

  const openEdit = (item: PaymentTerms) => {
    setEditingItem(item)
    reset({ name: item.name, days: item.days, description: item.description ?? '' })
    setDialogOpen(true)
  }

  const onSubmit = async (values: PaymentTermsFormValues) => {
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload: values })
        toast.success('Syarat pembayaran berhasil diperbarui.')
      } else {
        await create.mutateAsync(values)
        toast.success('Syarat pembayaran berhasil dibuat.')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Gagal menyimpan syarat pembayaran.')
    }
  }

  const handleDelete = async (item: PaymentTerms) => {
    if (!confirm(`Hapus syarat pembayaran "${item.name}"?`)) return
    try {
      await remove.mutateAsync(item.id)
      toast.success('Syarat pembayaran berhasil dihapus.')
    } catch {
      toast.error('Gagal menghapus syarat pembayaran.')
    }
  }

  const columns: ColumnDef<PaymentTerms>[] = [
    {
      id: 'name',
      header: 'Nama',
      size: 180,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'days',
      header: 'Jumlah Hari',
      size: 120,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => `${original.days} hari`,
    },
    {
      id: 'description',
      header: 'Deskripsi',
      size: 240,
      cell: ({ original }) => original.description ?? '-',
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="master-data.payment-terms.edit">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="master-data.payment-terms.delete">
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
      title="Syarat Pembayaran"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Syarat Pembayaran' }]}
      action={
        <PermissionGuard permission="master-data.payment-terms.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Syarat Bayar
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
        emptyTitle="Belum ada syarat pembayaran"
        emptyDescription="Tambahkan syarat pembayaran seperti COD, Net 30, dll."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Syarat Pembayaran' : 'Tambah Syarat Pembayaran'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Net 30" className="h-9 text-[13px]" />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Jumlah Hari <span className="text-red-500">*</span>
              </Label>
              <Input {...register('days', { valueAsNumber: true })} type="number" min="0" placeholder="30" className="h-9 text-[13px] tabular-nums" />
              {errors.days && <p className="text-[11px] text-red-500">{errors.days.message}</p>}
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
