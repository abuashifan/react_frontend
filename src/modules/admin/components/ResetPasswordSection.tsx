import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { useClientUserMutations } from '../hooks/useClientUsers'
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas/clientSchema'
import type { ClientUser } from '@/types/admin.types'

/**
 * Bagian reset password di halaman form client.
 *
 * Form sendiri, terpisah dari form data client, supaya menyimpan perubahan
 * profil tidak ikut mengganti password — dan sebaliknya.
 */
export function ResetPasswordSection({ client }: { client: ClientUser }) {
  const { toast } = useToast()
  const { resetPassword } = useClientUserMutations()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await resetPassword.mutateAsync({ id: client.id, password: values.password })
      toast.success(`Password ${client.name} berhasil direset. Salin dan kirimkan ke client.`)
      reset({ password: '' })
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal mereset password.'))
    }
  }

  return (
    <section className="bg-white border border-[#d9e2e5] rounded-lg p-5 mt-3">
      <div className="mb-4">
        <h2 className="text-[14px] font-semibold text-[#24323a]">Reset Password</h2>
        <p className="text-[12px] text-[#64748b] mt-0.5">
          Semua sesi client yang sedang berjalan akan diputus. Belum ada alur lupa password, jadi
          ini satu-satunya cara memulihkan akses client.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 sm:items-start">
        <div className="flex flex-col gap-1 flex-1">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Password Baru
          </Label>
          <Input
            {...register('password')}
            type="text"
            placeholder="Minimal 8 karakter"
            className={cn('h-9 text-[13px]', fieldErrorClass(errors.password))}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="h-9 text-[13px] sm:mt-[22px]"
          disabled={resetPassword.isPending}
        >
          {resetPassword.isPending ? 'Menyimpan...' : 'Reset Password'}
        </Button>
      </form>
    </section>
  )
}
