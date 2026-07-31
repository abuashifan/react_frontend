import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRecordTab } from '@/hooks/useRecordTab'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FixedBottomBar } from '@/components/shared/layout/FixedBottomBar'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { useKontak, useKontakMutations } from '../hooks/useKontakList'
import { paymentTermsApi } from '../services/paymentTermsApi'
import { kontakSchema, type KontakFormValues } from '../schemas/kontakSchema'
import { cn } from '@/lib/utils'

export default function KontakFormPage() {
  const { replaceRecordTab, closeRecordTab } = useRecordTab()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()

  const { data, isLoading } = useKontak(id ? Number(id) : undefined)
  const kontak = data?.data

  const { create, update, activate, deactivate } = useKontakMutations()

  const {
    register,
    handleSubmit,
    setValue,
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
        toast.success('Kontak berhasil dibuat.')
        replaceRecordTab('/master-data/contacts/create', { label: res.data.name, path: `/master-data/contacts/${res.data.id}` })
      } else {
        await update.mutateAsync({ id: Number(id), payload })
        toast.success('Kontak berhasil diperbarui.')
      }
    } catch {
      toast.error('Gagal menyimpan kontak.')
    }
  }

  const handleToggleActive = async () => {
    if (!kontak) return
    try {
      if (kontak.is_active) {
        if (!confirm(`Nonaktifkan kontak "${kontak.name}"?`)) return
        await deactivate.mutateAsync(kontak.id)
        toast.success('Kontak berhasil dinonaktifkan.')
      } else {
        await activate.mutateAsync(kontak.id)
        toast.success('Kontak berhasil diaktifkan.')
      }
    } catch {
      toast.error('Gagal mengubah status kontak.')
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
          left={
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#64748b]">{isCreate ? 'Kontak baru' : kontak?.contact_code}</span>
              {!isCreate && kontak && (
                <Badge
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full',
                    kontak.is_active
                      ? 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]'
                      : 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
                  )}
                >
                  {kontak.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              )}
            </div>
          }
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
          <Button variant="outline" className="h-8 text-[13px]" onClick={() => closeRecordTab(id ? `/master-data/contacts/${id}` : '/master-data/contacts/create', '/master-data/contacts')}>
            Batal
          </Button>
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </FixedBottomBar>
      }
    >
      <div className="space-y-3">
        <FormSection title="Informasi Kontak">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode Kontak</Label>
            <Input {...register('contact_code')} placeholder="CTC-001" className="h-9 text-[13px]" />
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
