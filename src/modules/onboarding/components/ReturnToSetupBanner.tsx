import { Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useSetupGate } from '../hooks/useSetupStatus'

/**
 * Tautan balik ke wizard untuk halaman yang dibuka dari langkah Saldo Awal
 * (Impor Data, Papan Saldo Awal). Wizard berdiri di luar AppShell dan tidak
 * ada menu yang menuju ke sana, jadi tanpa banner ini user harus mengetik
 * `/onboarding` sendiri. Posisi langkahnya dipulihkan wizard dari
 * sessionStorage. Hanya tampil selama setup awal masih berlaku.
 */
export function ReturnToSetupBanner() {
  const { initial_setup_available: setupInProgress } = useSetupGate()
  const navigate = useNavigate()

  if (!setupInProgress) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#bfdbfe] bg-[#eff6ff] p-3 text-[12px] text-[#1e40af]">
      <p className="flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Setup perusahaan belum selesai. Setelah selesai di sini, kembali ke wizard untuk melanjutkan.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-[12px]"
        onClick={() => navigate('/onboarding')}
      >
        Kembali ke Setup
      </Button>
    </div>
  )
}
