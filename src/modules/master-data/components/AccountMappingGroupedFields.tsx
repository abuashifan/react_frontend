import { useState } from 'react'
import { Search } from 'lucide-react'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import type { SelectOption } from '@/types/common.types'
import { AccountPickerDialog } from './AccountPickerDialog'
import { coaApi } from '../services/coaApi'
import type { Coa, CoaType } from '../types/coa.types'
import type { AccountMapping } from '../types/accountMapping.types'
import { ACCOUNT_MAPPING_MODULE_ORDER, ACCOUNT_MAPPING_MODULE_TITLES } from '../constants/accountMapping'

interface Props {
  mappings: AccountMapping[]
  /** Perubahan yang belum disimpan, key = mapping_key. Dikelola oleh pemanggil karena dipakai juga untuk diff saat submit. */
  overrides: Record<string, number | null>
  onOverrideChange: (key: string, accountId: number | null) => void
  /** Prefix id DOM -- beda antar layar supaya tidak bentrok kalau suatu saat dua instance tampil sekaligus. */
  idPrefix: string
}

/**
 * Daftar field Account Mapping terkelompok per modul, dipakai bersama oleh
 * setup wizard (Step3AccountMapping) dan Pengaturan -> Pemetaan Akun.
 * Satu implementasi supaya kedua layar selalu identik -- field mapping baru
 * (mis. per kelas aset tetap) otomatis tampil di keduanya tanpa mengubah dua
 * tempat sekaligus, dan wizard tidak lagi punya pencarian akun sendiri yang
 * lupa filter `postable_only` seperti sebelumnya.
 */
export function AccountMappingGroupedFields({ mappings, overrides, onOverrideChange, idPrefix }: Props) {
  // Label akun yang dipilih lewat AccountPickerDialog -- SearchableSelect hanya tahu label dari
  // `selectedOptions` (data server) atau pilihannya sendiri; tanpa ini field akan menampilkan
  // fallback "#id" karena dipilih dari luar komponennya.
  const [overrideOptions, setOverrideOptions] = useState<Record<string, SelectOption<number>>>({})
  const [pickerKey, setPickerKey] = useState<string | null>(null)

  const valueFor = (key: string, original: number | null): number | null =>
    key in overrides ? overrides[key] : original

  const handlePicked = (key: string, accounts: Coa[]) => {
    const account = accounts[0]
    if (!account) return
    onOverrideChange(key, account.id)
    setOverrideOptions((prev) => ({
      ...prev,
      [key]: { value: account.id, label: account.account_name, sublabel: account.account_code },
    }))
  }

  const pickerMapping = mappings.find((m) => m.mapping_key === pickerKey)
  const pickerAccountType: CoaType | undefined =
    pickerMapping?.account_types.length === 1 ? (pickerMapping.account_types[0] as CoaType) : undefined

  const modules = ACCOUNT_MAPPING_MODULE_ORDER.filter((mod) => mappings.some((m) => m.module === mod))

  return (
    <div className="space-y-6">
      {modules.map((mod) => (
        <div key={mod} className="overflow-hidden rounded-lg border border-[#d9e2e5]">
          <div className="border-b border-[#d9e2e5] bg-[#f8fafc] px-4 py-2.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#24323a]">
              {ACCOUNT_MAPPING_MODULE_TITLES[mod] ?? mod}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            {mappings
              .filter((m) => m.module === mod)
              .map((m) => {
                const current = valueFor(m.mapping_key, m.account_id)
                const overrideOption = overrideOptions[m.mapping_key]
                const presetOption: SelectOption<number>[] = overrideOption
                  ? [overrideOption]
                  : m.account_id !== null && m.account_name !== null
                    ? [{ value: m.account_id, label: m.account_name, sublabel: m.account_code ?? undefined }]
                    : []
                return (
                  <div key={m.mapping_key}>
                    <label
                      htmlFor={`${idPrefix}-${m.mapping_key}`}
                      className="mb-1.5 block text-[12px] font-medium text-[#24323a]"
                    >
                      {m.label ?? m.mapping_key}{' '}
                      {m.is_required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <SearchableSelect
                          triggerId={`${idPrefix}-${m.mapping_key}`}
                          triggerAriaLabel={m.label ?? m.mapping_key}
                          value={current}
                          selectedOptions={presetOption}
                          onChange={(val) => onOverrideChange(m.mapping_key, val)}
                          onSearch={(query) => coaApi.search(query)}
                          placeholder="Cari akun..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPickerKey(m.mapping_key)}
                        aria-label={`Cari akun untuk ${m.label ?? m.mapping_key} lewat dialog`}
                        title="Cari akun lewat dialog"
                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-[#d9e2e5] text-[#64748b] transition-colors hover:border-[#5c9ead] hover:text-[#5c9ead] lg:h-9 lg:w-9"
                      >
                        <Search className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ))}

      <AccountPickerDialog
        open={pickerKey !== null}
        onClose={() => setPickerKey(null)}
        multiple={false}
        accountType={pickerAccountType}
        title={`Cari Akun — ${pickerMapping?.label ?? pickerKey ?? ''}`}
        onConfirm={(accounts) => {
          if (pickerKey) handlePicked(pickerKey, accounts)
          setPickerKey(null)
        }}
      />
    </div>
  )
}
