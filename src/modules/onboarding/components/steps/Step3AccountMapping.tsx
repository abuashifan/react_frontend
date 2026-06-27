import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { onboardingApi } from '../../services/onboardingApi'
import { useToast } from '@/hooks/useToast'
import type { SelectOption } from '@/types/common.types'

interface Props {
  onComplete: () => void
  onBack: () => void
}

const MODULE_ORDER = [
  'sales',
  'purchase',
  'inventory',
  'fixed_assets',
  'cash_bank',
  'opening_balance',
  'closing',
  'journal',
] as const

const MODULE_TITLES: Record<string, string> = {
  sales: 'Penjualan',
  purchase: 'Pembelian',
  inventory: 'Persediaan',
  fixed_assets: 'Aset Tetap',
  cash_bank: 'Kas & Bank',
  opening_balance: 'Saldo Awal',
  closing: 'Tutup Buku',
  journal: 'Jurnal',
}

export function Step3AccountMapping({ onComplete, onBack }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['onboarding-account-mappings'],
    queryFn: () => onboardingApi.listAccountMappings(),
  })
  const [overrides, setOverrides] = useState<Record<string, number | null>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mappings = data ?? []
  const valueFor = (key: string, original: number | null): number | null =>
    key in overrides ? overrides[key] : original

  const missingRequired = mappings.filter(
    (m) => m.is_required && valueFor(m.mapping_key, m.account_id) === null,
  )

  const handleSearch = (query: string): Promise<SelectOption<number>[]> =>
    onboardingApi.searchAccounts(query)

  const handleContinue = async () => {
    setIsSubmitting(true)
    try {
      const tasks = Object.entries(overrides)
        .filter(([key, val]) => {
          const original = mappings.find((m) => m.mapping_key === key)?.account_id ?? null
          return val !== null && val !== original
        })
        .map(([key, val]) => onboardingApi.updateAccountMapping(key, val as number))

      if (tasks.length > 0) {
        await Promise.all(tasks)
        await qc.invalidateQueries({ queryKey: ['onboarding-account-mappings'] })
        toast.success('Perubahan pemetaan akun disimpan.')
      }
      onComplete()
    } catch {
      toast.error('Gagal menyimpan perubahan pemetaan akun. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-[13px] text-[#64748b]">
        Memuat pemetaan akun...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          Gagal memuat pemetaan akun.
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
          <Button type="button" onClick={() => void refetch()} className="bg-[#5c9ead] hover:bg-[#4a8a9b]">
            Muat Ulang
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-md border border-[#cdeadf] bg-[#f0fbf6] px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3f9d7b]" />
        <p className="text-[12px] leading-snug text-[#24323a]">
          Pemetaan akun sudah terisi otomatis dari template COA. Anda bisa langsung{' '}
          <span className="font-semibold">Lanjutkan</span>, atau ubah akun di bawah bila entitas Anda
          memerlukan akun berbeda. Pemetaan juga dapat diubah nanti di Pengaturan → Pemetaan Akun.
        </p>
      </div>

      {missingRequired.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12px] leading-snug text-amber-800">
            {missingRequired.length} pemetaan wajib belum memiliki akun. Anda tetap dapat melanjutkan,
            tetapi sebaiknya lengkapi sebelum bertransaksi.
          </p>
        </div>
      )}

      {MODULE_ORDER.filter((mod) => mappings.some((m) => m.module === mod)).map((mod) => (
        <div key={mod} className="overflow-hidden rounded-lg border border-[#d9e2e5]">
          <div className="border-b border-[#d9e2e5] bg-[#f8fafc] px-4 py-2.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#24323a]">
              {MODULE_TITLES[mod] ?? mod}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            {mappings
              .filter((m) => m.module === mod)
              .map((m) => {
                const current = valueFor(m.mapping_key, m.account_id)
                const presetOption: SelectOption<number>[] =
                  m.account_id !== null && m.account_name !== null
                    ? [{ value: m.account_id, label: m.account_name, sublabel: m.account_code ?? undefined }]
                    : []
                return (
                  <div key={m.mapping_key}>
                    <label
                      htmlFor={`onboarding-account-mapping-${m.mapping_key}`}
                      className="mb-1.5 block text-[12px] font-medium text-[#24323a]"
                    >
                      {m.label ?? m.mapping_key}{' '}
                      {m.is_required && <span className="text-red-500">*</span>}
                    </label>
                    <SearchableSelect
                      triggerId={`onboarding-account-mapping-${m.mapping_key}`}
                      triggerAriaLabel={m.label ?? m.mapping_key}
                      value={current}
                      selectedOptions={presetOption}
                      onChange={(val) =>
                        setOverrides((prev) => ({ ...prev, [m.mapping_key]: val }))
                      }
                      onSearch={handleSearch}
                      placeholder="Cari akun..."
                    />
                  </div>
                )
              })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
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
