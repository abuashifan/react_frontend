import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { useClientUserMutations } from '../hooks/useClientUsers'
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas/clientSchema'
import type { ClientUser } from '@/types/admin.types'

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientUser | null
}

export function ResetPasswordDialog({ open, onOpenChange, client }: ResetPasswordDialogProps) {
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

  useEffect(() => {
    if (open) reset({ password: '' })
  }, [open, reset])

  const busy = resetPassword.isPending

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!client) return

    try {
      await resetPassword.mutateAsync({ id: client.id, password: values.password })
      toast.success(`Password ${client.name} berhasil direset. Salin dan kirimkan ke client.`)
      onOpenChange(false)
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal mereset password.'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Reset Password</DialogTitle>
          <DialogDescription className="text-[13px] text-[#64748b]">
            Password baru untuk {client?.name ?? 'client'}. Semua sesi client yang sedang berjalan
            akan diputus.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Password Baru <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register('password')}
              type="text"
              autoFocus
              placeholder="Minimal 8 karakter"
              className={cn('h-9 text-[13px]', fieldErrorClass(errors.password))}
            />
            <FieldError message={errors.password?.message} />
            <p className="text-[11px] text-[#64748b]">
              Ditampilkan terbuka supaya bisa disalin sekarang — password ini tidak bisa dilihat
              lagi setelah dialog ditutup.
            </p>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 text-[13px]"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]"
              disabled={busy}
            >
              {busy ? 'Menyimpan...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
