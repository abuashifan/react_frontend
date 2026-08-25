import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, cn } from '@/lib/utils'
import { useOBStatus } from '@/modules/opening-balance/hooks/useOpeningBalance'
import { useCompanySettings } from '@/modules/settings/hooks/useCompanySettings'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { setupApi } from '../../services/onboardingApi'

interface Props {
  onComplete: (skipped: boolean) => void
  onBack: () => void
}

/**
 * Saldo awal kini dikelola di modul khusus (/opening-balance) yang memakai konsep
 * batch backend. Step ini hanya menampilkan status & mengarahkan ke modul tersebut.
 */
export function Step5OpeningBalance({ onComplete, onBack }: Props) {
  const { data, isLoading } = useOBStatus()
  const { data: companySettings } = useCompanySettings()
  const openTab = useOpenPrimaryTab()
  const navigate = useNavigate()
  const status = data?.data
  const batch = status?.batch ?? null
  const hasBatch = !!batch && status?.status !== 'not_started'
  const fixedAssetEnabled = companySettings?.data.modules.fixed_asset_enabled ?? false
  const [isContinuing, setIsContinuing] = useState(false)
  const [noOpeningBalance, setNoOpeningBalance] = useState(false)
  const [noOpeningFixedAssets, setNoOpeningFixedAssets] = useState(true)

  // Sinkronisasi default checkbox dari status server, sekali saat data pertama
  // kali dimuat -- pola adjust-state-saat-render (lihat StepModuleSelection),
  // bukan useEffect, supaya tidak ada render kedua yang sempat menampilkan
  // checkbox kosong sebelum status batch diketahui.
  const [defaultsApplied, setDefaultsApplied] = useState(false)
  if (!isLoading && !defaultsApplied) {
    setDefaultsApplied(true)
    setNoOpeningBalance(!hasBatch)
  }

  /**
   * Backend mewajibkan batch saldo awal saat finalize kecuali step ini secara
   * eksplisit ditandai "skip" (lihat SetupWizardService::openingBalanceSkipped()
   * -- pola yang sama dengan opening_fixed_assets_confirmed_none). Tanpa
   * memberi tahu backend, finalize akan selalu gagal dengan pesan generik
   * "Periksa kembali isian yang ditandai" di halaman Selesai, padahal halaman
   * itu tidak punya field apa pun untuk ditandai.
   *
   * `opening_fixed_assets` sama persis: wajib divalidasi saat finalize kalau
   * modul Aktiva Tetap aktif (SetupWizardService::fixedAssetsEnabled()), tapi
   * wizard belum punya alur pengisian aset tetap awal sendiri -- checkbox di
   * bawah cuma mengonfirmasi "tidak ada aset tetap awal" ke backend supaya
   * user tidak wajib mampir ke halaman Aktiva Tetap dulu, dan bisa mengisinya
   * belakangan lewat halaman itu. Kalau perusahaan sudah punya baris
   * `fixed_assets` bersumber `opening_import`, konfirmasi ini tidak
   * berpengaruh -- backend memvalidasi dari jumlah baris dulu.
   */
  const handleContinue = async () => {
    setIsContinuing(true)
    try {
      await setupApi.validateStep('opening_balance_preview', { confirm_opening_balance_skipped: noOpeningBalance })
      if (fixedAssetEnabled) {
        await setupApi.validateStep('opening_fixed_assets', { confirm_no_opening_fixed_assets: noOpeningFixedAssets })
      }
    } catch {
      /* progres non-blocking, sama seperti step lain */
    } finally {
      setIsContinuing(false)
    }
    onComplete(noOpeningBalance)
  }

  /**
   * Navigasi dilakukan di tab yang sama, bukan `window.open`. Dua alasan:
   * main.tsx memaksa logout di tab browser baru saat "Ingat saya" tidak aktif,
   * dan AppShell selalu mengarahkan router ke tab aktif saat mount sehingga
   * `href` telanjang akan dipantulkan ke Dashboard. Tab primer didaftarkan dulu
   * supaya shell membuka Saldo Awal, bukan tab terakhir.
   *
   * Posisi wizard tersimpan di sessionStorage, jadi kembali ke /onboarding
   * melanjutkan dari langkah ini.
   */
  const handleOpenOpeningBalance = () => {
    openTab({
      id: 'accounting-opening-balance',
      menuKey: 'opening-balance',
      label: 'Saldo Awal',
      module: 'accounting',
      path: '/opening-balance',
    })
    navigate('/opening-balance')
  }

  const handleOpenFixedAssets = () => {
    openTab({
      id: 'fixed-assets-list',
      menuKey: 'assets',
      label: 'Daftar Aktiva',
      module: 'fixed-assets',
      path: '/fixed-assets',
    })
    navigate('/fixed-assets')
  }

  return (
    <div className="space-y-6">
      <h3 className="text-[14px] font-semibold text-[#24323a]">Saldo Awal Akun</h3>

      <p className="text-[13px] text-[#64748b]">
        Saldo awal dikelola di halaman khusus menggunakan konsep batch (draft → validasi → posting).
        Kalau perusahaan ini belum punya saldo awal, centang di bawah untuk melanjutkan — datanya
        bisa diisi nanti lewat halaman Saldo Awal kapan saja.
      </p>

      {isLoading ? (
        <div className="flex h-20 items-center justify-center text-[13px] text-[#64748b]">Memuat status...</div>
      ) : hasBatch && batch ? (
        <div className="space-y-2 rounded-lg border border-[#d9e2e5] bg-[#f8fafc] p-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#64748b]">Batch</span><span className="font-medium text-[#24323a]">{batch.batch_number}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]"><span className="text-[#64748b]">Total Debit</span><span className="tabular-nums font-medium">{formatCurrency(batch.total_debit)}</span></div>
          <div className="flex items-center justify-between text-[12px]"><span className="text-[#64748b]">Total Kredit</span><span className="tabular-nums font-medium">{formatCurrency(batch.total_credit)}</span></div>
          <div className="flex items-center justify-between border-t border-[#d9e2e5] pt-1 text-[12px]">
            <span className="font-semibold text-[#334155]">Selisih</span>
            <span className={cn('tabular-nums font-semibold', Math.abs(batch.difference) < 0.01 ? 'text-green-700' : 'text-red-600')}>{formatCurrency(batch.difference)}</span>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-dashed border-[#d9e2e5] p-4 text-[13px] text-[#64748b]">
          <Checkbox
            checked={noOpeningBalance}
            onCheckedChange={(checked) => setNoOpeningBalance(checked === true)}
            className="mt-0.5"
          />
          <span>Perusahaan ini belum punya saldo awal — lanjutkan, akan diisi nanti.</span>
        </label>
      )}

      <button
        type="button"
        onClick={handleOpenOpeningBalance}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5c9ead] transition-colors hover:text-[#326273]"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Buka Halaman Saldo Awal
      </button>

      {fixedAssetEnabled && (
        <div className="space-y-2 border-t border-[#d9e2e5] pt-6">
          <h3 className="text-[14px] font-semibold text-[#24323a]">Aset Tetap Awal</h3>
          <p className="text-[13px] text-[#64748b]">
            Modul Aktiva Tetap aktif untuk perusahaan ini. Kalau perusahaan ini belum punya aset
            tetap awal, centang di bawah untuk melanjutkan — datanya bisa diisi nanti lewat
            halaman Aktiva Tetap kapan saja.
          </p>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-dashed border-[#d9e2e5] p-4 text-[13px] text-[#64748b]">
            <Checkbox
              checked={noOpeningFixedAssets}
              onCheckedChange={(checked) => setNoOpeningFixedAssets(checked === true)}
              className="mt-0.5"
            />
            <span>Perusahaan ini belum punya aset tetap awal — lanjutkan, akan diisi nanti.</span>
          </label>
          <button
            type="button"
            onClick={handleOpenFixedAssets}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5c9ead] transition-colors hover:text-[#326273]"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Buka Halaman Aktiva Tetap
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isContinuing}
          className="bg-[#e39774] px-6 hover:bg-[#d4845e]"
        >
          Lanjutkan →
        </Button>
      </div>
    </div>
  )
}
