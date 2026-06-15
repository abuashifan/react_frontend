import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FixedBottomBar } from '@/components/shared/layout/FixedBottomBar'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { useKontak, useKontakMutations } from '../hooks/useKontakList'
import { paymentTermsApi } from '../services/paymentTermsApi'
import { kontakSchema, type KontakFormValues } from '../schemas/kontakSchema'

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
    formState: { errors, isSubmitting },
  } = useForm<KontakFormValues>({
    resolver: zodResolver(kontakSchema),
    defaultValues: { type: 'customer' },
  })

  useEffect(() => {
    if (kontak) {
      reset({
        name: kontak.name,
        type: kontak.type,
        phone: kontak.phone ?? '',
        email: kontak.email ?? '',
        address: kontak.address ?? '',
        npwp: kontak.npwp ?? '',
        payment_term_id: kontak.payment_term_id,
      })
    }
  }, [kontak, reset])

  const onSubmit = async (values: KontakFormValues) => {
    const payload = {
      ...values,
      email: values.email || undefined,
      phone: values.phone || undefined,
    }
    try {
      if (isCreate) {
        const res = await create.mutateAsync(payload)
        toast.success('Kontak berhasil dibuat.')
        navigate(`/master-data/contacts/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload })
        toast.success('Kontak berhasil diperbarui.')
      }
    } catch {
      toast.error('Gagal menyimpan kontak.')
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
          left={<span className="text-[13px] text-[#64748b]">{isCreate ? 'Kontak baru' : kontak?.code}</span>}
        >
          <Button variant="outline" className="h-8 text-[13px]" onClick={() => navigate('/master-data/contacts')}>
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
            <Select value={watch('type')} onValueChange={(v) => setValue('type', v as KontakFormValues['type'])}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Pilih tipe..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="both">Keduanya</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-[11px] text-red-500">{errors.type.message}</p>}
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
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">NPWP</Label>
            <Input {...register('npwp')} placeholder="00.000.000.0-000.000" className="h-9 text-[13px]" />
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
