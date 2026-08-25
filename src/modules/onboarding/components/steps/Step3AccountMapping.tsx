import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccountMappings } from '@/modules/master-data/hooks/useAccountMappings'
import { accountMappingApi } from '@/modules/master-data/services/accountMappingApi'
import { AccountMappingGroupedFields } from '@/modules/master-data/components/AccountMappingGroupedFields'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'

interface Props {
  onComplete: () => void
  onBack: () => void
}

/**
 * Sama persis dengan Pengaturan -> Pemetaan Akun (lihat AccountMappingSettingsPage) --
 * keduanya memakai AccountMappingGroupedFields dan endpoint
 * `/master-data/account-mappings` yang sama, jadi apa pun yang diisi di sini
 * langsung menjadi pemetaan aktif perusahaan, bukan draft terpisah yang harus
 * diulang lagi di menu Pengaturan.
 */
export function Step3AccountMapping({ onComplete, onBack }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data, isLoading, isError, refetch } = useAccountMappings()
  const [overrides, setOverrides] = useState<Record<string, number | null>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mappings = data?.data ?? []
  const valueFor = (key: string, original: number | null): number | null =>
    key in overrides ? overrides[key] : original

  const missingRequired = mappings.filter(
    (m) => m.is_required && valueFor(m.mapping_key, m.account_id) === null,
  )

  const handleContinue = async () => {
    setIsSubmitting(true)
    try {
      const tasks = Object.entries(overrides)
        .filter(([key, val]) => {
          const original = mappings.find((m) => m.mapping_key === key)?.account_id ?? null
          return val !== null && val !== original
        })
        .map(([key, val]) => accountMappingApi.update(key, { account_id: val }))

      if (tasks.length > 0) {
        await Promise.all(tasks)
        await qc.invalidateQueries({ queryKey: ['master-data-account-mappings'] })
        toast.success('Perubahan pemetaan akun disimpan.')
      }
      onComplete()
    } catch (saveError) {
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan perubahan pemetaan akun. Coba lagi.'))
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

      <AccountMappingGroupedFields
        mappings={mappings}
        overrides={overrides}
        onOverrideChange={(key, val) => setOverrides((prev) => ({ ...prev, [key]: val }))}
        idPrefix="onboarding-account-mapping"
      />

      <div className="sticky bottom-0 -mx-6 mt-2 flex items-center justify-between border-t border-[#d9e2e5] bg-white px-6 py-3 lg:-mx-8 lg:px-8">
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
