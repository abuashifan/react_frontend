import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { usePreferences, usePreferencesMutation } from '../hooks/useSettings'
import { http } from '@/services/http'

const prefSchema = z.object({
  language: z.enum(['id', 'en']),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  number_format: z.enum(['1.000,00', '1,000.00']),
})
type PrefForm = z.infer<typeof prefSchema>

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Password saat ini wajib diisi'),
  new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
  new_password_confirmation: z.string().min(1),
}).refine((d) => d.new_password === d.new_password_confirmation, { message: 'Password baru tidak cocok', path: ['new_password_confirmation'] })
type PasswordForm = z.infer<typeof passwordSchema>

export default function MyPreferencesPage() {
  const { data, isLoading } = usePreferences()
  const mutation = usePreferencesMutation()
  const { toast } = useToast()
  const [changingPassword, setChangingPassword] = useState(false)

  const prefForm = useForm<PrefForm>({
    resolver: zodResolver(prefSchema),
    defaultValues: { language: 'id', date_format: 'DD/MM/YYYY', number_format: '1.000,00' },
  })
  const pwForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (data?.data) prefForm.reset(data.data)
  }, [data, prefForm])

  const onSavePref = prefForm.handleSubmit(async (values) => {
    try { await mutation.mutateAsync(values); toast.success('Preferensi disimpan.') }
    catch { toast.error('Gagal menyimpan preferensi.') }
  })

  const onChangePassword = pwForm.handleSubmit(async (values) => {
    setChangingPassword(true)
    try {
      await http.post('/auth/change-password', { current_password: values.current_password, new_password: values.new_password, new_password_confirmation: values.new_password_confirmation })
      toast.success('Password berhasil diubah.')
      pwForm.reset()
    } catch {
      toast.error('Gagal mengubah password. Pastikan password saat ini benar.')
    } finally {
      setChangingPassword(false)
    }
  })

  if (isLoading) return <WorkspaceLayout title="Preferensi Saya" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Preferensi Saya' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></WorkspaceLayout>

  return (
    <WorkspaceLayout title="Preferensi Saya" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Preferensi Saya' }]}>
      <div className="space-y-4">
        <form onSubmit={(e) => void onSavePref(e)} className="space-y-4">
          <FormSection title="Tampilan">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Bahasa</Label>
              <select {...prefForm.register('language')} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Format Tanggal</Label>
              <select {...prefForm.register('date_format')} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Format Angka</Label>
              <select {...prefForm.register('number_format')} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="1.000,00">1.000,00 (Indonesia)</option>
                <option value="1,000.00">1,000.00 (International)</option>
              </select>
            </div>
          </FormSection>
          <div className="flex justify-end">
            <Button type="submit" disabled={prefForm.formState.isSubmitting || mutation.isPending} className="h-9 bg-[#5c9ead] px-6 text-[13px] hover:bg-[#4a8a9b]">
              {prefForm.formState.isSubmitting || mutation.isPending ? 'Menyimpan...' : 'Simpan Preferensi'}
            </Button>
          </div>
        </form>

        <form onSubmit={(e) => void onChangePassword(e)} className="space-y-4">
          <FormSection title="Ganti Password">
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Password Saat Ini <span className="text-red-500">*</span></Label><Input {...pwForm.register('current_password')} type="password" className="h-9 text-[13px]" />{pwForm.formState.errors.current_password && <p className="text-[11px] text-red-500">{pwForm.formState.errors.current_password.message}</p>}</div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Password Baru <span className="text-red-500">*</span></Label><Input {...pwForm.register('new_password')} type="password" className="h-9 text-[13px]" />{pwForm.formState.errors.new_password && <p className="text-[11px] text-red-500">{pwForm.formState.errors.new_password.message}</p>}</div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Konfirmasi Password Baru <span className="text-red-500">*</span></Label><Input {...pwForm.register('new_password_confirmation')} type="password" className="h-9 text-[13px]" />{pwForm.formState.errors.new_password_confirmation && <p className="text-[11px] text-red-500">{pwForm.formState.errors.new_password_confirmation.message}</p>}</div>
          </FormSection>
          <div className="flex justify-end">
            <Button type="submit" disabled={changingPassword} className="h-9 bg-[#e39774] px-6 text-[13px] hover:bg-[#d4845e]">
              {changingPassword ? 'Mengubah...' : 'Ganti Password'}
            </Button>
          </div>
        </form>
      </div>
    </WorkspaceLayout>
  )
}
