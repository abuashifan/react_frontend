import { useEffect, useState } from 'react'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { formatDate, cn } from '@/lib/utils'
import { usePeriodLockStatus, usePeriodLockMutations } from '../hooks/useFiscalYear'

interface PeriodRow {
  label: string
  monthEnd: string
  isLocked: boolean
}

/** Bangun daftar status periode bulanan dari rentang fiscal year + locked_until. */
function buildPeriods(start?: string, end?: string, lockedUntil?: string | null): PeriodRow[] {
  if (!start || !end) return []
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return []

  const rows: PeriodRow[] = []
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  while (cursor <= endDate && rows.length < 36) {
    const monthEndDate = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    const monthEnd = `${monthEndDate.getFullYear()}-${String(monthEndDate.getMonth() + 1).padStart(2, '0')}-${String(monthEndDate.getDate()).padStart(2, '0')}`
    rows.push({
      label: cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      monthEnd,
      isLocked: !!lockedUntil && monthEnd <= lockedUntil,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return rows
}

export default function PeriodLockPage() {
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading, isError, error, refetch } = usePeriodLockStatus()
  const { update } = usePeriodLockMutations()

  const fy = data?.data?.active_fiscal_year
  const currentLockUntil = fy?.locked_until ?? null
  const canManage = can('accounting.period-locks.manage')

  const [lockUntil, setLockUntil] = useState('')
  const [applyOpen, setApplyOpen] = useState(false)
  const [unlockOpen, setUnlockOpen] = useState(false)

  // A13-104 — preload input dengan lock aktif (defer agar tidak cascading render).
  useEffect(() => {
    const timer = window.setTimeout(() => setLockUntil(currentLockUntil ?? ''), 0)
    return () => window.clearTimeout(timer)
  }, [currentLockUntil])

  const handleApply = async (reason?: string) => {
    try {
      await update.mutateAsync({ lock_until: lockUntil || null, override_reason: reason || undefined })
      toast.success('Periode akuntansi berhasil diperbarui.')
      setApplyOpen(false)
    } catch { toast.error('Gagal memperbarui periode lock.') }
  }

  const handleUnlock = async (reason?: string) => {
    try {
      await update.mutateAsync({ lock_until: null, override_reason: reason })
      toast.success('Period lock berhasil dibuka.')
      setUnlockOpen(false)
    } catch { toast.error('Gagal membuka period lock.') }
  }

  if (isLoading) {
    return (
      <FormLayout title="Periode Akuntansi" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Periode Akuntansi' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  // A13-103 — kegagalan status TIDAK dianggap "tidak ada lock".
  if (isError || !fy) {
    return (
      <FormLayout title="Periode Akuntansi" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Periode Akuntansi' }]}>
        <QueryErrorState
          error={error}
          onRetry={() => void refetch()}
          title="Status periode gagal dimuat"
          fallbackMessage="Tidak dapat memastikan status lock periode. Coba lagi sebelum mengubah lock."
        />
      </FormLayout>
    )
  }

  const periods = buildPeriods(fy.start_date, fy.end_date, currentLockUntil)

  return (
    <FormLayout title="Periode Akuntansi" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Periode Akuntansi' }]}>
      <div className="space-y-3">
        {/* A13-105 — konteks fiscal year aktif. */}
        <FormSection title="Tahun Fiskal Aktif">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tahun</span>
            <span className="text-[13px] font-semibold text-[#24323a]">{fy.year}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode</span>
            <span className="text-[13px] text-[#334155]">{formatDate(fy.start_date)} – {formatDate(fy.end_date)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</span>
            <Badge className={cn('w-fit text-[11px]', fy.is_closed ? 'bg-[#F1F5F9] text-[#64748b]' : 'bg-[#D1FAE5] text-[#065F46]')}>
              {fy.is_closed ? 'Ditutup' : 'Terbuka'}
            </Badge>
          </div>
        </FormSection>

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

        {/* A13-105 — daftar status periode bulanan. */}
        {periods.length > 0 && (
          <FormSection title="Status Periode Bulanan">
            <div className="md:col-span-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {periods.map((p) => (
                <div key={p.monthEnd} className="flex items-center justify-between rounded-md border border-[#e2e8f0] px-2.5 py-1.5 text-[12px]">
                  <span className="text-[#334155]">{p.label}</span>
                  <Badge className={cn('text-[10px]', p.isLocked ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#D1FAE5] text-[#065F46]')}>
                    {p.isLocked ? 'Terkunci' : 'Terbuka'}
                  </Badge>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {canManage && (
          <FormSection title="Atur Period Lock">
            <div className="flex flex-col gap-1">
              <Label htmlFor="lock_until" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Lock Sampai Tanggal</Label>
              <Input
                id="lock_until"
                type="date"
                value={lockUntil}
                min={fy.start_date}
                max={fy.end_date}
                onChange={(e) => setLockUntil(e.target.value)}
                className="h-9 text-[13px]"
              />
              <p className="text-[11px] text-[#64748b]">Posting di atau sebelum tanggal ini diblokir. Tanggal dibatasi rentang tahun fiskal aktif.</p>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => setApplyOpen(true)}
                disabled={update.isPending || !lockUntil || lockUntil === (currentLockUntil ?? '')}
                className="h-9 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9c]"
              >
                Terapkan Lock
              </Button>
              {currentLockUntil && (
                <Button variant="outline" onClick={() => setUnlockOpen(true)} disabled={update.isPending} className="h-9 px-4 text-[13px]">
                  Buka Lock
                </Button>
              )}
            </div>
          </FormSection>
        )}
      </div>

      {/* A13-102/093 — konfirmasi + alasan, bukan unlock langsung tanpa alasan. */}
      <ConfirmDialog
        open={applyOpen} onOpenChange={setApplyOpen}
        title="Terapkan Period Lock"
        description={lockUntil ? `Posting hingga ${formatDate(lockUntil)} akan diblokir. Lanjutkan?` : undefined}
        confirmLabel="Terapkan" isLoading={update.isPending}
        requireReason reasonLabel="Alasan perubahan lock"
        onConfirm={(reason) => void handleApply(reason)}
      />
      <ConfirmDialog
        open={unlockOpen} onOpenChange={setUnlockOpen}
        title="Buka Period Lock"
        description="Membuka lock memperbolehkan posting kembali pada periode terkunci. Berikan alasan untuk jejak audit."
        confirmLabel="Buka Lock" variant="destructive" isLoading={update.isPending}
        requireReason reasonLabel="Alasan buka lock"
        onConfirm={(reason) => void handleUnlock(reason)}
      />
    </FormLayout>
  )
}
