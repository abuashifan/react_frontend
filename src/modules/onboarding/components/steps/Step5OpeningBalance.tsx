import { useState } from 'react'
import { AlertTriangle, ExternalLink, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useOBStatus, useOBMutations } from '@/modules/opening-balance/hooks/useOpeningBalance'
import { useCompanySettings } from '@/modules/settings/hooks/useCompanySettings'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { useImportPresetStore } from '@/modules/imports/stores/useImportPresetStore'
import { setupApi } from '../../services/onboardingApi'

interface Props {
  onComplete: (skipped: boolean) => void
  onBack: () => void
}

/**
 * Langkah saldo awal wizard — Fase 8.
 *
 * ── Yang hilang dari versi sebelumnya, dan kenapa ───────────────────────────
 *
 * Dulu langkah ini memaksa urutan (aset tetap dulu, saldo awal belakangan) dan
 * menyimpan dua checkbox konfirmasi — "tidak punya aset tetap awal" dan "saldo
 * awal diisi nanti" — yang keduanya wajib dikirim ke backend sebelum wizard bisa
 * diselesaikan. Keduanya lahir dari kopling yang sudah dibongkar: baris aset
 * tetap tidak lagi dihasilkan otomatis di saldo awal.
 *
 * Sekarang satu-satunya hal yang WAJIB di sini adalah **tanggal saldo awal**.
 * Sisanya tautan: impor saldo akun, impor aset tetap, urutan bebas, dan boleh
 * dilanjutkan kapan saja setelah wizard selesai.
 */
export function Step5OpeningBalance({ onComplete, onBack }: Props) {
  const { toast } = useToast()
  const { data, isLoading } = useOBStatus()
  const { setOpeningDate } = useOBMutations()
  const { data: companySettings } = useCompanySettings()
  const openTab = useOpenPrimaryTab()
  const navigate = useNavigate()

  const [dateDraft, setDateDraft] = useState('')
  const [isContinuing, setIsContinuing] = useState(false)

  const status = data?.data
  const fixedAssetEnabled = companySettings?.data.modules.fixed_asset_enabled ?? false
  const effectiveDate = dateDraft || status?.opening_date || ''
  const hasJournals = (status?.journal_count ?? 0) > 0

  const handleContinue = async () => {
    setIsContinuing(true)
    try {
      // Tanggalnya disimpan lebih dulu kalau user mengubahnya di layar ini —
      // langkah ini tidak valid tanpa tanggal, dan itu satu-satunya syaratnya.
      if (dateDraft && dateDraft !== status?.opening_date && !status?.opening_date_locked) {
        await setOpeningDate.mutateAsync(dateDraft)
      }
      await setupApi.validateStep('opening_balance', { opening_date: effectiveDate })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan tanggal saldo awal.'))
    } finally {
      setIsContinuing(false)
    }
    onComplete(!hasJournals)
  }

  /**
   * Navigasi dilakukan di tab yang sama, bukan `window.open`: main.tsx memaksa
   * logout di tab browser baru saat "Ingat saya" tidak aktif, dan AppShell
   * selalu mengarahkan router ke tab aktif saat mount sehingga `href` telanjang
   * akan dipantulkan ke Dashboard. Tab primer didaftarkan dulu.
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

  if (isLoading) {
    return <div className="py-8 text-center text-[13px] text-[#64748b]">Memuat status saldo awal...</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-[14px] font-semibold text-[#24323a]">Tanggal Saldo Awal</h3>
        <p className="text-[13px] text-[#64748b]">
          Posisi keuangan perusahaan diukur pada tanggal ini, dan akumulasi penyusutan aset warisan
          dihitung sampai tanggal ini. Isi dengan batas periode — biasanya awal tahun fiskal.
        </p>
        <div className="max-w-xs">
          <Label htmlFor="setup-opening-date" className="text-[12px] text-[#334155]">Tanggal</Label>
          <Input
            id="setup-opening-date"
            type="date"
            value={effectiveDate}
            disabled={status?.opening_date_locked}
            onChange={(event) => setDateDraft(event.target.value)}
            className="mt-1 h-9 text-[13px] tabular-nums"
          />
          {status?.opening_date_locked && (
            <p className="mt-1 text-[11px] text-[#64748b]">
              Terkunci — sudah ada jurnal pembuka bertanggal ini.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-[#e2e8f0] pt-5">
        <h3 className="text-[14px] font-semibold text-[#24323a]">Isi Saldo Awal</h3>
        <p className="text-[13px] text-[#64748b]">
          Impor neraca saldo lama apa adanya — berkasnya <span className="font-medium text-[#334155]">tidak perlu seimbang</span>,
          selisihnya otomatis jatuh ke akun perantara dan ditutup ke modal di akhir. Boleh dicicil,
          dan boleh dilanjutkan setelah wizard ini selesai.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" className="h-9 gap-1.5 text-[13px]" onClick={() => handleOpenImport('opening_balance')}>
            <Upload className="h-3.5 w-3.5" /> Impor Saldo Akun
          </Button>
          {fixedAssetEnabled && (
            <Button type="button" variant="outline" className="h-9 gap-1.5 text-[13px]" onClick={() => handleOpenImport('fixed_asset_opening')}>
              <Upload className="h-3.5 w-3.5" /> Impor Aset Tetap
            </Button>
          )}
          <Button type="button" variant="outline" className="h-9 gap-1.5 text-[13px]" onClick={handleOpenOpeningBalance}>
            <ExternalLink className="h-3.5 w-3.5" /> Buka Papan Saldo Awal
          </Button>
        </div>

        {fixedAssetEnabled && (
          <p className="pt-1 text-[12px] text-[#64748b]">
            Dua impor itu terpisah dan <span className="font-medium text-[#334155]">urutannya bebas</span>: berkas
            saldo awal mengisi saldo akun (termasuk akun aset tetap), berkas aset tetap mendaftarkan
            kartu asetnya.
          </p>
        )}
      </div>

      {status && hasJournals && (
        <div className="space-y-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
          <div className="flex justify-between">
            <span className="text-[#64748b]">Jurnal pembuka</span>
            <span className="font-medium tabular-nums">{status.journal_count}</span>
          </div>
          <div className="flex justify-between border-t border-[#e2e8f0] pt-1">
            <span className="font-semibold text-[#334155]">Perantara belum ditutup</span>
            <span className={cn('font-semibold tabular-nums', status.is_complete ? 'text-green-700' : 'text-[#92400E]')}>
              {formatCurrency(Math.abs(status.clearing_balance))}
            </span>
          </div>
        </div>
      )}

      {status && !status.ready && (
        <div className="flex gap-2 rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-3 text-[12px] text-[#92400E]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Akun perantara saldo awal belum terpetakan. Selesaikan langkah Daftar Akun dan Pemetaan
            Akun lebih dulu — impor saldo awal belum bisa berjalan tanpa itu.
          </p>
        </div>
      )}

      <div className="flex justify-between border-t border-[#e2e8f0] pt-5">
        <Button type="button" variant="outline" onClick={onBack} className="h-9 text-[13px]">
          Kembali
        </Button>
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isContinuing || !effectiveDate}
          className="h-9 bg-[#5c9ead] px-6 text-[13px] hover:bg-[#4a8a9b]"
        >
          {isContinuing ? 'Menyimpan...' : 'Lanjutkan'}
        </Button>
      </div>
    </div>
  )
}
