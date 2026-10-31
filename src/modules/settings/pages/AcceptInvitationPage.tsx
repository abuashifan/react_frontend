import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthCard } from '@/components/shared/auth/AuthCard'
import { FieldError } from '@/components/shared/form/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/useAuthStore'
import { getApiErrorMessage } from '@/lib/apiError'
import { authApi } from '@/modules/auth/services/authApi'
import { invitationSignupSchema, type InvitationSignupValues } from '@/modules/auth/schemas/passwordSchemas'
import { accessInvitationsApi } from '../services/accessApi'

/**
 * Tautan undangan dari email. Halaman ini publik: orang yang belum punya akun
 * membuatnya di sini (email terkunci ke alamat yang diundang), orang yang sudah
 * punya akun cukup masuk lalu menerima.
 */
export function AcceptInvitationPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authToken = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const logout = useAuthStore((state) => state.logout)
  const [signupError, setSignupError] = useState('')

  const preview = useQuery({
    queryKey: ['invitation-preview', token],
    queryFn: () => accessInvitationsApi.preview(token),
    enabled: !!token,
    retry: false,
  })
  const accept = useMutation({
    mutationFn: () => accessInvitationsApi.accept(token),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['companies'] }) },
  })
  const form = useForm<InvitationSignupValues>({
    resolver: zodResolver(invitationSignupSchema),
    defaultValues: { name: '', password: '', password_confirmation: '' },
  })

  const invitation = preview.data?.data

  const signup = form.handleSubmit(async (values) => {
    setSignupError('')
    try {
      const response = await accessInvitationsApi.register(token, values)
      setAuth(response.data.token, response.data.user)
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      navigate('/select-company', { replace: true })
    } catch (error) {
      setSignupError(getApiErrorMessage(error, 'Akun gagal dibuat.'))
    }
  })

  async function switchAccount() {
    try { await authApi.logout() } catch { /* sesi sudah tidak berlaku: tidak apa-apa */ }
    logout()
  }

  if (preview.isLoading) {
    return <AuthCard title="Undangan perusahaan"><p className="text-sm text-[#64748b]">Memeriksa undangan...</p></AuthCard>
  }

  if (preview.isError || !invitation) {
    return (
      <AuthCard title="Undangan tidak berlaku">
        <p role="alert" className="text-sm text-[#64748b]">
          Undangan tidak ditemukan, sudah dipakai, dicabut, atau kedaluwarsa. Minta pengirim mengirim undangan baru.
        </p>
        <Button className="mt-6 w-full" variant="outline" onClick={() => navigate('/login')}>Ke halaman masuk</Button>
      </AuthCard>
    )
  }

  const heading = `Bergabung ke ${invitation.company_name}`

  if (authToken && user) {
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return (
        <AuthCard title={heading}>
          <p className="text-sm text-[#64748b]">
            Undangan ini untuk <strong className="text-[#24323a]">{invitation.email}</strong>, sedangkan Anda masuk sebagai {user.email}.
          </p>
          <Button className="mt-6 w-full" onClick={() => void switchAccount()}>Keluar dan ganti akun</Button>
        </AuthCard>
      )
    }

    return (
      <AuthCard title={heading} description={`Masuk sebagai ${user.email}.`}>
        {accept.isError && <p role="alert" className="mb-4 text-sm text-destructive">{getApiErrorMessage(accept.error, 'Undangan tidak dapat diterima.')}</p>}
        {accept.isSuccess ? (
          <>
            <p className="mb-4 text-sm text-[#24323a]">Undangan diterima. Pilih perusahaan untuk melanjutkan.</p>
            <Button className="w-full" onClick={() => navigate('/select-company', { replace: true })}>Pilih perusahaan</Button>
          </>
        ) : (
          <Button className="w-full" disabled={accept.isPending} onClick={() => accept.mutate()}>
            {accept.isPending ? 'Memproses...' : 'Terima undangan'}
          </Button>
        )}
      </AuthCard>
    )
  }

  if (invitation.has_account) {
    return (
      <AuthCard title={heading} description={`Akun ${invitation.email} sudah terdaftar. Masuk untuk menerima undangan.`}>
        <Button
          className="w-full"
          onClick={() => navigate('/login', { state: { from: { pathname: `/invitations/${token}/accept` } } })}
        >
          Masuk untuk menerima
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={heading} description="Buat akun untuk menerima undangan ini.">
      <form onSubmit={(event) => void signup(event)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="invite-account-email" className="text-[13px] font-medium text-[#24323a]">Email</Label>
          <Input id="invite-account-email" value={invitation.email} readOnly disabled className="h-9 text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-account-name" className="text-[13px] font-medium text-[#24323a]">Nama</Label>
          <Input id="invite-account-name" autoComplete="name" className="h-9 text-[13px]" {...form.register('name')} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-account-password" className="text-[13px] font-medium text-[#24323a]">Kata sandi</Label>
          <Input id="invite-account-password" type="password" autoComplete="new-password" className="h-9 text-[13px]" {...form.register('password')} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-account-confirmation" className="text-[13px] font-medium text-[#24323a]">Ulangi kata sandi</Label>
          <Input id="invite-account-confirmation" type="password" autoComplete="new-password" className="h-9 text-[13px]" {...form.register('password_confirmation')} />
          <FieldError message={form.formState.errors.password_confirmation?.message} />
        </div>
        {signupError && <p role="alert" className="text-sm text-destructive">{signupError}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Membuat akun...' : 'Buat akun dan terima undangan'}
        </Button>
      </form>
    </AuthCard>
  )
}
