import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/useToast'
import { useAccountMappings, useAccountMappingMutations } from '../hooks/useAccountMappings'
import { coaApi } from '../services/coaApi'
import type { AccountMapping } from '../types/accountMapping.types'
import type { SelectOption } from '@/types/common.types'

export default function AccountMappingPage() {
  const { toast } = useToast()
  const { data, isLoading } = useAccountMappings()
  const { update } = useAccountMappingMutations()

  const [localValues, setLocalValues] = useState<Record<string, number | null>>({})
  const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectOption<number>[]>>({})
  const [isSaving, setIsSaving] = useState(false)

  const mappings: AccountMapping[] = data?.data ?? []

  useEffect(() => {
    if (mappings.length > 0) {
      const timer = window.setTimeout(() => {
        const vals: Record<string, number | null> = {}
        const opts: Record<string, SelectOption<number>[]> = {}
        mappings.forEach((m) => {
          vals[m.mapping_key] = m.account_id
          if (m.account_id !== null && m.account_name !== null) {
            opts[m.mapping_key] = [{ value: m.account_id, label: m.account_name, sublabel: m.account_code ?? undefined }]
          }
        })
        setLocalValues(vals)
        setSelectedOptions(opts)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [mappings])

  const handleChange = (key: string, value: number | null, option?: SelectOption<number> | null) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }))
    if (option) {
      setSelectedOptions((prev) => ({ ...prev, [key]: [option] }))
    } else {
      setSelectedOptions((prev) => ({ ...prev, [key]: [] }))
    }
  }

  const handleSearchWithOption = async (query: string): Promise<SelectOption<number>[]> => {
    return coaApi.search(query)
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      await Promise.all(
        mappings.map((m) =>
          update.mutateAsync({ key: m.mapping_key, payload: { account_id: localValues[m.mapping_key] ?? null } }),
        ),
      )
      toast.success('Semua mapping akun berhasil disimpan.')
    } catch {
      toast.error('Gagal menyimpan sebagian mapping akun.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <WorkspaceLayout title="Mapping Akun" breadcrumb={[{ label: 'Master Data' }, { label: 'Mapping Akun' }]}>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[#d9e2e5] bg-white p-4">
              <Skeleton className="h-4 w-48 mb-3 rounded" />
              <Skeleton className="h-9 w-full rounded" />
            </div>
          ))}
        </div>
      </WorkspaceLayout>
    )
  }

  return (
    <WorkspaceLayout
      title="Mapping Akun"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Mapping Akun' }]}
      action={
        <PermissionGuard permission="master-data.account-mappings.edit">
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? 'Menyimpan...' : 'Simpan Semua'}
          </Button>
        </PermissionGuard>
      }
    >
      {mappings.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-[#94a3b8]">
          Belum ada konfigurasi mapping akun.
        </div>
      ) : (
        <FormSection title="Mapping Akun Default" columns={2}>
          {mappings.map((mapping) => {
            const fieldId = `account-mapping-${mapping.mapping_key}`
            const fieldLabel = mapping.label ?? mapping.mapping_key
            return (
              <div key={mapping.mapping_key} className="flex flex-col gap-1">
                <Label htmlFor={fieldId} className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                  {fieldLabel}
                </Label>
                <SearchableSelect
                  triggerId={fieldId}
                  triggerAriaLabel={fieldLabel}
                  value={localValues[mapping.mapping_key] ?? null}
                  onChange={(value) => {
                    const opts = selectedOptions[mapping.mapping_key] ?? []
                    const opt = opts.find((o) => o.value === value) ?? null
                    handleChange(mapping.mapping_key, value, opt)
                  }}
                  onSearch={handleSearchWithOption}
                  placeholder="Pilih akun..."
                  selectedOptions={selectedOptions[mapping.mapping_key] ?? []}
                />
              </div>
            )
          })}
        </FormSection>
      )}
    </WorkspaceLayout>
  )
}
