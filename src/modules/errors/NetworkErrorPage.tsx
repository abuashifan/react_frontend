import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NetworkErrorPage() {
  return (
    <div className="min-h-screen bg-[#EFEFED] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <WifiOff className="w-12 h-12 text-[#d9e2e5] mx-auto mb-4" />
        <p className="text-sm font-medium text-[#24323a] mb-2">Tidak ada koneksi</p>
        <p className="text-xs text-[#64748b] mb-8">
          Tidak dapat terhubung ke server. Periksa koneksi internet Anda.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    </div>
  )
}
