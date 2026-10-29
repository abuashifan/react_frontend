import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useAccountMappingMutations } from '../hooks/useAccountMappings'

interface Props {
  /** Dipanggil setelah reset berhasil -- pemanggil membuang draft `overrides` lokal supaya tidak menimpa balik hasil reset. */
  onReset: () => void
}

/**
 * Tombol "Reset & Scan Ulang COA" untuk setup wizard (Step3AccountMapping) dan
 * Pengaturan -> Pemetaan Akun. Menimpa SELURUH pemetaan dengan akun default
 * yang ditemukan di COA saat ini -- berguna setelah COA diimpor ulang, saat
 * pemetaan lama masih menunjuk akun yang salah atau sudah tidak ada.
 */
export function AccountMappingResetButton({ onReset }: Props) {
  const { toast } = useToast()
  const { resetDefaults } = useAccountMappingMutations()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirm = async () => {
    try {
      const response = await resetDefaults.mutateAsync()
      const { filled, missing_required: missingRequired } = response.data.summary
      onReset()
      setConfirmOpen(false)
      if (missingRequired.length > 0) {
        toast.warning(`${filled} pemetaan terisi dari COA. ${missingRequired.length} pemetaan wajib belum menemukan akun default.`)
      } else {
        toast.success(`${filled} pemetaan terisi ulang dari COA.`)
      }
    } catch (resetError) {
      toast.error(getApiErrorMessage(resetError, 'Gagal mereset pemetaan akun. Coba lagi.'))
    }
  }

  return (
    <PermissionGuard permission="settings.account_mapping.edit" fallback={null}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirmOpen(true)}
        className="h-9 w-fit gap-1.5 text-[12px]"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Reset &amp; Scan Ulang COA
      </Button>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirm()}
        title="Reset pemetaan akun?"
        description="Semua pemetaan akan diisi ulang dari akun default yang ditemukan di COA saat ini. Pemetaan yang Anda ubah manual akan tertimpa, dan pemetaan tanpa akun default di COA akan dikosongkan."
        confirmLabel="Reset & Scan Ulang"
        loadingLabel="Memproses..."
        variant="destructive"
        isLoading={resetDefaults.isPending}
      />
    </PermissionGuard>
  )
}
