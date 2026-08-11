import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { useAdminPlans, useClientUser, useClientUserMutations } from '../hooks/useClientUsers'
import { ResetPasswordSection } from '../components/ResetPasswordSection'
import {
  createClientSchema,
  editClientSchema,
  type CreateClientValues,
  type EditClientValues,
} from '../schemas/clientSchema'
import type { ClientProfileFields } from '@/types/admin.types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'suspended', label: 'Ditangguhkan' },
]

const inputClass = 'h-9 text-[13px]'
const selectClass =
  'h-9 text-[13px] w-full rounded-md border border-[#d9e2e5] bg-white px-3 text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]/40'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white border border-[#d9e2e5] rounded-lg p-5">
      <div className="mb-4">
        <h2 className="text-[14px] font-semibold text-[#24323a]">{title}</h2>
        {description && <p className="text-[12px] text-[#64748b] mt-0.5">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-[#64748b]">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

/**
 * Form akun client — halaman penuh, bukan modal, karena isiannya panjang
 * (akun, kontak, langganan, catatan) dan sering diisi sambil menyalin data dari
 * tempat lain.
 */
export default function AdminClientFormPage() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const { toast } = useToast()

  const clientId = params.id ? Number(params.id) : null
  const isEdit = clientId !== null

  const { data: clientResponse, isLoading } = useClientUser(clientId)
  const client = clientResponse?.data ?? null
  const { data: plansResponse } = useAdminPlans()
  const plans = plansResponse?.data ?? []
  const { create, update } = useClientUserMutations()

  // Dua resolver terpisah: form tambah wajib password, form ubah punya status.
  const createForm = useForm<CreateClientValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { name: '', email: '', password: '', plan_id: '', company_quota: '' },
  })
  const editForm = useForm<EditClientValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: { name: '', email: '', status: 'active', plan_id: '', company_quota: '' },
  })

  useEffect(() => {
    if (!client) return

    editForm.reset({
      name: client.name,
      email: client.email,
      status: client.status,
      phone: client.phone ?? '',
      company_name: client.company_name ?? '',
      job_title: client.job_title ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
      plan_id: client.plan ? String(client.plan.id) : '',
      company_quota: client.company_quota !== null ? String(client.company_quota) : '',
    })
  }, [client, editForm])

  const busy = create.isPending || update.isPending

  const toProfilePayload = (values: CreateClientValues | EditClientValues): ClientProfileFields => ({
    phone: values.phone || null,
    company_name: values.company_name || null,
    job_title: values.job_title || null,
    address: values.address || null,
    notes: values.notes || null,
    plan_id: values.plan_id ? Number(values.plan_id) : null,
    // String kosong berarti "ikut paket", bukan nol.
    company_quota: values.company_quota ? Number(values.company_quota) : null,
  })

  const onCreate = async (values: CreateClientValues) => {
    try {
      const response = await create.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        ...toProfilePayload(values),
      })
      toast.success('Akun client berhasil dibuat.')
      navigate(`/admin/clients/${response.data.id}`, { replace: true })
    } catch (error) {
      applyApiValidationErrors(error, createForm.setError)
      toast.error(getApiErrorMessage(error, 'Gagal membuat akun client.'))
    }
  }

  const onEdit = async (values: EditClientValues) => {
    if (!clientId) return

    try {
      await update.mutateAsync({
        id: clientId,
        payload: {
          name: values.name,
          email: values.email,
          status: values.status,
          ...toProfilePayload(values),
        },
      })
      toast.success('Data client berhasil diperbarui.')
    } catch (error) {
      applyApiValidationErrors(error, editForm.setError)
      toast.error(getApiErrorMessage(error, 'Gagal memperbarui client.'))
    }
  }

  // Field kontak & langganan identik di kedua mode, jadi register-nya dilewatkan.
  const register = (isEdit ? editForm.register : createForm.register) as UseFormRegister<
    CreateClientValues & EditClientValues
  >
  const errors = (isEdit ? editForm.formState.errors : createForm.formState.errors) as FieldErrors<
    CreateClientValues & EditClientValues
  >
  // Dibaca dari form yang sedang dipakai. `isEdit` tetap sama sepanjang hidup
  // komponen (ditentukan rute), jadi tidak ada pemanggilan yang berganti-ganti.
  const selectedPlanId = isEdit ? editForm.watch('plan_id') : createForm.watch('plan_id')
  const customQuota = isEdit
    ? editForm.watch('company_quota')
    : createForm.watch('company_quota')

  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId)
  const effectiveLimit = customQuota
    ? Number(customQuota)
    : (selectedPlan?.max_companies ?? 1)

  if (isEdit && isLoading) {
    return (
      <div className="min-h-dvh bg-[#EFEFED] p-6">
        <p className="text-[13px] text-[#64748b]">Memuat data client...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#EFEFED]">
      <div className="max-w-3xl mx-auto p-6">
        <button
          type="button"
          onClick={() => navigate('/admin/clients')}
          className="flex items-center gap-1.5 text-[13px] text-[#64748b] hover:text-[#24323a] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar client
        </button>

        <h1 className="text-lg font-semibold text-[#24323a] mb-1">
          {isEdit ? 'Edit Client' : 'Tambah Client'}
        </h1>
        <p className="text-[13px] text-[#64748b] mb-5">
          {isEdit
            ? 'Ubah data akun, kontak, dan kuota langganan client.'
            : 'Buat akun untuk client baru. Client memakai akun ini untuk login lalu menyiapkan perusahaannya sendiri.'}
        </p>

        <form
          onSubmit={
            isEdit ? editForm.handleSubmit(onEdit) : createForm.handleSubmit(onCreate)
          }
          className="space-y-4"
        >
          <Section title="Akun" description="Dipakai client untuk login.">
            <Field label="Nama" required error={errors.name?.message}>
              <Input
                autoFocus
                {...register('name')}
                placeholder="Budi Santoso"
                className={cn(inputClass, fieldErrorClass(errors.name))}
              />
            </Field>

            <Field label="Email" required error={errors.email?.message}>
              <Input
                {...register('email')}
                type="email"
                placeholder="budi@clientbaru.com"
                className={cn(inputClass, fieldErrorClass(errors.email))}
              />
            </Field>

            {isEdit ? (
              <Field
                label="Status"
                hint="Client nonaktif ditolak saat login. Datanya tidak dihapus."
                error={editForm.formState.errors.status?.message}
              >
                <select className={selectClass} {...editForm.register('status')}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field
                label="Password Awal"
                required
                hint="Sengaja terlihat supaya bisa disalin — belum ada pengiriman email otomatis."
                error={createForm.formState.errors.password?.message}
              >
                <Input
                  {...createForm.register('password')}
                  type="text"
                  placeholder="Minimal 8 karakter"
                  className={cn(inputClass, fieldErrorClass(createForm.formState.errors.password))}
                />
              </Field>
            )}
          </Section>

          <Section title="Kontak" description="Catatan hubungan bisnis, semuanya opsional.">
            <Field label="Nomor Telepon" error={errors.phone?.message}>
              <Input
                {...register('phone')}
                placeholder="08123456789"
                className={cn(inputClass, fieldErrorClass(errors.phone))}
              />
            </Field>

            <Field label="Nama Perusahaan" error={errors.company_name?.message}>
              <Input
                {...register('company_name')}
                placeholder="CV Sinar Terang"
                className={cn(inputClass, fieldErrorClass(errors.company_name))}
              />
            </Field>

            <Field label="Jabatan" error={errors.job_title?.message}>
              <Input
                {...register('job_title')}
                placeholder="Direktur Keuangan"
                className={cn(inputClass, fieldErrorClass(errors.job_title))}
              />
            </Field>

            <Field label="Alamat" error={errors.address?.message} className="sm:col-span-2">
              <Textarea
                {...register('address')}
                rows={2}
                placeholder="Jl. Melati No. 12, Surabaya"
                className="text-[13px]"
              />
            </Field>
          </Section>

          <Section
            title="Langganan"
            description="Menentukan berapa perusahaan yang boleh dibuat client ini."
          >
            <Field label="Paket" error={errors.plan_id?.message}>
              <select className={selectClass} {...register('plan_id')}>
                <option value="">Tanpa paket</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={String(plan.id)}>
                    {plan.name} — {plan.max_companies} perusahaan
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Kuota Khusus"
              hint="Kosongkan untuk mengikuti paket. Diisi angka berapa pun, misal 5 atau 20."
              error={errors.company_quota?.message}
            >
              <Input
                {...register('company_quota')}
                inputMode="numeric"
                placeholder="Ikut paket"
                className={cn(inputClass, 'tabular-nums', fieldErrorClass(errors.company_quota))}
              />
            </Field>

            <p className="sm:col-span-2 text-[12px] text-[#475569] bg-[#EFF9FB] border border-[#d9e2e5] rounded-md px-3 py-2">
              Batas berlaku: <span className="font-semibold tabular-nums">{effectiveLimit}</span>{' '}
              perusahaan
              {customQuota ? ' (kuota khusus, menimpa paket)' : ' (dari paket)'}.
              {isEdit && client && client.companies_used > effectiveLimit && (
                <>
                  {' '}
                  Client ini sudah punya{' '}
                  <span className="font-semibold tabular-nums">{client.companies_used}</span>{' '}
                  perusahaan — yang sudah ada tidak dihapus, hanya penambahan baru yang ditahan.
                </>
              )}
            </p>
          </Section>

          <Section title="Catatan">
            <Field label="Catatan Internal" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea
                {...register('notes')}
                rows={3}
                placeholder="Berlangganan sejak Agustus 2026, kontak via WhatsApp."
                className="text-[13px]"
              />
            </Field>
          </Section>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 text-[13px]"
              disabled={busy}
              onClick={() => navigate('/admin/clients')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-[#e39774] hover:bg-[#d4845e] h-9 text-[13px]"
              disabled={busy}
            >
              {busy ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>

        {isEdit && client && <ResetPasswordSection client={client} />}
      </div>
    </div>
  )
}
