import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { useCompanySettings, useCompanySettingsMutation } from '../hooks/useSettings'

const schema = z.object({
  name: z.string().min(1, 'Nama perusahaan wajib diisi'),
  legal_name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  npwp: z.string().optional(),
  currency: z.string().min(1),
  fiscal_year_start: z.number().min(1).max(12),
})
type FormValues = z.infer<typeof schema>

const MONTH_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function CompanySettingsPage() {
  const { data, isLoading } = useCompanySettings()
  const mutation = useCompanySettingsMutation()
  const { toast } = useToast()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { currency: 'IDR', fiscal_year_start: 1 } })

  useEffect(() => {
    if (data?.data) {
      const d = data.data
      reset({ name: d.name, legal_name: d.legal_name ?? '', address: d.address ?? '', phone: d.phone ?? '', email: d.email ?? '', npwp: d.npwp ?? '', currency: d.currency, fiscal_year_start: d.fiscal_year_start })
    }
  }, [data, reset])

  const onSubmit = handleSubmit(async (values) => {
    try { await mutation.mutateAsync(values); toast.success('Pengaturan perusahaan disimpan.') }
    catch { toast.error('Gagal menyimpan pengaturan.') }
  })

  if (isLoading) return <WorkspaceLayout title="Perusahaan" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Perusahaan' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></WorkspaceLayout>

  return (
    <WorkspaceLayout title="Pengaturan Perusahaan" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Perusahaan' }]}>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <FormSection title="Identitas Perusahaan">
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama Perusahaan <span className="text-red-500">*</span></Label><Input {...register('name')} className="h-9 text-[13px]" />{errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}</div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama Legal</Label><Input {...register('legal_name')} className="h-9 text-[13px]" /></div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">NPWP</Label><Input {...register('npwp')} className="h-9 text-[13px]" placeholder="00.000.000.0-000.000" /></div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Telepon</Label><Input {...register('phone')} className="h-9 text-[13px]" /></div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Email</Label><Input {...register('email')} type="email" className="h-9 text-[13px]" />{errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}</div>
          <div className="flex flex-col gap-1 md:col-span-2"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alamat</Label><Input {...register('address')} className="h-9 text-[13px]" /></div>
        </FormSection>
        <FormSection title="Pengaturan Akuntansi">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Mata Uang</Label>
            <select {...register('currency')} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="IDR">IDR — Rupiah</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Awal Tahun Fiskal</Label>
            <select value={watch('fiscal_year_start')} onChange={(e) => setValue('fiscal_year_start', Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
              {MONTH_OPTIONS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </FormSection>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || mutation.isPending} className="h-9 bg-[#5c9ead] px-6 text-[13px] hover:bg-[#4a8a9b]">
            {isSubmitting || mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </WorkspaceLayout>
  )
}
