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
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm text-center" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Sesi Akan Berakhir
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-[13px] text-[#64748b] mb-3">
            Anda tidak aktif selama beberapa saat.
            Sesi akan otomatis berakhir dalam:
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
            Logout Sekarang
          </Button>
          <Button
            onClick={onContinue}
            className="flex-1 text-[13px] bg-[#5c9ead] hover:bg-[#4a8a9a] text-white"
          >
            Lanjutkan Sesi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
