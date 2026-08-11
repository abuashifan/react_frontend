import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { useAdminPlans, useClientUserMutations } from '../hooks/useClientUsers'
import {
  createClientSchema,
  editClientSchema,
  type CreateClientValues,
  type EditClientValues,
} from '../schemas/clientSchema'
import type { ClientUser } from '@/types/admin.types'

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null berarti membuat client baru. */
  client: ClientUser | null
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'suspended', label: 'Ditangguhkan' },
]

const selectClass =
  'h-9 text-[13px] w-full rounded-md border border-[#d9e2e5] bg-white px-3 text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]/40'

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const { toast } = useToast()
  const isEdit = client !== null
  const { data: plansResponse } = useAdminPlans()
  const plans = plansResponse?.data ?? []
  const { create, update, updatePlan } = useClientUserMutations()

  const createForm = useForm<CreateClientValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { name: '', email: '', password: '', plan_id: '' },
  })

  const editForm = useForm<EditClientValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: { name: '', email: '', status: 'active', plan_id: '' },
  })

  useEffect(() => {
    if (!open) return

    if (client) {
      editForm.reset({
        name: client.name,
        email: client.email,
        status: client.status,
        plan_id: client.plan ? String(client.plan.id) : '',
      })
    } else {
      createForm.reset({ name: '', email: '', password: '', plan_id: '' })
    }
    // Form diisi ulang tiap dialog dibuka; instance form-nya stabil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client])

  const busy = create.isPending || update.isPending || updatePlan.isPending

  const handleOpenChange = (next: boolean) => {
    if (busy) return
    onOpenChange(next)
  }

  const onCreate = async (values: CreateClientValues) => {
    try {
      await create.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        plan_id: values.plan_id ? Number(values.plan_id) : null,
      })
      toast.success('Akun client berhasil dibuat.')
      onOpenChange(false)
    } catch (error) {
      applyApiValidationErrors(error, createForm.setError)
      toast.error(getApiErrorMessage(error, 'Gagal membuat akun client.'))
    }
  }

  const onEdit = async (values: EditClientValues) => {
    if (!client) return

    try {
      await update.mutateAsync({
        id: client.id,
        payload: { name: values.name, email: values.email, status: values.status },
      })

      // Paket punya endpoint sendiri supaya perubahan kuota terlihat jelas di
      // riwayat request, bukan tersembunyi di antara perubahan profil.
      const nextPlanId = values.plan_id ? Number(values.plan_id) : null
      const currentPlanId = client.plan?.id ?? null
      if (nextPlanId !== currentPlanId) {
        await updatePlan.mutateAsync({ id: client.id, planId: nextPlanId })
      }

      toast.success('Data client berhasil diperbarui.')
      onOpenChange(false)
    } catch (error) {
      applyApiValidationErrors(error, editForm.setError)
      toast.error(getApiErrorMessage(error, 'Gagal memperbarui client.'))
    }
  }

  const selectedPlanId = isEdit ? editForm.watch('plan_id') : createForm.watch('plan_id')
  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId)
  const quotaHint = selectedPlan
    ? `Paket ${selectedPlan.name}: maksimal ${selectedPlan.max_companies} perusahaan.`
    : 'Tanpa paket, client dibatasi 1 perusahaan.'

  const overQuotaWarning =
    isEdit && client && selectedPlan && client.companies_used > selectedPlan.max_companies
      ? `Client ini sudah punya ${client.companies_used} perusahaan. Menurunkan paket tidak menghapusnya — client tetap bisa mengaksesnya, hanya tidak bisa menambah lagi.`
      : null

  const planField = (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
        Paket
      </Label>
      <select
        className={selectClass}
        {...(isEdit ? editForm.register('plan_id') : createForm.register('plan_id'))}
      >
        <option value="">Tanpa paket (1 perusahaan)</option>
        {plans.map((plan) => (
          <option key={plan.id} value={String(plan.id)}>
            {plan.name} — {plan.max_companies} perusahaan
          </option>
        ))}
      </select>
      <p className="text-[11px] text-[#64748b]">{quotaHint}</p>
      {overQuotaWarning && <p className="text-[11px] text-[#b45309]">{overQuotaWarning}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">
            {isEdit ? 'Edit Client' : 'Tambah Client'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#64748b]">
            {isEdit
              ? 'Ubah data akun dan paket langganan client.'
              : 'Buat akun untuk client baru. Client memakai akun ini untuk login lalu menyiapkan perusahaannya sendiri.'}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                {...editForm.register('name')}
                className={cn('h-9 text-[13px]', fieldErrorClass(editForm.formState.errors.name))}
              />
              <FieldError message={editForm.formState.errors.name?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                {...editForm.register('email')}
                type="email"
                className={cn('h-9 text-[13px]', fieldErrorClass(editForm.formState.errors.email))}
              />
              <FieldError message={editForm.formState.errors.email?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Status
              </Label>
              <select className={selectClass} {...editForm.register('status')}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#64748b]">
                Client nonaktif ditolak saat login. Datanya tidak dihapus.
              </p>
            </div>

            {planField}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 text-[13px]"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]"
                disabled={busy}
              >
                {busy ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                autoFocus
                {...createForm.register('name')}
                placeholder="Budi Santoso"
                className={cn('h-9 text-[13px]', fieldErrorClass(createForm.formState.errors.name))}
              />
              <FieldError message={createForm.formState.errors.name?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                {...createForm.register('email')}
                type="email"
                placeholder="budi@clientbaru.com"
                className={cn('h-9 text-[13px]', fieldErrorClass(createForm.formState.errors.email))}
              />
              <FieldError message={createForm.formState.errors.email?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Password Awal <span className="text-red-500">*</span>
              </Label>
              <Input
                {...createForm.register('password')}
                type="text"
                placeholder="Minimal 8 karakter"
                className={cn(
                  'h-9 text-[13px]',
                  fieldErrorClass(createForm.formState.errors.password),
                )}
              />
              <FieldError message={createForm.formState.errors.password?.message} />
              <p className="text-[11px] text-[#64748b]">
                Sengaja ditampilkan supaya bisa disalin — belum ada pengiriman email otomatis.
              </p>
            </div>

            {planField}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 text-[13px]"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]"
                disabled={busy}
              >
                {busy ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
