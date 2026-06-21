import { useState } from 'react'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiError'
import { fiscalYearApi } from '../services/fiscalYearApi'
import { useFiscalYearStatus, useFiscalYearMutations } from '../hooks/useFiscalYear'
import type { FiscalYearClosingPreview } from '../types/fiscalYear.types'

export default function FiscalYearPage() {
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading, isError, error, refetch } = useFiscalYearStatus()
  const { close, reopen } = useFiscalYearMutations()

  const [preview, setPreview] = useState<FiscalYearClosingPreview['preview'] | null>(null)
  const [blockers, setBlockers] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [previewing, setPreviewing] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)

  const fy = data?.data?.active_fiscal_year
  const isClosed = fy ? (fy.is_closed ?? fy.status === 'closed') : false

  const runPreview = async () => {
    if (!fy?.id) return
    setPreviewing(true)
    setPreview(null); setBlockers([]); setWarnings([])
    try {
      const res = await fiscalYearApi.preview(fy.id)
      setPreview(res.data.preview)
      setWarnings(res.data.warnings ?? res.data.preview?.warnings ?? [])
    } catch (err) {
      // 422 preview = ada blocker; tampilkan, jangan izinkan close.
      setBlockers(Object.values(getApiValidationErrors(err)))
      toast.error(getApiErrorMessage(err, 'Penutupan belum dapat dilanjutkan.'))
    } finally {
      setPreviewing(false)
    }
  }

  const handleClose = async (notes?: string) => {
    if (!fy?.id) return
    try {
      await close.mutateAsync({ id: fy.id, payload: { closing_notes: notes || undefined } })
      toast.success('Tahun fiskal berhasil ditutup.')
      setCloseOpen(false)
      setPreview(null)
    } catch (err) {
      setBlockers(Object.values(getApiValidationErrors(err)))
      toast.error(getApiErrorMessage(err, 'Gagal menutup tahun fiskal.'))
    }
  }

  const handleReopen = async (reason?: string) => {
    if (!fy?.id) return
    try {
      await reopen.mutateAsync({ id: fy.id, payload: { reopen_reason: reason ?? '' } })
      toast.success('Tahun fiskal berhasil dibuka kembali.')
      setReopenOpen(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal membuka kembali tahun fiskal.'))
    }
  }

  if (isLoading) {
    return (
      <FormLayout title="Tahun Fiskal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Tahun Fiskal' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  // A13-113 — status error tidak disamarkan.
  if (isError || !fy) {
    return (
      <FormLayout title="Tahun Fiskal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Tahun Fiskal' }]}>
        <QueryErrorState error={error} onRetry={() => void refetch()} title="Status tahun fiskal gagal dimuat" />
      </FormLayout>
    )
  }

  return (
    <FormLayout title="Tahun Fiskal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Tahun Fiskal' }]}>
      <div className="space-y-3">
        <FormSection title="Tahun Fiskal Aktif">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tahun</span>
            <span className="text-[15px] font-semibold text-[#334155]">{fy.year}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode</span>
            <span className="text-[13px] text-[#334155]">{formatDate(fy.start_date)} – {formatDate(fy.end_date)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</span>
            <Badge className={cn('w-fit text-[11px]', isClosed ? 'bg-[#F1F5F9] text-[#64748b]' : 'bg-[#D1FAE5] text-[#065F46]')}>
              {isClosed ? 'Ditutup' : 'Terbuka'}
            </Badge>
          </div>
          {fy.closed_at && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Ditutup Pada</span>
              <span className="text-[13px] text-[#334155]">{formatDate(fy.closed_at)}</span>
            </div>
          )}
        </FormSection>

        {!isClosed && can('fiscal_year.view') && (
          <FormSection title="Tutup Tahun Fiskal">
            <div className="md:col-span-2 space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
                ⚠ Menutup tahun fiskal mengunci seluruh periode tahun ini dan membuat jurnal penutup otomatis. Jalankan pratinjau terlebih dahulu.
              </div>

              {/* A13-108 — pratinjau wajib sebelum close. */}
              <Button onClick={() => void runPreview()} disabled={previewing} variant="outline" className="h-9 text-[13px]">
                {previewing ? 'Memuat pratinjau...' : 'Jalankan Pratinjau Penutupan'}
              </Button>

              {/* A13-113 — blocker & warning ditampilkan. */}
              {blockers.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
                  <p className="font-semibold">Penutupan diblokir:</p>
                  <ul className="mt-1 list-inside list-disc">{blockers.map((b, i) => <li key={i}>{b}</li>)}</ul>
                </div>
              )}

              {preview && (
                <div className="space-y-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
                  <div className="flex justify-between"><span className="text-[#64748b]">Laba/Rugi Bersih</span><span className="tabular-nums font-medium">{formatCurrency(preview.net_profit_loss)}</span></div>
                  <div className="flex justify-between"><span className="text-[#64748b]">Jumlah Jurnal</span><span className="tabular-nums font-medium">{preview.journal_count}</span></div>
                  <div className="flex justify-between border-t border-[#e2e8f0] pt-1">
                    <span className="font-semibold text-[#334155]">Status</span>
                    <span className={cn('font-semibold', preview.can_close ? 'text-green-700' : 'text-red-600')}>{preview.can_close ? 'Siap ditutup' : 'Belum dapat ditutup'}</span>
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-700">
                  <p className="font-semibold">Peringatan:</p>
                  <ul className="list-inside list-disc">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}

              {/* A13-110 — gating khusus close. A13-112 — konfirmasi destruktif. */}
              {can('fiscal_year.close') && (
                <Button
                  onClick={() => setCloseOpen(true)}
                  disabled={close.isPending || !preview?.can_close}
                  className="h-9 bg-red-600 px-4 text-[13px] hover:bg-red-700 disabled:opacity-40"
                >
                  Tutup Tahun Fiskal {fy.year}
                </Button>
              )}
            </div>
          </FormSection>
        )}

        {isClosed && can('fiscal_year.reopen') && (
          <FormSection title="Buka Kembali Tahun Fiskal">
            <div className="md:col-span-2">
              <Button onClick={() => setReopenOpen(true)} disabled={reopen.isPending} className="h-9 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9c]">
                Buka Kembali Tahun Fiskal
              </Button>
            </div>
          </FormSection>
        )}
      </div>

      <ConfirmDialog
        open={closeOpen} onOpenChange={setCloseOpen}
        title={`Tutup Tahun Fiskal ${fy.year}`}
        description="Seluruh periode tahun ini akan dikunci dan jurnal penutup dibuat. Tindakan ini sulit dibatalkan."
        confirmLabel="Tutup Tahun Fiskal" variant="destructive" isLoading={close.isPending}
        requireReason reasonLabel="Catatan penutupan" reasonPlaceholder="Catatan penutupan (untuk jejak audit)..."
        onConfirm={(notes) => void handleClose(notes)}
      />
      <ConfirmDialog
        open={reopenOpen} onOpenChange={setReopenOpen}
        title="Buka Kembali Tahun Fiskal"
        description="Membuka kembali tahun fiskal membalik penutupan agar dapat dikoreksi. Berikan alasan untuk jejak audit."
        confirmLabel="Buka Kembali" isLoading={reopen.isPending}
        requireReason reasonLabel="Alasan reopen"
        onConfirm={(reason) => void handleReopen(reason)}
      />
    </FormLayout>
  )
}
