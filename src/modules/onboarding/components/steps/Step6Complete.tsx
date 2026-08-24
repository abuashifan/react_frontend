import { useState } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { setupApi } from '../../services/onboardingApi'
import { SETUP_STATUS_KEY } from '../../hooks/useSetupStatus'
import { WIZARD_STATE_KEY } from '../../constants'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import type { SetupStepKey } from '../../types/setup.types'

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

/** Nama langkah yang dikenali user, bukan kunci teknis backend. */
const STEP_LABELS: Record<SetupStepKey, string> = {
  company_profile: 'Informasi Perusahaan',
  module_selection: 'Modul Aktif',
  accounting_settings: 'Pengaturan Akuntansi',
  chart_of_accounts: 'Template COA',
  account_mappings: 'Account Mapping',
  opening_fixed_assets: 'Aset Tetap Awal',
  opening_balance_preview: 'Opening Balance',
  final_review: 'Tinjauan Akhir',
  finalized: 'Selesai',
}

interface StepFailure {
  step: SetupStepKey
  label: string
  messages: string[]
}

/**
 * `finalize` menjawab 422 dengan kode `SETUP_VALIDATION_FAILED` dan rincian per
 * langkah di `errors.validation`. Kode itu tidak ada di peta pesan `apiError`,
 * sehingga toast jatuh ke cabang generik "Periksa kembali isian yang ditandai" —
 * saran yang mustahil diikuti di halaman yang tidak punya satu field pun.
 * Rinciannya dibongkar di sini supaya user tahu langkah mana yang harus dibuka
 * lagi dan apa yang kurang di sana.
 */
function extractStepFailures(error: unknown): StepFailure[] {
  if (typeof error !== 'object' || error === null) return []

  const response = (error as { response?: { data?: unknown } }).response
  const data = (response?.data ?? error) as { errors?: { validation?: unknown } }
  const validation = data?.errors?.validation
  if (typeof validation !== 'object' || validation === null) return []

  const failures: StepFailure[] = []
  for (const [step, result] of Object.entries(validation as Record<string, unknown>)) {
    if (typeof result !== 'object' || result === null) continue
    const typed = result as { valid?: boolean; errors?: { message?: string }[] }
    if (typed.valid !== false) continue

    // `final_review` hanya mengulang kegagalan langkah lain — menampilkannya
    // menambah baris tanpa menambah informasi.
    if (step === 'final_review') continue

    const messages = (typed.errors ?? [])
      .map((item) => (typeof item?.message === 'string' ? item.message : ''))
      .filter((message): message is string => message !== '')

    failures.push({
      step: step as SetupStepKey,
      label: STEP_LABELS[step as SetupStepKey] ?? step,
      messages: messages.length > 0 ? messages : ['Langkah ini belum lengkap.'],
    })
  }

  return failures
}

export function Step6Complete({ summary, onBack }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isFinishing, setIsFinishing] = useState(false)
  const [failures, setFailures] = useState<StepFailure[]>([])

  const handleFinish = async () => {
    setIsFinishing(true)
    setFailures([])
    try {
      // `finalize` melakukan validateAll secara internal; lempar 422 jika setup belum valid.
      await setupApi.finalize()
      // Backend kini berstatus finalized. Segarkan status setup supaya guard
      // tidak memantulkan balik ke /onboarding dan menu setup-only hilang.
      await queryClient.invalidateQueries({ queryKey: SETUP_STATUS_KEY })
      // Wizard selesai — posisi langkah tidak perlu dipulihkan lagi.
      try { sessionStorage.removeItem(WIZARD_STATE_KEY) } catch { /* diabaikan */ }
      toast.success('Setup perusahaan selesai! Selamat datang di Seaside Escape ERP.')
      navigate('/')
    } catch (finishError) {
      const stepFailures = extractStepFailures(finishError)
      setFailures(stepFailures)
      toast.error(
        stepFailures.length > 0
          ? `Setup belum bisa diselesaikan — ${stepFailures.length} langkah masih perlu dilengkapi.`
          : getApiErrorMessage(finishError, 'Setup belum dapat diselesaikan. Pastikan semua langkah wajib sudah valid.'),
      )
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

      {failures.length > 0 && (
        <div className="mx-auto mb-8 max-w-sm rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-left">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#b91c1c]" />
            <p className="text-[13px] font-semibold text-[#b91c1c]">Setup belum bisa diselesaikan</p>
          </div>
          <p className="mt-1 text-[12px] text-[#7f1d1d]">
            Buka kembali langkah berikut lewat daftar langkah di kiri, lalu lengkapi isinya.
          </p>
          <ul className="mt-2 space-y-2">
            {failures.map((failure) => (
              <li key={failure.step}>
                <p className="text-[12px] font-semibold text-[#7f1d1d]">{failure.label}</p>
                <ul className="list-disc pl-4 text-[12px] text-[#7f1d1d]">
                  {failure.messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

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
