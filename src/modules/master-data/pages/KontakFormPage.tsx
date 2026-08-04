import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRecordTab } from '@/hooks/useRecordTab'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { FormSection } from '@/components/shared/form/FormSection'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { FieldError } from '@/components/shared/form/FieldError'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActiveStatusBadge } from '@/components/shared/badge/ActiveStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { useKontak, useKontakMutations } from '../hooks/useKontakList'
import { paymentTermsApi } from '../services/paymentTermsApi'
import { kontakSchema, type KontakFormValues } from '../schemas/kontakSchema'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

export default function KontakFormPage() {
  const { id } = useParams()
  // `/master-data/contacts/create` dan `/master-data/contacts/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <KontakFormPageContent key={id ?? 'create'} />
}

function KontakFormPageContent() {
  const { replaceRecordTab, closeRecordTab } = useRecordTab()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()

  const { data, isLoading } = useKontak(id ? Number(id) : undefined)
  const kontak = data?.data

  const { create, update, activate, deactivate } = useKontakMutations()

  const {
    register,
    handleSubmit, control, getValues,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KontakFormValues>({
    resolver: zodResolver(kontakSchema),
    defaultValues: { contact_type: 'customer' },
  })

  useEffect(() => {
    if (kontak) {
      const contactType: KontakFormValues['contact_type'] =
        kontak.is_customer && kontak.is_supplier
          ? 'both'
          : kontak.is_supplier || kontak.contact_type === 'supplier'
            ? 'supplier'
            : 'customer'
      reset({
        contact_code: kontak.contact_code ?? '',
        name: kontak.name,
        contact_type: contactType,
        phone: kontak.phone ?? '',
        email: kontak.email ?? '',
        address: kontak.address ?? '',
        tax_number: kontak.tax_number ?? '',
        payment_term_id: kontak.payment_term_id,
      })
    }
  }, [kontak, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<KontakFormValues>({
    draftKey: `master-data.contact.${id ?? 'new'}`,
    control,
    getValues,
    reset,
  })

  const onSubmit = async (values: KontakFormValues) => {
    const { contact_type, ...rest } = values
    const payload = {
      ...rest,
      contact_code: values.contact_code || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      is_customer: contact_type === 'customer' || contact_type === 'both',
      is_supplier: contact_type === 'supplier' || contact_type === 'both',
      ...(contact_type !== 'both' ? { contact_type } : {}),
    }
    try {
      if (isCreate) {
        const res = await create.mutateAsync(payload)
        formDraft.clearDraft()
        toast.success('Kontak berhasil dibuat.')
        replaceRecordTab('/master-data/contacts/create', { label: res.data.name, path: `/master-data/contacts/${res.data.id}` })
      } else {
        await update.mutateAsync({ id: Number(id), payload })
        formDraft.clearDraft()
        toast.success('Kontak berhasil diperbarui.')
      }
    } catch (error) {
      // Penyebab spesifik dari backend (mis. DUPLICATE_CONTACT_CODE) ditandai di
      // field terkait sekaligus ditampilkan di toast.
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan kontak.'))
    }
  }

  const handleToggleActive = async () => {
    if (!kontak) return
    try {
      if (kontak.is_active) {
        if (!confirm(`Nonaktifkan kontak "${kontak.name}"?`)) return
        await deactivate.mutateAsync(kontak.id)
        formDraft.clearDraft()
        toast.success('Kontak berhasil dinonaktifkan.')
      } else {
        await activate.mutateAsync(kontak.id)
        formDraft.clearDraft()
        toast.success('Kontak berhasil diaktifkan.')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengubah status kontak.'))
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Kontak" breadcrumb={[{ label: 'Master Data' }, { label: 'Kontak', path: '/master-data/contacts' }, { label: 'Loading...' }]}>
        <div className="h-32 flex items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout
      title={isCreate ? 'Tambah Kontak' : 'Edit Kontak'}
      documentNumber={isCreate ? undefined : (kontak?.contact_code ?? undefined)}
      breadcrumb={[
        { label: 'Master Data' },
        { label: 'Kontak', path: '/master-data/contacts' },
        { label: isCreate ? 'Tambah Kontak' : (kontak?.name ?? '') },
      ]}
      headerActions={
        <>
          {!isCreate && kontak && <ActiveStatusBadge isActive={kontak.is_active} />}
          <FormSaveActions
            onCancel={() => closeRecordTab(id ? `/master-data/contacts/${id}` : '/master-data/contacts/create', '/master-data/contacts')}
            onSave={handleSubmit(onSubmit)}
            isSaving={isSubmitting}
          >
            {!isCreate && kontak && (
              <PermissionGuard permission={kontak.is_active ? 'contacts.deactivate' : 'contacts.edit'}>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-8 text-[13px]',
                    kontak.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700',
                  )}
                  onClick={handleToggleActive}
                  disabled={activate.isPending || deactivate.isPending}
                >
                  {kontak.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              </PermissionGuard>
            )}
          </FormSaveActions>
        </>
      }
    >
      <div className="space-y-3">
        <FormSection title="Informasi Kontak">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode Kontak</Label>
            <Input {...register('contact_code')} placeholder="CTC-001" className={cn('h-9 text-[13px]', fieldErrorClass(errors.contact_code))} />
            <FieldError message={errors.contact_code?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Nama <span className="text-red-500">*</span>
            </Label>
            <Input {...register('name')} placeholder="PT Maju Jaya" className={cn('h-9 text-[13px]', fieldErrorClass(errors.name))} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Tipe <span className="text-red-500">*</span>
            </Label>
            <Select value={watch('contact_type')} onValueChange={(v) => setValue('contact_type', v as KontakFormValues['contact_type'])}>
              <SelectTrigger className={cn('h-9 text-[13px]', fieldErrorClass(errors.contact_type))}>
                <SelectValue placeholder="Pilih tipe..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="both">Keduanya</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={errors.contact_type?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Telepon</Label>
            <Input {...register('phone')} placeholder="08xx-xxxx-xxxx" className={cn('h-9 text-[13px]', fieldErrorClass(errors.phone))} />
            <FieldError message={errors.phone?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Email</Label>
            <Input {...register('email')} type="email" placeholder="nama@perusahaan.com" className={cn('h-9 text-[13px]', fieldErrorClass(errors.email))} />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">NPWP / Tax Number</Label>
            <Input {...register('tax_number')} placeholder="00.000.000.0-000.000" className={cn('h-9 text-[13px]', fieldErrorClass(errors.tax_number))} />
            <FieldError message={errors.tax_number?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran</Label>
            <SearchableSelect
              value={watch('payment_term_id') ?? null}
              onChange={(v) => setValue('payment_term_id', v)}
              onSearch={paymentTermsApi.search}
              placeholder="Pilih syarat pembayaran..."
              error={errors.payment_term_id?.message}
              selectedOptions={kontak?.payment_term ? [{ value: kontak.payment_term.id, label: kontak.payment_term.name, sublabel: `${kontak.payment_term.days} hari` }] : []}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alamat</Label>
            <Textarea
              {...register('address')}
              placeholder="Alamat lengkap"
              className={cn('text-[13px] resize-none', fieldErrorClass(errors.address))}
              rows={3}
            />
            <FieldError message={errors.address?.message} />
          </div>
        </FormSection>
      </div>
    </FormLayout>
  )
}
