import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCompanySettings, useCompanySettingsMutations } from '@/modules/settings/hooks/useCompanySettings'
import type { CompanyModuleSettings } from '@/modules/settings/types/settings.types'
import { setupApi } from '../../services/onboardingApi'

const MODULE_LABELS: { key: keyof CompanyModuleSettings; label: string; hint: string }[] = [
  { key: 'sales_enabled', label: 'Penjualan', hint: 'Penawaran, sales order, invoice, penerimaan' },
  { key: 'purchase_enabled', label: 'Pembelian', hint: 'Purchase order, tagihan vendor, pembayaran' },
  { key: 'cash_bank_enabled', label: 'Kas & Bank', hint: 'Kas masuk/keluar, transfer, rekonsiliasi' },
  { key: 'inventory_enabled', label: 'Persediaan', hint: 'Saldo stok, mutasi, penyesuaian, opname' },
  { key: 'warehouse_enabled', label: 'Gudang', hint: 'Pisahkan stok per gudang' },
  { key: 'fixed_asset_enabled', label: 'Aktiva Tetap', hint: 'Register aset, depresiasi, disposal' },
  { key: 'approval_enabled', label: 'Approval', hint: 'Dokumen perlu disetujui sebelum diposting' },
  { key: 'tax_enabled', label: 'Pajak', hint: 'Perhitungan pajak pada transaksi' },
  { key: 'reports_enabled', label: 'Laporan', hint: 'Laporan keuangan dan operasional' },
]

interface Props {
  onComplete: () => void
  onBack: () => void
}

/**
 * Langkah `module_selection` — salah satu step canonical backend
 * (SetupWizardService::$steps) yang sebelumnya tidak punya UI di wizard.
 *
 * Pilihan modul di sini menentukan isi langkah berikutnya: tautan impor aset
 * tetap hanya muncul bila Aktiva Tetap diaktifkan, dan account mapping hanya
 * menuntut mapping milik modul yang aktif.
 */
export function StepModuleSelection({ onComplete, onBack }: Props) {
  const { toast } = useToast()
  const { data, isLoading } = useCompanySettings()
  const { updateModules } = useCompanySettingsMutations()
  const [modules, setModules] = useState<CompanyModuleSettings>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sinkronisasi nilai server → state form dilakukan saat render (pola
  // adjust-state), bukan lewat useEffect: menulis state di efek memicu render
  // kedua dan sempat menampilkan nilai kosong.
  const loadedModules = data?.data.modules
  const [syncedFrom, setSyncedFrom] = useState<CompanyModuleSettings | null>(null)
  if (loadedModules && loadedModules !== syncedFrom) {
    setSyncedFrom(loadedModules)
    setModules(loadedModules)
  }

  const handleToggle = (key: keyof CompanyModuleSettings, value: boolean) => {
    setModules((prev) => ({ ...prev, [key]: value }))
  }

  const handleContinue = async () => {
    setIsSubmitting(true)
    try {
      await updateModules.mutateAsync(modules)
      // Progres step bersifat non-blocking: kegagalan mencatat progres tidak
      // boleh menahan user, karena backend tetap memvalidasi ulang saat finalize.
      try { await setupApi.validateStep('module_selection') } catch { /* progres non-blocking */ }
      onComplete()
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, 'Gagal menyimpan pilihan modul.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat pengaturan modul...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[14px] font-semibold text-[#24323a]">Modul yang Dipakai</h3>
        <p className="mt-1 text-[13px] text-[#64748b]">
          Nyalakan hanya modul yang perusahaan Anda pakai. Pilihan ini bisa diubah nanti di
          Pengaturan → Perusahaan.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {MODULE_LABELS.map(({ key, label, hint }) => (
          <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-[#e2e8f0] p-3">
            <div className="min-w-0">
              <Label htmlFor={`setup-module-${String(key)}`} className="text-[13px] text-[#1e2d35]">{label}</Label>
              <p className="mt-0.5 text-[11px] text-[#94a3b8]">{hint}</p>
            </div>
            <Switch
              id={`setup-module-${String(key)}`}
              checked={!!modules[key]}
              onCheckedChange={(v) => handleToggle(key, v)}
              disabled={isSubmitting}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isSubmitting}
          className="bg-[#e39774] px-6 hover:bg-[#d4845e]"
        >
          {isSubmitting ? 'Menyimpan...' : 'Lanjutkan →'}
        </Button>
      </div>
    </div>
  )
}
