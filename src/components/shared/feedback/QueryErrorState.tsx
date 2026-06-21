import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/apiError'

interface QueryErrorStateProps {
  error: unknown
  onRetry: () => void
  title?: string
  fallbackMessage?: string
}

/**
 * Generic error/retry surface untuk query gagal.
 * Membedakan error dari empty-state agar kegagalan API tidak disamarkan
 * sebagai "belum ada data" (guardrails §8.3).
 */
export function QueryErrorState({ error, onRetry, title = 'Data gagal dimuat', fallbackMessage = 'Periksa koneksi lalu coba lagi.' }: QueryErrorStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="h-6 w-6 text-red-600" />
      <div>
        <p className="text-[13px] font-semibold text-red-800">{title}</p>
        <p className="mt-1 text-[12px] text-red-700">{getApiErrorMessage(error, fallbackMessage)}</p>
      </div>
      <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={onRetry}>
        Coba Lagi
      </Button>
    </div>
  )
}
