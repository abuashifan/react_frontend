import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onRetry: () => void
  message?: string
}

export function ReportError({ onRetry, message }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 py-8 text-center">
      <AlertCircle className="h-6 w-6 text-red-400" />
      <p className="text-[13px] text-[#334155]">{message ?? 'Gagal memuat laporan. Periksa koneksi atau parameter filter.'}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-1.5 text-[12px]">
        <RefreshCw className="h-3.5 w-3.5" />
        Coba Lagi
      </Button>
    </div>
  )
}
