import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { onboardingApi } from '../../services/onboardingApi'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { useToast } from '@/hooks/useToast'

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
  const { activeCompanyId } = useAuthStore()
  const setSettings = useCompanyStore((s) => s.setSettings)
  const activeCompany = useCompanyStore((s) => s.activeCompany)
  const { toast } = useToast()
  const [isFinishing, setIsFinishing] = useState(false)

  const handleFinish = async () => {
    if (!activeCompanyId) return
    setIsFinishing(true)
    try {
      await onboardingApi.completeOnboarding(activeCompanyId)
      // Update local store so the guard doesn't redirect back to /onboarding
      if (activeCompany) {
        setSettings({ ...activeCompany.settings, onboarding_completed: true })
      }
      toast.success('Setup perusahaan selesai! Selamat datang di Seaside Escape ERP.')
      navigate('/dashboard')
    } catch {
      toast.error('Gagal menyelesaikan setup. Coba lagi.')
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
