import { useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { useAccountMappings, useAccountMappingMutations } from '@/modules/master-data/hooks/useAccountMappings'
import { coaApi } from '@/modules/master-data/services/coaApi'

export default function AccountMappingSettingsPage() {
  const { data, isLoading } = useAccountMappings()
  const { update } = useAccountMappingMutations()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [localValues, setLocalValues] = useState<Record<string, number | null>>({})

  const mappings = data?.data ?? []
  const getAccountId = (key: string): number | null => {
    if (key in localValues) return localValues[key]
    return mappings.find((m) => m.key === key)?.account_id ?? null
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(localValues).map(([key, account_id]) =>
          update.mutateAsync({ key, payload: { account_id } })
        )
      )
      setLocalValues({})
      toast.success('Pemetaan akun disimpan.')
    } catch {
      toast.error('Gagal menyimpan pemetaan akun.')
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
        <FormSection title="Pemetaan Akun Otomatis">
          {mappings.map((mapping) => (
            <div key={mapping.key} className="flex flex-col gap-1">
              <Label htmlFor={`settings-account-mapping-${mapping.key}`} className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{mapping.label}</Label>
              <SearchableSelect
                triggerId={`settings-account-mapping-${mapping.key}`}
                triggerAriaLabel={mapping.label}
                value={getAccountId(mapping.key)}
                onChange={(val) => setLocalValues((prev) => ({ ...prev, [mapping.key]: val as number | null }))}
                onSearch={(q) => coaApi.search(q)}
                placeholder="Pilih akun..."
              />
            </div>
          ))}
        </FormSection>
        <div className="flex justify-end">
          <Button type="button" onClick={() => void handleSave()} disabled={saving || Object.keys(localValues).length === 0} className="h-9 bg-[#5c9ead] px-6 text-[13px] hover:bg-[#4a8a9b]">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
