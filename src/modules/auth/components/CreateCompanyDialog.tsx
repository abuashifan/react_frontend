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
import { companyApi } from '../services/companyApi'
import { createCompanySchema, type CreateCompanyValues } from '../schemas/companySchema'
import type { Company } from '@/types/auth.types'

interface CreateCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (company: Company) => void | Promise<void>
}

/**
 * Form tambah perusahaan di halaman pilih perusahaan.
 *
 * Hanya meminta nama: kode dan slug dibuat backend, sedangkan NPWP, alamat,
 * mata uang, dan tahun fiskal dikumpulkan wizard onboarding setelah perusahaan
 * dibuka.
 */
export function CreateCompanyDialog({ open, onOpenChange, onCreated }: CreateCompanyDialogProps) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateCompanyValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: { name: '' },
  })

  /**
   * Selama submit dialog tidak boleh ditutup — backend sedang membuat file
   * database tenant dan menjalankan migrasinya. Radix mengarahkan semua jalur
   * penutupan (tombol X, Escape, klik luar) ke sini, jadi satu penjaga cukup.
   */
  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) return
    if (!next) reset({ name: '' })
    onOpenChange(next)
  }

  const onSubmit = async (values: CreateCompanyValues) => {
    try {
      const response = await companyApi.create(values)
      reset({ name: '' })
      onOpenChange(false)
      await onCreated(response.data)
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal membuat perusahaan.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Tambah Perusahaan</DialogTitle>
          <DialogDescription className="text-[13px] text-[#64748b]">
            Cukup isi nama perusahaan. Detail lain — NPWP, alamat, mata uang, dan tahun fiskal —
            diisi lewat wizard setelah perusahaan dibuka.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Nama Perusahaan <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register('name')}
              autoFocus
              placeholder="PT Maju Jaya"
              disabled={isSubmitting}
              className={cn('h-9 text-[13px]', fieldErrorClass(errors.name))}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 text-[13px]"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyiapkan database...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
