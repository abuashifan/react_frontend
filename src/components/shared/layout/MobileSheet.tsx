import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface MobileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Isi menempel di bawah judul dan menggulir sendiri. */
  children: React.ReactNode
  /** Tombol/aksi tetap di kaki sheet (mis. Terapkan filter). */
  footer?: React.ReactNode
  className?: string
}

/**
 * Lembar dari bawah untuk layar HP (menu modul, daftar tab, filter). Memakai Dialog
 * yang sama dengan seluruh aplikasi sehingga fokus, Esc, dan aksesibilitas konsisten.
 */
export function MobileSheet({ open, onOpenChange, title, description, children, footer, className }: MobileSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-mobile-sheet=""
        className={cn(
          'bottom-0 left-0 right-0 top-auto flex max-h-[88dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-t-2xl border-0 p-0',
          'data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=open]:slide-in-from-bottom-10',
          'data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=closed]:slide-out-to-bottom-10',
          'sm:rounded-t-2xl',
          className,
        )}
      >
        <div className="flex-shrink-0 border-b border-[#d9e2e5] px-4 pb-3 pt-4 pr-12">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#cbd5e1] sm:hidden" aria-hidden="true" />
          <DialogTitle className="text-[15px] font-semibold text-[#24323a]">{title}</DialogTitle>
          <DialogDescription className={description ? 'mt-0.5 text-[12px] text-[#64748b]' : 'sr-only'}>
            {description ?? title}
          </DialogDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <div className="flex-shrink-0 border-t border-[#d9e2e5] bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
