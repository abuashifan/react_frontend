import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ExternalLink, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, cn } from '@/lib/utils'
import { useOBStatus } from '@/modules/opening-balance/hooks/useOpeningBalance'
import { useCompanySettings } from '@/modules/settings/hooks/useCompanySettings'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { useImportPresetStore } from '@/modules/imports/stores/useImportPresetStore'
import { useSetupStatus, SETUP_STATUS_KEY } from '../../hooks/useSetupStatus'
import { setupApi } from '../../services/onboardingApi'

interface Props {
  onComplete: (skipped: boolean) => void
  onBack: () => void
}

/**
 * Saldo awal kini dikelola di modul khusus (/opening-balance) yang memakai konsep
 * batch backend. Step ini hanya menampilkan status & mengarahkan ke modul tersebut.
 *
 * ── Kenapa Aset Tetap Awal berada DI ATAS Saldo Awal ────────────────────────
 *
 * Bukan preferensi tata letak — ini urutan yang dipaksakan backend. Baris harga
 * perolehan dan akumulasi penyusutan di batch saldo awal tidak pernah diketik:
 * `OpeningBalanceBatchService::fixedAssetSystemLines()` membuatnya otomatis dari
 * register aset ber-`source_type = 'opening_import'`, dipecah per akun kelas
 * aset. Mengisi saldo awal lebih dulu berarti mengunci neraca pembuka pada angka
 * yang belum memuat aset sama sekali, dan impor aset sesudahnya ditolak begitu
 * saldo awal diposting. Urutan langkah canonical backend
 * (`SetupWizardService::$steps`) sudah menaruh `opening_fixed_assets` sebelum
 * `opening_balance_preview`; sebelumnya hanya urutan di layar ini yang terbalik.
 */
export function Step5OpeningBalance({ onComplete, onBack }: Props) {
  const { data, isLoading } = useOBStatus()
  const { data: companySettings } = useCompanySettings()
  const { data: setupStatus } = useSetupStatus()
  const queryClient = useQueryClient()
  const openTab = useOpenPrimaryTab()
  const navigate = useNavigate()
  const status = data?.data
  const batch = status?.batch ?? null
  const hasBatch = !!batch && status?.status !== 'not_started'
  const fixedAssetEnabled = companySettings?.data.modules.fixed_asset_enabled ?? false
  const [isContinuing, setIsContinuing] = useState(false)
  const [noOpeningBalance, setNoOpeningBalance] = useState(false)

  const assetGate = setupStatus?.data.opening_fixed_assets ?? null

  /**
   * Override optimistis selama konfirmasi "belum punya aset tetap" dikirim.
   * Dibersihkan di `onSettled` SETELAH invalidasi selesai, jadi kalau
   * permintaannya gagal, checkbox kembali ke kebenaran server — bukan bertahan
   * di posisi yang backend tidak pernah setujui.
   */
  const [pendingConfirm, setPendingConfirm] = useState<boolean | null>(null)
  const confirmedNoAssets = pendingConfirm ?? assetGate?.confirmed_none ?? false

  const confirmNoAssets = useMutation({
    mutationFn: (checked: boolean) =>
      setupApi.validateStep('opening_fixed_assets', { confirm_no_opening_fixed_assets: checked }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SETUP_STATUS_KEY })
    },
    onSettled: () => setPendingConfirm(null),
  })

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
   * Gerbang urutan. `settled` dihitung backend (modul aktif + jumlah aset
   * `opening_import` + konfirmasi "tidak punya"), sama persis dengan yang
   * dipakai `OpeningBalanceImportCommitter` untuk menolak berkas saldo awal.
   *
   * Kalau gate-nya tidak terbaca sama sekali — user tanpa `setup.view`, atau
   * permintaan status gagal — layar ini TIDAK mengunci apa pun. Menebak-nebak
   * penguncian dari data yang tidak ada hanya memindahkan kebingungan; backend
   * tetap menolak impornya dengan pesan yang menyebut alasannya.
   */
  const openingAssetsSettled = !fixedAssetEnabled || (assetGate ? assetGate.settled : true)
  const importedAssetCount = assetGate?.imported_count ?? 0

  /**
   * Backend mewajibkan batch saldo awal saat finalize kecuali step ini secara
   * eksplisit ditandai "skip" (lihat SetupWizardService::openingBalanceSkipped()
   * -- pola yang sama dengan opening_fixed_assets_confirmed_none). Tanpa
   * memberi tahu backend, finalize akan selalu gagal dengan pesan generik
   * "Periksa kembali isian yang ditandai" di halaman Selesai, padahal halaman
   * itu tidak punya field apa pun untuk ditandai.
   *
   * Urutan dua panggilan di bawah mengikuti urutan langkah canonical: aset
   * tetap divalidasi lebih dulu, baru saldo awal.
   */
  const handleContinue = async () => {
    setIsContinuing(true)
    try {
      if (fixedAssetEnabled) {
        await setupApi.validateStep('opening_fixed_assets', { confirm_no_opening_fixed_assets: confirmedNoAssets })
      }
      await setupApi.validateStep('opening_balance_preview', { confirm_opening_balance_skipped: noOpeningBalance })
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

  /**
   * Impor mengisi data yang dijanjikan checkbox "akan diisi nanti" tanpa harus
   * mengetik satu per satu -- klien pindahan biasanya punya puluhan sampai
   * ratusan baris. Sama seperti dua tautan lain di step ini, tab primernya
   * didaftarkan dulu supaya AppShell tidak memantulkan navigasi.
   */
  const handleOpenImport = (profile: string) => {
    useImportPresetStore.getState().requestProfile(profile)
    openTab({
      id: 'master-data-import',
      menuKey: 'import',
      label: 'Impor Data',
      module: 'master-data',
      path: '/master-data/import',
    })
    navigate('/master-data/import')
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
      {/* ── 1. Aset Tetap Awal — harus beres sebelum saldo awal ─────────── */}
      {fixedAssetEnabled && (
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#24323a]">Aset Tetap Awal</h3>
          <p className="text-[13px] text-[#64748b]">
            Modul Aktiva Tetap aktif untuk perusahaan ini, jadi aset tetap awal diisi{' '}
            <span className="font-medium text-[#334155]">lebih dulu</span> — baris harga perolehan
            dan akumulasi penyusutannya dibuat otomatis di saldo awal dari data ini, sehingga
            urutannya tidak bisa dibalik. Kalau perusahaan ini belum punya aset tetap awal, centang
            di bawah untuk melanjutkan.
          </p>

          {importedAssetCount > 0 ? (
            <div className="rounded-lg border border-[#d9e2e5] bg-[#f8fafc] p-4 text-[13px] text-[#334155]">
              <span className="tabular-nums font-semibold">{importedAssetCount}</span> aset tetap awal
              sudah terdaftar. Saldo awal sekarang bisa diisi.
            </div>
          ) : (
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-dashed border-[#d9e2e5] p-4 text-[13px] text-[#64748b]">
              <Checkbox
                checked={confirmedNoAssets}
                disabled={confirmNoAssets.isPending}
                onCheckedChange={(checked) => {
                  const next = checked === true
                  setPendingConfirm(next)
                  confirmNoAssets.mutate(next)
                }}
                className="mt-0.5"
              />
              <span>Perusahaan ini belum punya aset tetap awal — lanjutkan, akan diisi nanti.</span>
            </label>
          )}

          {confirmNoAssets.isError && (
            <p className="text-[12px] text-red-600">
              Konfirmasi gagal disimpan. Coba centang ulang.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="button"
              onClick={handleOpenFixedAssets}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5c9ead] transition-colors hover:text-[#326273]"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Buka Halaman Aktiva Tetap
            </button>
            <button
              type="button"
              onClick={() => handleOpenImport('fixed_asset_opening')}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5c9ead] transition-colors hover:text-[#326273]"
            >
              <Upload className="h-3.5 w-3.5" /> Impor dari Berkas
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Saldo Awal — terkunci selama aset tetap awal belum beres ─── */}
      <div className={cn('space-y-6', fixedAssetEnabled && 'border-t border-[#d9e2e5] pt-6')}>
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#24323a]">Saldo Awal Akun</h3>
          <p className="text-[13px] text-[#64748b]">
            Saldo awal dikelola di halaman khusus menggunakan konsep batch (draft → validasi → posting).
            Kalau perusahaan ini belum punya saldo awal, centang di bawah untuk melanjutkan — datanya
            bisa diisi nanti lewat halaman Saldo Awal kapan saja.
          </p>
        </div>

        {!openingAssetsSettled && (
          <div className="flex items-start gap-2 rounded-lg border border-[#f0c98a] bg-[#fdf6ec] p-4 text-[13px] text-[#8a5a12]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Impor saldo awal terkunci sampai aset tetap awal diisi. Impor berkas Aset Tetap Awal di
              atas, atau centang “belum punya aset tetap awal”.
            </span>
          </div>
        )}

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
            onClick={() => handleOpenImport('opening_balance')}
            disabled={!openingAssetsSettled}
            title={openingAssetsSettled ? undefined : 'Isi aset tetap awal dulu'}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5c9ead] transition-colors hover:text-[#326273] disabled:cursor-not-allowed disabled:text-[#94a3b8] disabled:hover:text-[#94a3b8]"
          >
            <Upload className="h-3.5 w-3.5" /> Impor dari Berkas
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isContinuing || !openingAssetsSettled}
          title={openingAssetsSettled ? undefined : 'Isi aset tetap awal dulu'}
          className="bg-[#e39774] px-6 hover:bg-[#d4845e]"
        >
          Lanjutkan →
        </Button>
      </div>
    </div>
  )
}
