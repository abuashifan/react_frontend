import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthCard } from '@/components/shared/auth/AuthCard'
import { FieldError } from '@/components/shared/form/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/apiError'
import { authApi } from '../services/authApi'
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas/passwordSchemas'

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      await authApi.forgotPassword(values.email)
      setSentTo(values.email)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Permintaan gagal dikirim. Coba lagi.'))
    }
  })

  if (sentTo) {
    return (
      <AuthCard title="Periksa email Anda">
        <p className="text-sm text-[#64748b]">
          Jika <strong className="text-[#24323a]">{sentTo}</strong> terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim.
          Tautan berlaku 60 menit. Cek juga folder spam.
        </p>
        <Link to="/login" className="mt-6 block text-center text-[13px] text-[#326273] hover:underline">
          Kembali ke halaman masuk
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Lupa kata sandi" description="Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru.">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email" className="text-[13px] font-medium text-[#24323a]">Email</Label>
          <Input id="forgot-email" type="email" autoComplete="email" placeholder="nama@perusahaan.com" className="h-9 text-[13px]" {...form.register('email')} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={form.formState.isSubmitting} className="h-9 w-full bg-[#e39774] text-[13px] font-medium text-white hover:bg-[#d4845e]">
          {form.formState.isSubmitting ? 'Mengirim...' : 'Kirim tautan'}
        </Button>
        <Link to="/login" className="block text-center text-[13px] text-[#326273] hover:underline">
          Kembali ke halaman masuk
        </Link>
      </form>
    </AuthCard>
  )
}
