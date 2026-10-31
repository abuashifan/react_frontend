import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthCard } from '@/components/shared/auth/AuthCard'
import { FieldError } from '@/components/shared/form/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { authApi } from '../services/authApi'
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas/passwordSchemas'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [error, setError] = useState('')
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      await authApi.resetPassword({ token, email, ...values })
      toast.success('Kata sandi diperbarui. Silakan masuk.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Kata sandi gagal diperbarui. Minta tautan baru.'))
    }
  })

  if (!token || !email) {
    return (
      <AuthCard title="Tautan tidak valid">
        <p className="text-sm text-[#64748b]">Tautan atur ulang kata sandi tidak lengkap. Minta tautan baru.</p>
        <Link to="/forgot-password" className="mt-6 block text-center text-[13px] text-[#326273] hover:underline">
          Minta tautan baru
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Buat kata sandi baru" description={`Untuk akun ${email}.`}>
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-[13px] font-medium text-[#24323a]">Kata sandi baru</Label>
          <Input id="new-password" type="password" autoComplete="new-password" className="h-9 text-[13px]" {...form.register('password')} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password-confirmation" className="text-[13px] font-medium text-[#24323a]">Ulangi kata sandi</Label>
          <Input id="new-password-confirmation" type="password" autoComplete="new-password" className="h-9 text-[13px]" {...form.register('password_confirmation')} />
          <FieldError message={form.formState.errors.password_confirmation?.message} />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error} <Link to="/forgot-password" className="underline">Minta tautan baru</Link>
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting} className="h-9 w-full bg-[#e39774] text-[13px] font-medium text-white hover:bg-[#d4845e]">
          {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan kata sandi'}
        </Button>
      </form>
    </AuthCard>
  )
}
