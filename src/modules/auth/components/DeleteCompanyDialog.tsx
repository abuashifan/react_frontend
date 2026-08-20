import { useState } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { companyApi } from '../services/companyApi'
import type { Company } from '@/types/auth.types'

interface DeleteCompanyDialogProps {
  company: Company | null
  onClose: () => void
  onDeleted: (companyId: number) => void
}

/**
 * Konfirmasi hapus perusahaan — user harus mengetik ulang nama perusahaan
 * persis sama, sama seperti pola hapus repository di GitHub. Tindakan ini
 * mencabut akses seluruh staf yang diundang ke tenant ini, jadi tidak cukup
 * hanya klik "Ya".
 */
export function DeleteCompanyDialog({ company, onClose, onDeleted }: DeleteCompanyDialogProps) {
  const { toast } = useToast()
  const [confirmName, setConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isValid = company !== null && confirmName.trim() === company.name

  const handleClose = () => {
    if (isDeleting) return
    setConfirmName('')
    onClose()
  }

  const handleConfirm = async () => {
    if (!company || !isValid || isDeleting) return

    setIsDeleting(true)
    try {
      await companyApi.remove(company.id, confirmName.trim())
      setConfirmName('')
      onDeleted(company.id)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menghapus perusahaan.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={company !== null}>
      <AlertDialogContent className="max-h-[calc(100dvh-48px)] max-w-[400px] overflow-y-auto rounded-xl p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-2.5">
            <TriangleAlert className="h-5 w-5 text-[#dc2626]" />
            <AlertDialogTitle className="text-[16px] font-semibold text-[#24323a]">
              Hapus Perusahaan
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-1 text-left">
            <span className="block text-[14px] text-[#64748b]">
              Anda akan menghapus <span className="font-medium text-[#24323a]">{company?.name}</span>{' '}
              beserta seluruh database tenant-nya. Semua staf yang diundang akan kehilangan akses.
            </span>
            <span className="mt-1 block text-[13px] text-[#94a3b8]">
              Anda tidak dapat memulihkannya sendiri. Selama 30 hari, pemulihan masih bisa diminta
              ke admin aplikasi; setelah itu data terhapus permanen.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>
          <label htmlFor="delete-confirm-name" className="mb-1.5 block text-[11px] font-semibold uppercase text-[#64748b]">
            Ketik <span className="font-semibold text-[#24323a]">{company?.name}</span> untuk konfirmasi
          </label>
          <Input
            id="delete-confirm-name"
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            placeholder={company?.name}
            disabled={isDeleting}
            autoFocus
            className={cn(
              'h-9 border-[#d9e2e5] text-[13px] focus-visible:ring-[#5c9ead]/30',
              confirmName.length > 0 && !isValid && 'border-[#ef4444] focus-visible:ring-[#ef4444]/20',
            )}
          />
        </div>

        <AlertDialogFooter className="mt-1 gap-2 sm:space-x-0">
          <AlertDialogCancel
            disabled={isDeleting}
            onClick={handleClose}
            className="h-8 border-[#d9e2e5] text-[13px] text-[#64748b] hover:bg-[#f8fbfc]"
          >
            Batal
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || isDeleting}
            className="h-8 bg-[#dc2626] px-4 text-[13px] text-white hover:bg-[#b91c1c]"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isDeleting ? 'Menghapus...' : 'Hapus Perusahaan'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
