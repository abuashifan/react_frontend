import { useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SessionWarningDialogProps {
  open: boolean
  secondsRemaining: number
  onContinue: () => void
  onLogout: () => void
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SessionWarningDialog({
  open,
  secondsRemaining,
  onContinue,
  onLogout,
}: SessionWarningDialogProps) {
  const continueButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm text-center [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          continueButtonRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Sesi hampir berakhir
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-[13px] text-[#64748b] mb-3">
            Karena tidak ada aktivitas, Anda akan keluar otomatis demi keamanan.
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
            Waktu tersisa
          </p>
          <div className="text-3xl font-bold tabular-nums text-[#24323a]">
            {formatCountdown(secondsRemaining)}
          </div>
          <p className="text-xs text-amber-600 mt-3 font-medium">
            ⚠️ Data yang belum disimpan akan hilang.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex-1 text-[13px]"
          >
            Keluar
          </Button>
          <Button
            ref={continueButtonRef}
            onClick={onContinue}
            className="flex-1 text-[13px] bg-[#5c9ead] hover:bg-[#4a8a9a] text-white"
          >
            Tetap Masuk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
