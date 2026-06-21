import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/apiError'

interface MasterDataQueryErrorProps {
  error: unknown
  onRetry: () => void
}

export function MasterDataQueryError({ error, onRetry }: MasterDataQueryErrorProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="h-6 w-6 text-red-600" />
      <div>
        <p className="text-[13px] font-semibold text-red-800">Data gagal dimuat</p>
        <p className="mt-1 text-[12px] text-red-700">
          {getApiErrorMessage(error, 'Periksa koneksi lalu coba lagi.')}
        </p>
      </div>
      <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={onRetry}>
        Coba Lagi
      </Button>
    </div>
  )
}
