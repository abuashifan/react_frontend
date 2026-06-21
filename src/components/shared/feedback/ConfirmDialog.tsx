import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  isLoading?: boolean
  onConfirm: (reason?: string) => void
}

/**
 * Confirmation dialog aksesibel & konsisten (design token) untuk aksi accounting
 * yang berdampak (post/lock/reopen). Mengganti `window.confirm` (A13-093) dan
 * dialog Void yang copy-nya tidak sesuai (A13-091).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'default',
  requireReason = false,
  reasonLabel = 'Alasan',
  reasonPlaceholder = 'Tuliskan alasan...',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason('')
    onOpenChange(next)
  }

  const reasonInvalid = requireReason && reason.trim() === ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{title}</DialogTitle>
          {description && <DialogDescription className="text-[13px]">{description}</DialogDescription>}
        </DialogHeader>

        {requireReason && (
          <div className="flex flex-col gap-1 pt-1">
            <Label htmlFor="confirm-reason" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              {reasonLabel} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="resize-none text-[13px]"
            />
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={cn('h-9 text-[13px]', variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#5c9ead] hover:bg-[#4a8a9b]')}
            disabled={isLoading || reasonInvalid}
            onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
