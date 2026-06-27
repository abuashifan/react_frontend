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
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { usePaymentTermsList, usePaymentTermsMutations } from '../hooks/useSimpleLists'
import { paymentTermsSchema, type PaymentTermsFormValues } from '../schemas/paymentTermsSchema'
import type { PaymentTerms } from '../types/paymentTerms.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { cn } from '@/lib/utils'

export default function PaymentTermsPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PaymentTerms | null>(null)

  const { data, isLoading, isFetching } = usePaymentTermsList()
  const { create, update, deactivate } = usePaymentTermsMutations()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentTermsFormValues>({ resolver: zodResolver(paymentTermsSchema) })

  const openCreate = () => {
    setEditingItem(null)
    reset({ code: '', name: '', days: 0 as number })
    setDialogOpen(true)
  }

  const openEdit = (item: PaymentTerms) => {
    setEditingItem(item)
    reset({ code: item.code, name: item.name, days: item.days })
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

  const handleDeactivate = async (item: PaymentTerms) => {
    if (!confirm(`Nonaktifkan syarat pembayaran "${item.name}"? Data historis tidak akan dihapus.`)) return
    try {
      await deactivate.mutateAsync(item.id)
      toast.success('Syarat pembayaran berhasil dinonaktifkan.')
    } catch {
      toast.error('Gagal menonaktifkan syarat pembayaran.')
    }
  }

  const columns: ColumnDef<PaymentTerms>[] = [
    {
      id: 'code',
      header: 'Kode',
      size: 100,
      meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.code,
    },
    {
      id: 'name',
      header: 'Nama',
      size: 180,
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
          <PermissionGuard permission="payment_terms.edit">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="payment_terms.deactivate">
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
      title="Syarat Pembayaran"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Syarat Pembayaran' }]}
      action={
        <PermissionGuard permission="payment_terms.create">
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
            <DialogDescription className="text-[13px] text-[#64748b]">Lengkapi nama dan jumlah hari jatuh tempo syarat pembayaran.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Kode <span className="text-red-500">*</span>
              </Label>
              <Input {...register('code')} placeholder="NET30" className="h-9 text-[13px]" />
              {errors.code && <p className="text-[11px] text-red-500">{errors.code.message}</p>}
            </div>
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
