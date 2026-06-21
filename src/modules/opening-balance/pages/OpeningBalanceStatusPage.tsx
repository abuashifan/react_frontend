import { useNavigate } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, cn } from '@/lib/utils'
import { useOBStatus, useOBMutations } from '../hooks/useOpeningBalance'
import { OB_STATUS_BADGE } from '../obStatusBadge'

const STATUS_BADGE = OB_STATUS_BADGE

export default function OpeningBalanceStatusPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data, isLoading, isError, error, refetch } = useOBStatus()
  const { createBatch } = useOBMutations()

  const status = data?.data
  const batch = status?.batch ?? null

  const handleStart = async () => {
    try {
      const res = await createBatch.mutateAsync({ opening_date: new Date().toISOString().slice(0, 10) })
      toast.success('Batch saldo awal dibuat.')
      navigate(`/opening-balance/${res.data.id}`)
    } catch { toast.error('Gagal membuat batch saldo awal.') }
  }

  if (isLoading) {
    return (
      <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
      </WorkspaceLayout>
    )
  }

  // A13-085 — kegagalan status TIDAK disamarkan sebagai "belum ada saldo awal".
  if (isError) {
    return (
      <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal' }]}>
        <div className="max-w-2xl">
          <QueryErrorState
            error={error}
            onRetry={() => void refetch()}
            title="Status saldo awal gagal dimuat"
            fallbackMessage="Tidak dapat memastikan status saldo awal. Coba lagi sebelum memulai input."
          />
        </div>
      </WorkspaceLayout>
    )
  }

  const hasBatch = !!batch && status?.status !== 'not_started'
  const badge = batch ? STATUS_BADGE[batch.status] : null

  return (
    <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal' }]}>
      <div className="max-w-2xl">
        {!hasBatch ? (
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-8 text-center">
            <p className="text-[14px] font-semibold text-[#24323a]">Belum ada saldo awal</p>
            <p className="mt-1 text-[13px] text-[#64748b]">Mulai input saldo awal untuk menetapkan posisi keuangan awal perusahaan.</p>
            <PermissionGuard permission="opening_balance.manage" fallback={null}>
              <Button type="button" onClick={() => void handleStart()} disabled={createBatch.isPending} className="mt-4 h-9 bg-[#e39774] px-6 text-[13px] hover:bg-[#d4845e]">
                {createBatch.isPending ? 'Membuat...' : 'Mulai Input Saldo Awal'}
              </Button>
            </PermissionGuard>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-[#e2e8f0] bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#24323a]">{batch.batch_number}</p>
                <p className="text-[11px] text-[#64748b]">Tanggal: {batch.opening_date}</p>
              </div>
              {badge && <Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', badge.className)}>{badge.label}</Badge>}
            </div>

            <div className="space-y-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
              <div className="flex justify-between"><span className="text-[#64748b]">Total Debit</span><span className="tabular-nums font-medium">{formatCurrency(batch.total_debit)}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Total Kredit</span><span className="tabular-nums font-medium">{formatCurrency(batch.total_credit)}</span></div>
              <div className="flex justify-between border-t border-[#e2e8f0] pt-1">
                <span className="font-semibold text-[#334155]">Selisih</span>
                <span className={cn('tabular-nums font-semibold', Math.abs(batch.difference) < 0.01 ? 'text-green-700' : 'text-red-600')}>{formatCurrency(batch.difference)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => navigate(`/opening-balance/${batch.id}`)} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">
                {batch.status === 'draft' ? 'Lanjutkan Input' : 'Lihat Detail'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
