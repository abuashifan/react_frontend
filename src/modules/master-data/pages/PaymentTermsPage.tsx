import { useDeferredValue, useState } from 'react'
import { Plus, Pencil, Power, PowerOff, Star } from 'lucide-react'
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
import { MasterDataSearch } from '../components/MasterDataSearch'
import { MasterDataQueryError } from '../components/MasterDataQueryError'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useCompanySettings, useCompanySettingsMutations } from '@/modules/settings/hooks/useCompanySettings'
import { usePermission } from '@/hooks/usePermission'

export default function PaymentTermsPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PaymentTerms | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const { can } = usePermission()
  const canViewCompanySettings = can('settings.company.view')

  const query = usePaymentTermsList({ page, per_page: perPage, search: deferredSearch || undefined })
  const { create, update, activate, deactivate } = usePaymentTermsMutations()
  const companySettings = useCompanySettings(canViewCompanySettings)
  const { updateTransactionDefaults } = useCompanySettingsMutations()
  const defaultPaymentTermId = companySettings.data?.data.transaction_defaults?.default_payment_term_id ?? null

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PaymentTermsFormValues>({ resolver: zodResolver(paymentTermsSchema) })

  const openCreate = () => {
    setEditingItem(null)
    reset({ code: '', name: '', days: 30 })
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
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan syarat pembayaran.'))
    }
  }

  const updateSelectedStatus = async (active: boolean) => {
    if (!confirm(`${active ? 'Aktifkan' : 'Nonaktifkan'} ${selectedRows.length} syarat pembayaran terpilih?`)) return
    try {
      await Promise.all(selectedRows.map((rowId) =>
        active ? activate.mutateAsync(Number(rowId)) : deactivate.mutateAsync(Number(rowId)),
      ))
      toast.success(`${selectedRows.length} syarat pembayaran berhasil ${active ? 'diaktifkan' : 'dinonaktifkan'}.`)
      setSelectedRows([])
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Sebagian status syarat pembayaran gagal diubah.'))
    }
  }

  const handleActivate = async (item: PaymentTerms) => {
    try {
      await activate.mutateAsync(item.id)
      toast.success('Syarat pembayaran berhasil diaktifkan.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengaktifkan syarat pembayaran.'))
    }
  }

  const handleDeactivate = async (item: PaymentTerms) => {
    if (!confirm(`Nonaktifkan syarat pembayaran "${item.name}"? Data historis tidak akan dihapus.`)) return
    try {
      await deactivate.mutateAsync(item.id)
      toast.success('Syarat pembayaran berhasil dinonaktifkan.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menonaktifkan syarat pembayaran.'))
    }
  }

  const handleSetDefault = async (item: PaymentTerms) => {
    try {
      await updateTransactionDefaults.mutateAsync({ default_payment_term_id: item.id })
      toast.success(`"${item.name}" sekarang menjadi syarat pembayaran default.`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengubah syarat pembayaran default.'))
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
      id: 'default',
      header: 'Default',
      size: 90,
      cell: ({ original }) => defaultPaymentTermId === original.id
        ? <Badge className="bg-[#EFF9FB] text-[#326273] hover:bg-[#EFF9FB]">Default</Badge>
        : '-',
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
      size: 140,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="settings.company.edit">
            <Button
              type="button"
              aria-label={`Jadikan ${original.name} syarat pembayaran default`}
              title={original.is_active ? 'Jadikan default' : 'Aktifkan terlebih dahulu untuk menjadikannya default'}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-[#64748b] hover:text-amber-500 disabled:opacity-30"
              disabled={!original.is_active || defaultPaymentTermId === original.id || updateTransactionDefaults.isPending}
              onClick={() => void handleSetDefault(original)}
            >
              <Star className={cn('w-3.5 h-3.5', defaultPaymentTermId === original.id && 'fill-amber-400 text-amber-500')} />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="payment_terms.edit">
            <Button type="button" aria-label={`Edit syarat pembayaran ${original.name}`} variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission={original.is_active ? 'payment_terms.deactivate' : 'payment_terms.edit'}>
            <Button type="button" aria-label={`${original.is_active ? 'Nonaktifkan' : 'Aktifkan'} syarat pembayaran ${original.name}`} variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-amber-600" onClick={() => original.is_active ? handleDeactivate(original) : void handleActivate(original)}>
              {original.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
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
      <MasterDataSearch value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Cari kode atau nama syarat pembayaran..." />
      {query.isError ? <MasterDataQueryError error={query.error} onRetry={() => void query.refetch()} /> : <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        totalRows={query.data?.meta.total ?? 0}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(state) => { setPage(state.pageIndex + 1); setPerPage(state.pageSize) }}
        selectedRows={selectedRows}
        onRowSelect={setSelectedRows}
        bulkActions={[
          { id: 'activate', label: 'Aktifkan', icon: <Power className="h-3.5 w-3.5" />, permission: 'payment_terms.edit', onClick: () => void updateSelectedStatus(true) },
          { id: 'deactivate', label: 'Nonaktifkan', icon: <PowerOff className="h-3.5 w-3.5" />, permission: 'payment_terms.deactivate', variant: 'destructive', onClick: () => void updateSelectedStatus(false) },
        ]}
        emptyTitle="Belum ada syarat pembayaran"
        emptyDescription="Tambahkan syarat pembayaran seperti COD, Net 30, dll."
      />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Syarat Pembayaran' : 'Tambah Syarat Pembayaran'}</DialogTitle>
            <DialogDescription>Atur kode, nama, dan jumlah hari jatuh tempo pembayaran.</DialogDescription>
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
              <Input {...register('days', { valueAsNumber: true })} type="number" min="1" max="3650" placeholder="30" className="h-9 text-[13px] tabular-nums" />
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
