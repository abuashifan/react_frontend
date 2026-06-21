import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FixedBottomBar } from '@/components/shared/layout/FixedBottomBar'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useKontak, useKontakMutations } from '../hooks/useKontakList'
import { paymentTermsApi } from '../services/paymentTermsApi'
import { kontakSchema, type KontakFormValues } from '../schemas/kontakSchema'
import { MasterDataFormActions, type SaveIntent } from '../components/MasterDataFormActions'

export default function KontakFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()

  const { data, isLoading } = useKontak(id ? Number(id) : undefined)
  const kontak = data?.data

  const { create, update } = useKontakMutations()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<KontakFormValues>({
    resolver: zodResolver(kontakSchema),
    defaultValues: { contact_type: 'customer' },
  })

  const formDraft = usePersistentFormDraft<KontakFormValues>({
    draftKey: `master-data.contact.${id ?? 'new'}`,
    control,
    getValues,
    reset,
  })

  useEffect(() => {
    if (kontak && !formDraft.hasDraft) {
      reset({
        contact_code: kontak.contact_code ?? '',
        name: kontak.name,
        contact_type: kontak.contact_type,
        phone: kontak.phone ?? '',
        email: kontak.email ?? '',
        address: kontak.address ?? '',
        tax_number: kontak.tax_number ?? '',
        payment_term_id: kontak.payment_term_id,
      })
    }
  }, [formDraft.hasDraft, kontak, reset])

  const onSubmit = async (values: KontakFormValues, intent: SaveIntent) => {
    const payload = {
      ...values,
      email: values.email || undefined,
      phone: values.phone || undefined,
    }
    try {
      let savedId = id ? Number(id) : undefined
      if (isCreate) {
        const res = await create.mutateAsync(payload)
        savedId = res.data.id
        toast.success('Kontak berhasil dibuat.')
      } else {
        await update.mutateAsync({ id: Number(id), payload })
        toast.success('Kontak berhasil diperbarui.')
      }
      formDraft.clearDraft()

      if (intent === 'close') navigate('/master-data/contacts')
      if (intent === 'new') {
        reset({ contact_type: 'customer' })
        navigate('/master-data/contacts/create')
      }
      if (intent === 'stay' && isCreate && savedId) navigate(`/master-data/contacts/${savedId}`)
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan kontak.'))
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
      breadcrumb={[
        { label: 'Master Data' },
        { label: 'Kontak', path: '/master-data/contacts' },
        { label: isCreate ? 'Tambah Kontak' : (kontak?.name ?? '') },
      ]}
      bottomBar={
        <FixedBottomBar
          left={<span className="text-[13px] text-[#64748b]">{isCreate ? 'Kontak baru' : kontak?.contact_code}</span>}
        >
          <MasterDataFormActions
            permission={isCreate ? 'master-data.contacts.create' : 'master-data.contacts.edit'}
            isSubmitting={isSubmitting}
            onCancel={() => navigate('/master-data/contacts')}
            onSave={(intent) => void handleSubmit((values) => onSubmit(values, intent))()}
          />
        </FixedBottomBar>
      }
    >
      <div className="space-y-3">
        <FormSection title="Informasi Kontak">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Kode Kontak
            </Label>
            <Input {...register('contact_code')} placeholder="CUST-001" className="h-9 text-[13px]" />
            {errors.contact_code && <p className="text-[11px] text-red-500">{errors.contact_code.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Nama <span className="text-red-500">*</span>
            </Label>
            <Input {...register('name')} placeholder="PT Maju Jaya" className="h-9 text-[13px]" />
            {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Tipe <span className="text-red-500">*</span>
            </Label>
            <Select value={watch('contact_type')} onValueChange={(v) => setValue('contact_type', v as KontakFormValues['contact_type'])}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Pilih tipe..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="both">Keduanya</SelectItem>
                <SelectItem value="employee">Karyawan</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            {errors.contact_type && <p className="text-[11px] text-red-500">{errors.contact_type.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Telepon</Label>
            <Input {...register('phone')} placeholder="08xx-xxxx-xxxx" className="h-9 text-[13px]" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Email</Label>
            <Input {...register('email')} type="email" placeholder="nama@perusahaan.com" className="h-9 text-[13px]" />
            {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">NPWP / Tax Number</Label>
            <Input {...register('tax_number')} placeholder="00.000.000.0-000.000" className="h-9 text-[13px]" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran</Label>
            <SearchableSelect
              value={watch('payment_term_id') ?? null}
              onChange={(v) => setValue('payment_term_id', v)}
              onSearch={paymentTermsApi.search}
              placeholder="Pilih syarat pembayaran..."
              selectedOptions={kontak?.payment_term ? [{ value: kontak.payment_term.id, label: kontak.payment_term.name, sublabel: `${kontak.payment_term.days} hari` }] : []}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alamat</Label>
            <Textarea
              {...register('address')}
              placeholder="Alamat lengkap"
              className="text-[13px] resize-none"
              rows={3}
            />
          </div>
        </FormSection>
      </div>
    </FormLayout>
  )
}
