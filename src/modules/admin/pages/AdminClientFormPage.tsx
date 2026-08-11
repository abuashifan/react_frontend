import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

/**
 * Field mana milik tab mana. Dipakai untuk melompat ke tab yang memuat error
 * saat simpan gagal — tanpa ini, pesan validasi bisa tersembunyi di tab lain
 * dan tombol Simpan terlihat "tidak melakukan apa-apa".
 */
const TAB_FIELDS = {
  detail: [
    'name',
    'email',
    'password',
    'status',
    'phone',
    'company_name',
    'job_title',
    'address',
    'notes',
  ],
  langganan: ['plan_id', 'company_quota', 'user_quota'],
  addons: ['extra_users'],
} as const

type TabKey = keyof typeof TAB_FIELDS | 'password'

const inputClass = 'h-9 text-[13px]'
const selectClass =
  'h-9 text-[13px] w-full rounded-md border border-[#d9e2e5] bg-white px-3 text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]/40'

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
 * Form akun client, dibagi per tab supaya muat satu layar tanpa menggulir.
 *
 * Tab "Reset Password" punya form sendiri dan sengaja dirender di luar elemen
 * <form> utama: form bersarang tidak sah di HTML, dan mengganti password memang
 * tidak boleh ikut tersimpan bersama perubahan profil.
 */
export default function AdminClientFormPage() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const { toast } = useToast()

  const clientId = params.id ? Number(params.id) : null
  const isEdit = clientId !== null
  const [tab, setTab] = useState<TabKey>('detail')

  const { data: clientResponse, isLoading } = useClientUser(clientId)
  const client = clientResponse?.data ?? null
  const { data: plansResponse } = useAdminPlans()
  const plans = plansResponse?.data ?? []
  const { create, update } = useClientUserMutations()

  // Dua resolver terpisah: form tambah wajib password, form ubah punya status.
  const createForm = useForm<CreateClientValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      plan_id: '',
      company_quota: '',
      user_quota: '',
      extra_users: '',
    },
  })
  const editForm = useForm<EditClientValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      name: '',
      email: '',
      status: 'active',
      plan_id: '',
      company_quota: '',
      user_quota: '',
      extra_users: '',
    },
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
      user_quota: client.user_quota !== null ? String(client.user_quota) : '',
      // Nol ditampilkan kosong: "belum beli add-on" lebih jelas dibaca sebagai
      // kolom kosong ketimbang angka 0.
      extra_users: client.extra_users ? String(client.extra_users) : '',
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
    user_quota: values.user_quota ? Number(values.user_quota) : null,
    // Add-on tidak punya keadaan "ikut paket": kosong berarti nol.
    extra_users: values.extra_users ? Number(values.extra_users) : 0,
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
      focusTabWithError(createForm.formState.errors)
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
      focusTabWithError(editForm.formState.errors)
    }
  }

  const register = (isEdit ? editForm.register : createForm.register) as UseFormRegister<
    CreateClientValues & EditClientValues
  >
  const errors = (isEdit ? editForm.formState.errors : createForm.formState.errors) as FieldErrors<
    CreateClientValues & EditClientValues
  >

  function tabOf(field: string): TabKey | null {
    for (const [key, fields] of Object.entries(TAB_FIELDS)) {
      if ((fields as readonly string[]).includes(field)) return key as TabKey
    }
    return null
  }

  function focusTabWithError(currentErrors: FieldErrors) {
    const first = Object.keys(currentErrors)[0]
    const target = first ? tabOf(first) : null
    if (target) setTab(target)
  }

  const hasErrorIn = (key: keyof typeof TAB_FIELDS) =>
    TAB_FIELDS[key].some((field) => field in errors)

  const selectedPlanId = isEdit ? editForm.watch('plan_id') : createForm.watch('plan_id')
  const customQuota = isEdit ? editForm.watch('company_quota') : createForm.watch('company_quota')
  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId)

  // Hanya tier Custom yang jumlahnya diisi manual. Tier bertingkat memakai
  // angka bawaan paketnya, dan backend mengabaikan kuota yang dikirim untuk
  // tier itu — jadi kolomnya dikunci di sini supaya tidak menyesatkan.
  const isCustomTier = selectedPlan?.is_custom ?? false
  const customUserQuota = isEdit ? editForm.watch('user_quota') : createForm.watch('user_quota')
  const extraUsersInput = isEdit ? editForm.watch('extra_users') : createForm.watch('extra_users')
  const effectiveLimit =
    isCustomTier && customQuota ? Number(customQuota) : (selectedPlan?.max_companies ?? 1)

  // Angka yang sedang diketik bisa belum valid; jangan biarkan NaN merambat ke
  // ringkasan batas.
  const toNumber = (value: string | undefined) => {
    const parsed = Number(value)
    return value && Number.isFinite(parsed) ? parsed : 0
  }

  const baseUserLimit =
    isCustomTier && customUserQuota ? Number(customUserQuota) : (selectedPlan?.max_users ?? 1)
  const addOnUsers = toNumber(extraUsersInput)
  const effectiveUserLimit = baseUserLimit + addOnUsers

  const tabTriggerClass =
    'data-[state=active]:bg-white data-[state=active]:text-[#24323a] text-[13px] text-[#64748b]'

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
          {isEdit ? `Edit Client${client ? ` — ${client.name}` : ''}` : 'Tambah Client'}
        </h1>
        <p className="text-[13px] text-[#64748b] mb-4">
          {isEdit
            ? 'Ubah data akun, kontak, dan kuota langganan client.'
            : 'Buat akun untuk client baru. Client memakai akun ini untuk login lalu menyiapkan perusahaannya sendiri.'}
        </p>

        <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
          <TabsList className="bg-[#e6ebed] flex-wrap h-auto">
            {(
              [
                ['detail', 'Detail Client'],
                ['langganan', 'Langganan'],
                ['addons', 'Add-ons'],
              ] as const
            ).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className={tabTriggerClass}>
                {label}
                {hasErrorIn(key) && <span className="ml-1.5 text-red-500">•</span>}
              </TabsTrigger>
            ))}
            {isEdit && (
              <TabsTrigger value="password" className={tabTriggerClass}>
                Reset Password
              </TabsTrigger>
            )}
          </TabsList>

          <form
            onSubmit={
              isEdit
                ? editForm.handleSubmit(onEdit, focusTabWithError)
                : createForm.handleSubmit(onCreate, focusTabWithError)
            }
          >
            <div className="bg-white border border-[#d9e2e5] rounded-lg p-5 mt-3">
              <TabsContent value="detail" className="mt-0 grid gap-4 sm:grid-cols-2">
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
                      className={cn(
                        inputClass,
                        fieldErrorClass(createForm.formState.errors.password),
                      )}
                    />
                  </Field>
                )}

                <div className="sm:col-span-2 border-t border-[#f1f5f9] pt-4 mt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                    Kontak
                  </p>
                </div>

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

                <Field
                  label="Catatan Internal"
                  error={errors.notes?.message}
                  className="sm:col-span-2"
                >
                  <Textarea
                    {...register('notes')}
                    rows={3}
                    placeholder="Berlangganan sejak Agustus 2026, kontak via WhatsApp."
                    className="text-[13px]"
                  />
                </Field>
              </TabsContent>

              <TabsContent value="langganan" className="mt-0 grid gap-4 sm:grid-cols-2">
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
                  label="Jumlah Perusahaan"
                  hint={
                    isCustomTier
                      ? 'Isi angka berapa pun, misal 5 atau 20.'
                      : 'Hanya bisa diisi pada tier Custom. Tier lain memakai angka bawaan paketnya.'
                  }
                  error={errors.company_quota?.message}
                >
                  <Input
                    {...register('company_quota')}
                    inputMode="numeric"
                    disabled={!isCustomTier}
                    placeholder={
                      isCustomTier ? 'Misal 5' : `${selectedPlan?.max_companies ?? 1} (dari paket)`
                    }
                    className={cn(
                      inputClass,
                      'tabular-nums',
                      !isCustomTier && 'bg-[#f8fafc] text-[#94a3b8]',
                      fieldErrorClass(errors.company_quota),
                    )}
                  />
                </Field>

                <Field
                  label="Jumlah User per Perusahaan"
                  hint={
                    isCustomTier
                      ? 'Berlaku di tiap perusahaan milik client, pemilik ikut dihitung.'
                      : 'Hanya bisa diisi pada tier Custom. Tier lain memakai angka bawaan paketnya.'
                  }
                  error={errors.user_quota?.message}
                  className="sm:col-span-2"
                >
                  <Input
                    {...register('user_quota')}
                    inputMode="numeric"
                    disabled={!isCustomTier}
                    placeholder={
                      isCustomTier ? 'Misal 15' : `${selectedPlan?.max_users ?? 1} (dari paket)`
                    }
                    className={cn(
                      inputClass,
                      'tabular-nums sm:max-w-[calc(50%-0.5rem)]',
                      !isCustomTier && 'bg-[#f8fafc] text-[#94a3b8]',
                      fieldErrorClass(errors.user_quota),
                    )}
                  />
                </Field>

                <p className="sm:col-span-2 text-[12px] text-[#475569] bg-[#EFF9FB] border border-[#d9e2e5] rounded-md px-3 py-2">
                  Batas berlaku:{' '}
                  <span className="font-semibold tabular-nums">{effectiveLimit}</span> perusahaan,
                  masing-masing sampai{' '}
                  <span className="font-semibold tabular-nums">{effectiveUserLimit}</span> user
                  {isCustomTier ? ' (tier Custom, ditentukan manual)' : ' (dari paket)'}
                  {addOnUsers > 0 && `, sudah termasuk add-on ${addOnUsers} user`}.
                  {isEdit && client && client.companies_used > effectiveLimit && (
                    <>
                      {' '}
                      Client ini sudah punya{' '}
                      <span className="font-semibold tabular-nums">{client.companies_used}</span>{' '}
                      perusahaan — yang sudah ada tidak dihapus, hanya penambahan baru yang ditahan.
                    </>
                  )}
                </p>
              </TabsContent>

              <TabsContent value="addons" className="mt-0 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Tambahan User"
                  hint="Berlaku di setiap perusahaan milik client, bukan dibagi rata."
                  error={errors.extra_users?.message}
                >
                  <Input
                    {...register('extra_users')}
                    inputMode="numeric"
                    placeholder="0"
                    className={cn(inputClass, 'tabular-nums', fieldErrorClass(errors.extra_users))}
                  />
                </Field>

                <div className="sm:col-span-2 text-[12px] text-[#475569] bg-[#EFF9FB] border border-[#d9e2e5] rounded-md px-3 py-2">
                  <p>
                    Batas user jadi{' '}
                    <span className="font-semibold tabular-nums">{baseUserLimit}</span>
                    {addOnUsers > 0 && (
                      <>
                        {' + '}
                        <span className="font-semibold tabular-nums">{addOnUsers}</span>
                        {' = '}
                        <span className="font-semibold tabular-nums">{effectiveUserLimit}</span>
                      </>
                    )}{' '}
                    user di <span className="font-semibold">masing-masing</span> perusahaan.
                  </p>
                  {addOnUsers > 0 && effectiveLimit > 1 && (
                    <p className="mt-1">
                      Client ini boleh punya{' '}
                      <span className="font-semibold tabular-nums">{effectiveLimit}</span>{' '}
                      perusahaan, jadi add-on {addOnUsers} user menambah total{' '}
                      <span className="font-semibold tabular-nums">
                        {addOnUsers * effectiveLimit}
                      </span>{' '}
                      slot kalau semua perusahaannya terisi penuh.
                    </p>
                  )}
                </div>

                <p className="sm:col-span-2 text-[12px] text-[#64748b]">
                  Add-on dibeli terpisah dari paket dan tidak ikut terhapus saat paketnya diganti.
                  Menurunkan angkanya tidak mengeluarkan user yang sudah ada — hanya penambahan
                  berikutnya yang ditahan.
                </p>
              </TabsContent>
            </div>

            {/* Tombol simpan di luar TabsContent supaya selalu terlihat di tab
                mana pun yang isinya memang tersimpan bersama form ini. */}
            {tab !== 'password' && (
              <div className="flex justify-end gap-2 mt-4">
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
            )}
          </form>

          {isEdit && client && (
            <TabsContent value="password" className="mt-0">
              <ResetPasswordSection client={client} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
