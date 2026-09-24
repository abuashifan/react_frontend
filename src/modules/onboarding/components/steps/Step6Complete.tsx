import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { setupApi } from '../../services/onboardingApi'
import { SETUP_STATUS_KEY } from '../../hooks/useSetupStatus'
import { WIZARD_STATE_KEY } from '../../constants'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'

interface WizardSummary {
  templateLabel: string | null
  accountCount: number
  warehouseCount: number
  unitCount: number
  paymentTermCount: number
  openingBalanceSkipped: boolean
}

interface Props {
  summary: WizardSummary
  onBack: () => void
}

export function Step6Complete({ summary, onBack }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isFinishing, setIsFinishing] = useState(false)

  const handleFinish = async () => {
    setIsFinishing(true)
    try {
      // `finalize` melakukan validateAll secara internal; lempar 422 jika setup belum valid.
      await setupApi.finalize()
      // Backend kini berstatus finalized. Segarkan status setup supaya guard
      // tidak memantulkan balik ke /onboarding dan menu setup-only hilang.
      //
      // `refetchType: 'all'` wajib -- halaman wizard ini tidak dibungkus
      // AppShell, jadi query `setup/status` tidak sedang aktif diobservasi
      // saat ini (default `invalidateQueries` hanya me-refetch query aktif).
      // Tanpa ini, cache cuma ditandai stale tanpa benar-benar di-fetch ulang;
      // begitu `navigate('/')` mount ProtectedRoute, `useSetupGate` sempat
      // membaca data lama (initial_setup_available masih true) sebelum
      // refetch selesai, dan guard langsung memantulkan balik ke /onboarding
      // -- persis seperti wizard baru dimulai lagi.
      await queryClient.invalidateQueries({ queryKey: SETUP_STATUS_KEY, refetchType: 'all' })
      // Wizard selesai — posisi langkah tidak perlu dipulihkan lagi.
      try { sessionStorage.removeItem(WIZARD_STATE_KEY) } catch { /* diabaikan */ }
      toast.success('Setup perusahaan selesai! Selamat datang di Seaside Escape ERP.')
      navigate('/')
    } catch (finishError) {
      toast.error(getApiErrorMessage(finishError, 'Setup belum dapat diselesaikan. Pastikan semua langkah wajib sudah valid.'))
      setIsFinishing(false)
    }
  }

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-[#065F46]" />
      </div>
      <h2 className="text-xl font-semibold text-[#24323a] mb-2">Setup Selesai!</h2>
      <p className="text-[#64748b] text-sm mb-8">
        Perusahaan Anda sudah siap. Mulai gunakan Seaside Escape ERP.
      </p>

      {/* Summary */}
      <div className="bg-[#f8fbfc] border border-[#d9e2e5] rounded-lg p-4 text-left mb-8 max-w-sm mx-auto">
        <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide mb-3">Ringkasan Setup</p>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#64748b]">Template COA</span>
            <span className="font-medium">
              {summary.templateLabel
                ? `${summary.templateLabel} (${summary.accountCount} akun)`
                : 'Kosong (custom)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Account Mapping</span>
            <span className="font-medium text-[#065F46]">✓ Selesai</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Gudang</span>
            <span className="font-medium">{summary.warehouseCount} gudang</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Satuan</span>
            <span className="font-medium">{summary.unitCount} satuan</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Syarat Bayar</span>
            <span className="font-medium">{summary.paymentTermCount} syarat</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Opening Balance</span>
            <span className={`font-medium ${summary.openingBalanceSkipped ? 'text-[#64748b]' : 'text-[#065F46]'}`}>
              {summary.openingBalanceSkipped ? 'Belum diisi' : '✓ Tersimpan'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isFinishing}>
          ← Kembali
        </Button>
        <Button
          onClick={handleFinish}
          disabled={isFinishing}
          className="bg-[#e39774] hover:bg-[#d4845e] px-8"
        >
          {isFinishing ? 'Memproses...' : 'Mulai Gunakan Seaside Escape →'}
        </Button>
      </div>
    </div>
  )
}
