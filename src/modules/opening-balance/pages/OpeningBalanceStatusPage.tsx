import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, cn } from '@/lib/utils'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { useImportPresetStore } from '@/modules/imports/stores/useImportPresetStore'
import { useOBStatus, useOBMutations } from '../hooks/useOpeningBalance'
import type { OBBatchStatus } from '../types/openingBalance.types'
import { getApiErrorMessage } from '@/lib/apiError'

const STATUS_BADGE: Record<OBBatchStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]' },
  reopened: { label: 'Dibuka Kembali', className: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]' },
  validated: { label: 'Tervalidasi', className: 'bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE]' },
  posted: { label: 'Diposting', className: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]' },
  locked: { label: 'Dikunci', className: 'bg-[#E0E7FF] text-[#3730A3] hover:bg-[#E0E7FF]' },
  voided: { label: 'Dibatalkan', className: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]' },
}

export default function OpeningBalanceStatusPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data, isLoading } = useOBStatus()
  const { createBatch } = useOBMutations()
  const openTab = useOpenPrimaryTab()

  /**
   * Halaman impor hidup di modul Master Data, jadi tab primernya didaftarkan
   * dulu -- AppShell mengarahkan router ke tab aktif saat mount, sehingga
   * navigate() telanjang akan dipantulkan balik. Pola yang sama dipakai
   * Step5OpeningBalance saat membuka halaman ini.
   */
  const openImport = (profile: string) => {
    useImportPresetStore.getState().requestProfile(profile)
    openTab({
      id: 'master-data-import',
      menuKey: 'import',
      label: 'Impor Data',
      module: 'master-data',
      path: '/master-data/import',
    })
  }

  const status = data?.data
  const batch = status?.batch ?? null

  const handleStart = async () => {
    try {
      const res = await createBatch.mutateAsync({ opening_date: new Date().toISOString().slice(0, 10) })
      toast.success('Batch saldo awal dibuat.')
      navigate(`/opening-balance/${res.data.id}`)
    } catch (startError) { toast.error(getApiErrorMessage(startError, 'Gagal membuat batch saldo awal.')) }
  }

  if (isLoading) {
    return (
      <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
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
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button type="button" onClick={() => void handleStart()} disabled={createBatch.isPending} className="h-9 bg-[#e39774] px-6 text-[13px] hover:bg-[#d4845e]">
                  {createBatch.isPending ? 'Membuat...' : 'Mulai Input Saldo Awal'}
                </Button>
                <Button type="button" variant="outline" className="h-9 gap-1.5 px-5 text-[13px]" onClick={() => openImport('opening_balance')}>
                  <Upload className="h-3.5 w-3.5" /> Impor dari Berkas
                </Button>
              </div>
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
                {batch.status === 'draft' || batch.status === 'reopened' ? 'Lanjutkan Input' : 'Lihat Detail'}
              </Button>
              {/* Impor hanya mungkin selama batch masih bisa diubah — backend
                  menolaknya begitu diposting/dikunci. */}
              {(batch.status === 'draft' || batch.status === 'reopened') && (
                <PermissionGuard permission="opening_balance.manage" fallback={null}>
                  <Button type="button" variant="outline" className="h-9 gap-1.5 px-5 text-[13px]" onClick={() => openImport('opening_balance')}>
                    <Upload className="h-3.5 w-3.5" /> Impor dari Berkas
                  </Button>
                </PermissionGuard>
              )}
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
