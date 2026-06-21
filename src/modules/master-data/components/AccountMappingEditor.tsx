import { useMemo, useState } from 'react'
import { AlertCircle, Save } from 'lucide-react'
import { FormSection } from '@/components/shared/form/FormSection'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/apiError'
import { useToast } from '@/hooks/useToast'
import type { SelectOption } from '@/types/common.types'
import { useAccountMappings, useAccountMappingMutations } from '../hooks/useAccountMappings'
import { coaApi } from '../services/coaApi'
import type { AccountMapping } from '../types/accountMapping.types'

interface AccountMappingEditorProps {
  savePermission: string
  saveLabel?: string
}

function selectedAccountOption(mapping: AccountMapping): SelectOption<number>[] {
  if (!mapping.account_id || !mapping.account_name) return []

  return [{
    value: mapping.account_id,
    label: mapping.account_name,
    sublabel: mapping.account_code ?? undefined,
  }]
}

export function AccountMappingEditor({
  savePermission,
  saveLabel = 'Simpan Perubahan',
}: AccountMappingEditorProps) {
  const { toast } = useToast()
  const query = useAccountMappings()
  const { updateMany } = useAccountMappingMutations()
  const [localValues, setLocalValues] = useState<Record<string, number | null>>({})
  const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectOption<number>[]>>({})

  const mappings = useMemo(
    () => (query.data?.data ?? []).filter((mapping) => mapping.visible_in_settings),
    [query.data?.data],
  )

  const currentValue = (mapping: AccountMapping): number | null =>
    Object.prototype.hasOwnProperty.call(localValues, mapping.mapping_key)
      ? localValues[mapping.mapping_key]
      : mapping.account_id

  const dirtyMappings = useMemo(
    () => mappings.filter(
      (mapping) => Object.prototype.hasOwnProperty.call(localValues, mapping.mapping_key)
        && localValues[mapping.mapping_key] !== mapping.account_id,
    ),
    [localValues, mappings],
  )

  const groupedMappings = useMemo(() => {
    const groups = new Map<string, AccountMapping[]>()
    mappings.forEach((mapping) => {
      const section = mapping.settings_section?.trim() || 'Lainnya'
      groups.set(section, [...(groups.get(section) ?? []), mapping])
    })
    return Array.from(groups.entries())
  }, [mappings])

  const handleChange = (
    mapping: AccountMapping,
    value: number | null,
    option?: SelectOption<number>,
  ) => {
    setLocalValues((current) => ({ ...current, [mapping.mapping_key]: value }))
    setSelectedOptions((current) => ({
      ...current,
      [mapping.mapping_key]: option ? [option] : [],
    }))
  }

  const handleSave = async () => {
    const missingRequired = mappings.find(
      (mapping) => mapping.is_required && currentValue(mapping) == null,
    )
    if (missingRequired) {
      toast.error(`${missingRequired.label ?? missingRequired.mapping_key} wajib dipilih.`)
      return
    }

    try {
      await updateMany.mutateAsync({
        mappings: dirtyMappings.map((mapping) => ({
          mapping_key: mapping.mapping_key,
          account_id: currentValue(mapping),
        })),
      })
      setLocalValues({})
      setSelectedOptions({})
      toast.success('Pemetaan akun berhasil disimpan.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan pemetaan akun.'))
    }
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-[#d9e2e5] bg-white p-4">
            <Skeleton className="mb-3 h-4 w-48 rounded" />
            <Skeleton className="h-9 w-full rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="h-6 w-6 text-red-600" />
        <div>
          <p className="text-[13px] font-semibold text-red-800">Pemetaan akun gagal dimuat</p>
          <p className="mt-1 text-[12px] text-red-700">
            {getApiErrorMessage(query.error, 'Periksa koneksi lalu coba lagi.')}
          </p>
        </div>
        <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => void query.refetch()}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (mappings.length === 0) {
    return (
      <div className="py-16 text-center text-[13px] text-[#94a3b8]">
        Belum ada konfigurasi pemetaan akun yang dapat diubah.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groupedMappings.map(([section, sectionMappings]) => (
        <FormSection key={section} title={section} columns={2}>
          {sectionMappings.map((mapping) => {
            const label = mapping.label?.trim() || mapping.mapping_key
            return (
              <div key={mapping.mapping_key} className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                  {label}
                  {mapping.is_required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                {mapping.description && (
                  <p className="text-[11px] text-[#64748b]">{mapping.description}</p>
                )}
                <SearchableSelect
                  value={currentValue(mapping)}
                  onChange={(value, option) => handleChange(mapping, value, option)}
                  onSearch={(queryText) => coaApi.search(queryText, {
                    accountTypes: mapping.account_types,
                    isActive: true,
                  })}
                  placeholder="Pilih akun aktif..."
                  ariaLabel={`${label}${mapping.is_required ? ' (wajib)' : ''}`}
                  clearable={!mapping.is_required}
                  selectedOptions={
                    selectedOptions[mapping.mapping_key]
                    ?? selectedAccountOption(mapping)
                  }
                />
              </div>
            )
          })}
        </FormSection>
      ))}

      <div className="flex items-center justify-end gap-3">
        {dirtyMappings.length > 0 && (
          <span className="text-[12px] text-[#64748b]">
            {dirtyMappings.length} perubahan belum disimpan
          </span>
        )}
        <PermissionGuard permission={savePermission}>
          <Button
            type="button"
            className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
            onClick={() => void handleSave()}
            disabled={dirtyMappings.length === 0 || updateMany.isPending}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {updateMany.isPending ? 'Menyimpan...' : saveLabel}
          </Button>
        </PermissionGuard>
      </div>
    </div>
  )
}
