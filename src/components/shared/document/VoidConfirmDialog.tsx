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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface VoidConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  documentNumber: string
  isLoading?: boolean
}

const MIN_REASON_LENGTH = 10

/** Destructive confirmation dialog for voiding posted documents. */
export function VoidConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  documentNumber,
  isLoading,
}: VoidConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const isValid = reason.trim().length >= MIN_REASON_LENGTH

  const handleClose = () => {
    if (isLoading) return
    setReason('')
    onClose()
  }

  const handleConfirm = () => {
    if (!isValid || isLoading) return
    onConfirm(reason.trim())
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-h-[calc(100dvh-48px)] max-w-[400px] overflow-y-auto rounded-xl p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-2.5">
            <TriangleAlert className="h-5 w-5 text-[#f59e0b]" />
            <AlertDialogTitle className="text-[16px] font-semibold text-[#24323a]">
              Void Dokumen
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-1 text-left">
            <span className="block text-[14px] text-[#64748b]">
              Anda akan membatalkan {documentNumber}.
            </span>
            <span className="mt-1 block text-[13px] text-[#94a3b8]">
              Tindakan ini tidak dapat dibatalkan.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase text-[#64748b]">
            Alasan void <span className="text-[#ef4444]">*</span>
          </label>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Masukkan alasan void..."
            disabled={isLoading}
            className={cn(
              'min-h-[88px] resize-y border-[#d9e2e5] text-[13px] focus-visible:ring-[#5c9ead]/30',
              reason.length > 0 && !isValid && 'border-[#ef4444] focus-visible:ring-[#ef4444]/20',
            )}
          />
          <p
            className={cn(
              'mt-1 text-[11px] text-[#94a3b8]',
              reason.length > 0 && !isValid && 'text-[#ef4444]',
            )}
          >
            Minimal 10 karakter ({Math.min(reason.trim().length, MIN_REASON_LENGTH)}/10)
          </p>
        </div>

        <AlertDialogFooter className="mt-1 gap-2 sm:space-x-0">
          <AlertDialogCancel
            disabled={isLoading}
            onClick={handleClose}
            className="h-8 border-[#d9e2e5] text-[13px] text-[#64748b] hover:bg-[#f8fbfc]"
          >
            Batal
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="h-8 bg-[#dc2626] px-4 text-[13px] text-white hover:bg-[#b91c1c]"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isLoading ? 'Memvoid...' : 'Void Dokumen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
