import { useState } from 'react'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { usePeriodLockStatus, usePeriodLockMutations } from '../hooks/useFiscalYear'

export default function PeriodLockPage() {
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = usePeriodLockStatus()
  const { update } = usePeriodLockMutations()

  const currentLockUntil = data?.data?.active_fiscal_year?.lock_until ?? null
  const [lockUntil, setLockUntil] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  const handleLock = async () => {
    try {
      await update.mutateAsync({ lock_until: lockUntil || null, override_reason: overrideReason || undefined })
      toast.success('Periode akuntansi berhasil diperbarui.')
      setLockUntil('')
      setOverrideReason('')
    } catch { toast.error('Gagal memperbarui periode lock.') }
  }

  const handleUnlock = async () => {
    if (!overrideReason.trim()) { toast.error('Alasan override wajib diisi untuk membuka lock.'); return }
    try {
      await update.mutateAsync({ lock_until: null, override_reason: overrideReason })
      toast.success('Period lock berhasil dibuka.')
      setOverrideReason('')
    } catch { toast.error('Gagal membuka period lock.') }
  }

  if (isLoading) {
    return (
      <FormLayout title="Periode Akuntansi" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Periode Akuntansi' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout title="Periode Akuntansi" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Periode Akuntansi' }]}>
      <div className="space-y-3">
        <FormSection title="Status Lock Saat Ini">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Lock Sampai</span>
            <span className={`text-[13px] font-semibold ${currentLockUntil ? 'text-red-600' : 'text-green-600'}`}>
              {currentLockUntil ? formatDate(currentLockUntil) : 'Tidak ada lock aktif'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keterangan</span>
            <span className="text-[13px] text-[#64748b]">
              {currentLockUntil
                ? `Semua posting di atau sebelum ${formatDate(currentLockUntil)} diblokir.`
                : 'Semua periode terbuka untuk posting.'}
            </span>
          </div>
        </FormSection>

        {can('accounting.period-locks.manage') && (
          <FormSection title="Atur Period Lock">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Lock Sampai Tanggal</Label>
              <Input type="date" value={lockUntil} onChange={(e) => setLockUntil(e.target.value)} className="h-9 text-[13px]" />
              <p className="text-[11px] text-[#64748b]">Kosongkan untuk menghapus lock. Semua posting di atau sebelum tanggal ini akan diblokir.</p>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alasan Override</Label>
              <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Alasan perubahan periode lock..." className="h-9 text-[13px]" />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={() => void handleLock()} disabled={update.isPending} className="h-9 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9c]">
                {lockUntil ? 'Terapkan Lock' : 'Hapus Lock'}
              </Button>
              {currentLockUntil && (
                <Button variant="outline" onClick={() => void handleUnlock()} disabled={update.isPending} className="h-9 px-4 text-[13px]">
                  Buka Lock
                </Button>
              )}
            </div>
          </FormSection>
        )}
      </div>
    </FormLayout>
  )
}
