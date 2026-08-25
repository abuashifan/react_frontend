import { useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useAccountMappings, useAccountMappingMutations } from '@/modules/master-data/hooks/useAccountMappings'
import { AccountMappingGroupedFields } from '@/modules/master-data/components/AccountMappingGroupedFields'

/**
 * Sama persis dengan Step3AccountMapping di setup wizard -- keduanya memakai
 * AccountMappingGroupedFields dan endpoint `/master-data/account-mappings`
 * yang sama, jadi pemetaan yang dikonfigurasi lewat wizard langsung terlihat
 * (dan bisa diubah lagi) di sini, tanpa duplikasi tampilan yang bisa berbeda.
 */
export default function AccountMappingSettingsPage() {
  const { data, isLoading } = useAccountMappings()
  const { update } = useAccountMappingMutations()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, number | null>>({})

  const mappings = data?.data ?? []

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(overrides).map(([key, account_id]) =>
          update.mutateAsync({ key, payload: { account_id } })
        )
      )
      setOverrides({})
      toast.success('Pemetaan akun disimpan.')
    } catch (saveError) {
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan pemetaan akun.'))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <WorkspaceLayout title="Pemetaan Akun" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Pemetaan Akun' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></WorkspaceLayout>

  return (
    <WorkspaceLayout title="Pemetaan Akun" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Pemetaan Akun' }]}>
      <div className="space-y-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
          Perubahan pemetaan akun akan mempengaruhi entri jurnal otomatis untuk semua transaksi baru. Pastikan akun yang dipilih sudah benar sebelum menyimpan.
        </div>

        <AccountMappingGroupedFields
          mappings={mappings}
          overrides={overrides}
          onOverrideChange={(key, val) => setOverrides((prev) => ({ ...prev, [key]: val }))}
          idPrefix="settings-account-mapping"
        />

        <div className="flex justify-end">
          <Button type="button" onClick={() => void handleSave()} disabled={saving || Object.keys(overrides).length === 0} className="h-9 bg-[#5c9ead] px-6 text-[13px] hover:bg-[#4a8a9b]">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
