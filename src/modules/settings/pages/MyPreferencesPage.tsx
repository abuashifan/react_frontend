import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { FieldError } from '@/components/shared/form/FieldError'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { http } from '@/services/http'

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Password saat ini wajib diisi'),
  new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
  new_password_confirmation: z.string().min(1),
}).refine((d) => d.new_password === d.new_password_confirmation, { message: 'Password baru tidak cocok', path: ['new_password_confirmation'] })
type PasswordForm = z.infer<typeof passwordSchema>

export default function MyPreferencesPage() {
  const { toast } = useToast()
  const [changing, setChanging] = useState(false)
  const pwForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const onChangePassword = pwForm.handleSubmit(async (values) => {
    setChanging(true)
    try {
      await http.post('/auth/change-password', {
        current_password: values.current_password,
        new_password: values.new_password,
        new_password_confirmation: values.new_password_confirmation,
      })
      toast.success('Password berhasil diubah.')
      pwForm.reset()
    } catch (passwordError) {
      // Tandai field penyebab dari backend supaya user tahu isian mana yang salah,
      // bukan hanya toast generik.
      applyApiValidationErrors(passwordError, pwForm.setError)
      toast.error(getApiErrorMessage(passwordError, 'Gagal mengubah password. Pastikan password saat ini benar.'))
    } finally {
      setChanging(false)
    }
  })

  return (
    <WorkspaceLayout title="Preferensi Saya" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Preferensi Saya' }]}>
      <form onSubmit={(e) => void onChangePassword(e)} className="space-y-4">
        <FormSection title="Ganti Password">
          <div className="flex flex-col gap-1"><Label htmlFor="settings-preferences-current-password" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Password Saat Ini <span className="text-red-500">*</span></Label><Input id="settings-preferences-current-password" {...pwForm.register('current_password')} type="password" className={cn('h-9 text-[13px]', fieldErrorClass(pwForm.formState.errors.current_password))} /><FieldError message={pwForm.formState.errors.current_password?.message} /></div>
          <div className="flex flex-col gap-1"><Label htmlFor="settings-preferences-new-password" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Password Baru <span className="text-red-500">*</span></Label><Input id="settings-preferences-new-password" {...pwForm.register('new_password')} type="password" className={cn('h-9 text-[13px]', fieldErrorClass(pwForm.formState.errors.new_password))} /><FieldError message={pwForm.formState.errors.new_password?.message} /></div>
          <div className="flex flex-col gap-1"><Label htmlFor="settings-preferences-new-password-confirmation" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Konfirmasi Password Baru <span className="text-red-500">*</span></Label><Input id="settings-preferences-new-password-confirmation" {...pwForm.register('new_password_confirmation')} type="password" className={cn('h-9 text-[13px]', fieldErrorClass(pwForm.formState.errors.new_password_confirmation))} /><FieldError message={pwForm.formState.errors.new_password_confirmation?.message} /></div>
        </FormSection>
        <div className="flex justify-end">
          <Button type="submit" disabled={changing} className="h-9 bg-[#e39774] px-6 text-[13px] hover:bg-[#d4845e]">
            {changing ? 'Mengubah...' : 'Ganti Password'}
          </Button>
        </div>
      </form>
    </WorkspaceLayout>
  )
}
