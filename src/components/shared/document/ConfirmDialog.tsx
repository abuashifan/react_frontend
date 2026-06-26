import { Loader2, TriangleAlert, Info } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  /** Ringkasan dampak tindakan. */
  description?: React.ReactNode
  confirmLabel?: string
  loadingLabel?: string
  variant?: 'primary' | 'destructive'
  isLoading?: boolean
}

/** Confirmation dialog umum untuk lifecycle action non-destruktif/destruktif tanpa reason. */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Lanjutkan',
  loadingLabel = 'Memproses...',
  variant = 'primary',
  isLoading,
}: ConfirmDialogProps) {
  const handleClose = () => {
    if (isLoading) return
    onClose()
  }

  const Icon = variant === 'destructive' ? TriangleAlert : Info
  const iconColor = variant === 'destructive' ? 'text-[#f59e0b]' : 'text-[#5c9ead]'

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-h-[calc(100dvh-48px)] max-w-[400px] overflow-y-auto rounded-xl p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-2.5">
            <Icon className={cn('h-5 w-5', iconColor)} />
            <AlertDialogTitle className="text-[16px] font-semibold text-[#24323a]">{title}</AlertDialogTitle>
          </div>
          {description && (
            <AlertDialogDescription className="pt-1 text-left text-[13px] text-[#64748b]">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

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
            onClick={() => { if (!isLoading) onConfirm() }}
            disabled={isLoading}
            className={cn(
              'h-8 px-4 text-[13px] text-white',
              variant === 'destructive' ? 'bg-[#dc2626] hover:bg-[#b91c1c]' : 'bg-[#5c9ead] hover:bg-[#4a8593]',
            )}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isLoading ? loadingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
