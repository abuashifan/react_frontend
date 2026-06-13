import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { onboardingApi } from '../../services/onboardingApi'
import { useToast } from '@/hooks/useToast'
import { MAPPING_SECTIONS } from '../../constants'
import type { SelectOption } from '@/types/common.types'

type MappingValues = Record<string, number | null>

interface Props {
  onComplete: () => void
  onBack: () => void
}

export function Step3AccountMapping({ onComplete, onBack }: Props) {
  const { toast } = useToast()
  const [values, setValues] = useState<MappingValues>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const allRequired = MAPPING_SECTIONS.flatMap((s) => s.mappings).filter((m) => m.required)
  const missingRequired = allRequired.filter((m) => !values[m.key])

  const handleSearch = async (query: string): Promise<SelectOption<number>[]> => {
    return onboardingApi.searchAccounts(query)
  }

  const handleContinue = async () => {
    if (missingRequired.length > 0) {
      setValidationError(`Lengkapi ${missingRequired.length} akun yang wajib diisi sebelum melanjutkan.`)
      return
    }
    setValidationError(null)
    setIsSubmitting(true)

    try {
      const tasks = Object.entries(values)
        .filter(([, v]) => v !== null)
        .map(([key, accountId]) => onboardingApi.updateAccountMapping(key, accountId as number))
      await Promise.all(tasks)
      toast.success('Account mapping berhasil disimpan.')
      onComplete()
    } catch {
      toast.error('Gagal menyimpan account mapping. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-[#64748b]">
        Petakan akun dari COA ke fungsi bisnis. Akun bertanda <span className="text-red-500">*</span> wajib diisi.
      </p>

      {MAPPING_SECTIONS.map((section) => (
        <div key={section.title} className="border border-[#d9e2e5] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#d9e2e5]">
            <p className="text-[12px] font-semibold text-[#24323a] uppercase tracking-wide">{section.title}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {section.mappings.map((m) => (
              <div key={m.key}>
                <label className="block text-[12px] font-medium text-[#24323a] mb-1.5">
                  {m.label} {m.required && <span className="text-red-500">*</span>}
                </label>
                <SearchableSelect
                  value={values[m.key] ?? null}
                  onChange={(v) => setValues((prev) => ({ ...prev, [m.key]: v }))}
                  onSearch={handleSearch}
                  placeholder="Cari akun..."
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {validationError && (
        <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {validationError}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={isSubmitting}
          className="bg-[#e39774] hover:bg-[#d4845e] px-6"
        >
          {isSubmitting ? 'Menyimpan...' : 'Lanjutkan →'}
        </Button>
      </div>
    </div>
  )
}
