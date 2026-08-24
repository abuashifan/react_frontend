import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ExternalLink, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { formatCurrency, cn } from '@/lib/utils'
import { useOBStatus } from '@/modules/opening-balance/hooks/useOpeningBalance'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { setupApi } from '../../services/onboardingApi'

interface Props {
  onComplete: (skipped: boolean) => void
  onBack: () => void
}

/**
 * Saldo awal dikelola di modul khusus (/opening-balance) yang memakai konsep
 * batch backend. Step ini menampilkan statusnya, mengarahkan ke modul tersebut,
 * dan menuntaskan dua step backend sekaligus: `opening_balance_preview` dan
 * `opening_fixed_assets`.
 */
export function Step5OpeningBalance({ onComplete, onBack }: Props) {
  const { data, isLoading } = useOBStatus()
  const { toast } = useToast()
  const openTab = useOpenPrimaryTab()
  const navigate = useNavigate()
  const status = data?.data
  const batch = status?.batch ?? null
  const hasBatch = !!batch && status?.status !== 'not_started'
  const [isContinuing, setIsContinuing] = useState(false)
  const [blockingErrors, setBlockingErrors] = useState<string[]>([])

  /**
   * Jumlah aset tetap awal diambil dari preview setup, bukan ditebak: nilainya
   * menentukan apakah step `opening_fixed_assets` boleh dinyatakan "tidak ada"
   * saat melanjutkan. Kegagalan query tidak menahan wizard — `count` dianggap 0,
   * yang memang keadaan normal perusahaan baru.
   */
  const { data: setupPreview } = useQuery({
    queryKey: ['setup', 'opening-balance-preview'],
    queryFn: setupApi.getOpeningBalancePreview,
    staleTime: 0,
    retry: false,
  })
  const openingFixedAssetCount = setupPreview?.data?.fixed_asset_totals?.count ?? 0

  /**
   * Backend mewajibkan batch saldo awal saat finalize kecuali step ini secara
   * eksplisit ditandai "skip" (lihat SetupWizardService::openingBalanceSkipped()).
   * Kegagalannya TIDAK boleh ditelan diam-diam seperti progres step lain: tanpa
   * flag ini finalize selalu gagal 422 di halaman Selesai dengan pesan generik
   * "Periksa kembali isian yang ditandai", padahal halaman itu tidak punya
   * field apa pun untuk ditandai. Jadi kalau backend menolak, alasannya
   * ditampilkan di sini — di layar yang benar-benar bisa memperbaikinya.
   */
  const handleContinue = async (skip: boolean) => {
    const effectiveSkip = skip || !hasBatch
    setIsContinuing(true)
    setBlockingErrors([])

    try {
      const response = await setupApi.validateStep('opening_balance_preview', {
        confirm_opening_balance_skipped: effectiveSkip,
      })

      /*
       * Modul Aktiva Tetap menyala default, sehingga `opening_fixed_assets`
       * ikut jadi step wajib. Wizard tidak punya layar impor aset tetap awal,
       * jadi melanjutkan dari sini berarti menyatakan belum ada yang diimpor —
       * dan itu hanya dinyatakan kalau memang benar belum ada.
       */
      try {
        await setupApi.validateStep('opening_fixed_assets', {
          confirm_no_opening_fixed_assets: openingFixedAssetCount === 0,
        })
      } catch { /* progres non-blocking; finalize memvalidasi ulang */ }

      const result = response.data?.result
      if (result && !result.valid) {
        setBlockingErrors(result.errors.map((error) => error.message))
        return
      }

      /*
       * Ringkasan di halaman Selesai memakai keputusan backend, bukan tebakan
       * lokal. Dua kasus meleset kalau `effectiveSkip` dipakai apa adanya:
       * batch draft kosong yang dibuang backend saat lewati (lokal mengira ada
       * batch), dan batch berisi yang tetap akan diposting saat finalize
       * walau user menekan "Lewati" (lokal mengira tidak jadi disimpan).
       */
      onComplete(result?.metadata?.skipped === true)
    } catch (stepError) {
      toast.error(getApiErrorMessage(stepError, 'Gagal menyimpan langkah saldo awal.'))
    } finally {
      setIsContinuing(false)
    }
  }

  /**
   * Navigasi dilakukan di tab yang sama, bukan `window.open`. Dua alasan:
   * main.tsx memaksa logout di tab browser baru saat "Ingat saya" tidak aktif,
   * dan AppShell selalu mengarahkan router ke tab aktif saat mount sehingga
   * `href` telanjang akan dipantulkan ke Dashboard. Tab primer didaftarkan dulu
   * supaya shell membuka halaman yang dimaksud, bukan tab terakhir.
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

  const handleOpenImport = () => {
    openTab({
      id: 'master-data-import',
      menuKey: 'import',
      label: 'Impor Data',
      module: 'master-data',
      path: '/master-data/import',
    })
    navigate('/master-data/import')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#24323a]">Saldo Awal Akun</h3>
        <button
          type="button"
          onClick={() => void handleContinue(true)}
          disabled={isContinuing}
          className="text-[13px] text-[#5c9ead] transition-colors hover:text-[#326273] disabled:opacity-60"
        >
          Lewati, isi nanti →
        </button>
      </div>

      <p className="text-[13px] text-[#64748b]">
        Saldo awal dikelola di halaman khusus menggunakan konsep batch (draft → validasi → posting).
        Isi manual di halaman Saldo Awal, atau unggah sekaligus lewat Impor Data dengan profil
        “Saldo Awal”. Perusahaan baru yang belum punya saldo historis bisa melewati langkah ini.
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
        <div className="rounded-lg border border-dashed border-[#d9e2e5] p-4 text-center text-[13px] text-[#94a3b8]">
          Belum ada saldo awal yang diinput.
        </div>
      )}

      {/*
        Aset tetap awal punya step backend sendiri (`opening_fixed_assets`) yang
        wajib dijawab karena modul Aktiva Tetap menyala default. Ditampilkan di
        sini supaya user tahu apa yang ia setujui saat menekan Lanjutkan.
      */}
      <div className="rounded-lg border border-[#d9e2e5] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#24323a]">Aset Tetap Awal</span>
          <span className="text-[12px] tabular-nums text-[#64748b]">
            {openingFixedAssetCount > 0 ? `${openingFixedAssetCount} aset diimpor` : 'Belum ada'}
          </span>
        </div>
        {openingFixedAssetCount === 0 && (
          <p className="mt-1 text-[12px] text-[#94a3b8]">
            Melanjutkan berarti perusahaan ini belum punya aset tetap awal. Aset tetap baru tetap
            bisa dicatat kapan saja lewat modul Aktiva Tetap.
          </p>
        )}
      </div>

      {blockingErrors.length > 0 && (
        <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#b91c1c]" />
            <p className="text-[13px] font-semibold text-[#b91c1c]">Saldo awal belum bisa dilanjutkan</p>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-8 text-[12px] text-[#7f1d1d]">
            {blockingErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <p className="mt-2 pl-8 text-[12px] text-[#7f1d1d]">
            Lengkapi batch di halaman Saldo Awal, atau kosongkan batch tersebut lalu pilih
            “Lewati, isi nanti”.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleOpenOpeningBalance}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5c9ead] transition-colors hover:text-[#326273]"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Buka Halaman Saldo Awal
        </button>
        <button
          type="button"
          onClick={handleOpenImport}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5c9ead] transition-colors hover:text-[#326273]"
        >
          <Upload className="h-3.5 w-3.5" /> Impor Saldo Awal dari Berkas
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
        <Button
          type="button"
          onClick={() => void handleContinue(false)}
          disabled={isContinuing}
          className="bg-[#e39774] px-6 hover:bg-[#d4845e]"
        >
          {isContinuing ? 'Menyimpan...' : 'Lanjutkan →'}
        </Button>
      </div>
    </div>
  )
}
