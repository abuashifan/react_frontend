import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { useAdminAuthStore } from '@/stores/useAdminAuthStore'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'
import { adminApi } from '../services/adminApi'

const adminLoginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type AdminLoginValues = z.infer<typeof adminLoginSchema>

/**
 * Pintu masuk admin aplikasi, terpisah dari login client.
 *
 * Backend menolak akun client di sini dan menolak akun admin di halaman login
 * client, jadi pemisahannya bukan hanya di tampilan.
 */
export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const setAuth = useAdminAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: AdminLoginValues) => {
    try {
      const response = await adminApi.login(values.email, values.password)
      setAuth(response.data.token, response.data.user)
      navigate('/admin/clients', { replace: true })
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal masuk. Coba lagi.'))
    }
  }

  return (
    <div className="min-h-dvh bg-[#EFEFED] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="w-11 h-11 rounded-lg bg-[#326273] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-[#24323a]">Admin {APP_NAME}</h1>
          <p className="text-[13px] text-[#64748b] mt-1">Pengelolaan akun client</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-[#d9e2e5] rounded-lg p-6 space-y-4"
        >
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Email
            </Label>
            <Input
              {...register('email')}
              type="email"
              autoComplete="username"
              autoFocus
              className={cn('h-9 text-[13px]', fieldErrorClass(errors.email))}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Password
            </Label>
            <Input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className={cn('h-9 text-[13px]', fieldErrorClass(errors.password))}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#326273] hover:bg-[#284f5c] h-9 text-[13px]"
          >
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <p className="text-center text-[12px] text-[#64748b] mt-4">
          Bukan admin?{' '}
          <Link to="/login" className="text-[#5c9ead] hover:underline">
            Masuk sebagai client
          </Link>
        </p>
      </div>
    </div>
  )
}
