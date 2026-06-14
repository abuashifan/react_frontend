import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MaintenancePage() {
  return (
    <div className="min-h-dvh bg-[#EFEFED] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-amber-500 animate-spin-slow" />
        </div>
        <p className="text-sm font-medium text-[#24323a] mb-2">Sedang dalam pemeliharaan</p>
        <p className="text-xs text-[#64748b] mb-8">
          Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  )
}
