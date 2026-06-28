import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { cn, formatDate } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiError'
import { usePeriodEndChecklist, usePeriodEndMutations, usePeriodEndStatus } from '../hooks/usePeriodEnd'
import type { PeriodEndChecklistItem, PeriodEndIssue, PeriodEndStatusCode } from '../services/periodEndApi'

const STATUS_LABEL: Record<PeriodEndStatusCode, string> = {
  not_started: 'Belum Diproses',
  draft: 'Draft',
  running: 'Berjalan',
  completed: 'Selesai',
  failed: 'Gagal',
  reopened: 'Dibuka Kembali',
}

const CHECKLIST_LABEL: Record<string, string> = {
  unposted_journals: 'Jurnal belum diposting',
  open_documents: 'Dokumen transaksi terbuka',
  inventory_closing: 'Penutupan persediaan',
  fixed_asset_depreciation: 'Depresiasi aktiva tetap',
  exchange_revaluation: 'Revaluasi kurs',
  tax_review: 'Pemeriksaan pajak',
}

function currentPeriod(timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
    })
    const parts = formatter.formatToParts(new Date())
    const year = parts.find((part) => part.type === 'year')?.value
    const month = parts.find((part) => part.type === 'month')?.value
    return year && month ? `${year}-${month}` : new Date().toISOString().slice(0, 7)
  } catch {
    return new Date().toISOString().slice(0, 7)
  }
}

function statusClass(status: PeriodEndStatusCode) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'failed') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'running') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === 'reopened') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-[#d9e2e5] bg-white text-[#64748b]'
}

function checklistIcon(item: PeriodEndChecklistItem) {
  if (item.status === 'ok' || item.status === 'passed' || item.status === 'ready' || item.status === 'idempotent' || item.status === 'not_applicable') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  }
  if (item.status === 'error' || item.status === 'blocking' || item.blocking) return <XCircle className="h-4 w-4 text-red-600" />
  if (item.status === 'warning' || item.status === 'pending' || item.status === 'zero_lines') return <AlertTriangle className="h-4 w-4 text-amber-600" />
  return <Loader2 className="h-4 w-4 text-[#64748b]" />
}

function issueText(issue: PeriodEndIssue | string) {
  return typeof issue === 'string' ? issue : issue.message
}

export default function PeriodEndPage() {
  const { toast } = useToast()
  const timezone = useCompanyStore((state) => state.activeCompany?.settings?.timezone ?? 'Asia/Jakarta')
  const [period, setPeriod] = useState(() => currentPeriod(timezone))
  const [reopenOpen, setReopenOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState('')
  const [runConfirmOpen, setRunConfirmOpen] = useState(false)

  const statusQuery = usePeriodEndStatus(period)
  const checklistQuery = usePeriodEndChecklist(period)
  const mutations = usePeriodEndMutations(period)
  const status = statusQuery.data?.data
  const checklist = checklistQuery.data?.data ?? status?.checklist ?? null
  const checklistItems = useMemo(() => checklist?.items ?? [], [checklist?.items])
  const queryError = statusQuery.error ?? checklistQuery.error

  useEffect(() => {
    setPeriod(currentPeriod(timezone))
  }, [timezone])

  const handleRun = async () => {
    try {
      await mutations.run.mutateAsync()
      toast.success('Proses akhir periode dijalankan.')
      setRunConfirmOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menjalankan akhir periode.'))
    }
  }

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      toast.error('Alasan reopen wajib diisi.')
      return
    }
    try {
      await mutations.reopen.mutateAsync(reopenReason.trim())
      toast.success('Periode berhasil dibuka kembali.')
      setReopenOpen(false)
      setReopenReason('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membuka kembali periode.'))
    }
  }

  const handleRetry = () => {
    void Promise.all([statusQuery.refetch(), checklistQuery.refetch()])
  }

  return (
    <>
      <WorkspaceLayout
        title="Proses Akhir Periode"
        breadcrumb={[{ label: 'Akuntansi' }, { label: 'Proses Akhir Periode' }]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="period-end-period" className="sr-only">Periode akhir</Label>
            <Input
              id="period-end-period"
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-8 w-[150px] text-[13px] tabular-nums"
            />
            {status?.can_run ? (
              <PermissionGuard permission="period_end.run">
                <Button
                  type="button"
                  onClick={() => setRunConfirmOpen(true)}
                  disabled={mutations.run.isPending}
                  className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]"
                >
                  Jalankan
                </Button>
              </PermissionGuard>
            ) : null}
            {status?.can_reopen ? (
              <PermissionGuard permission="period_end.reopen">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReopenOpen(true)}
                  disabled={mutations.reopen.isPending}
                  className="h-8 px-3 text-[13px]"
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reopen
                </Button>
              </PermissionGuard>
            ) : null}
          </div>
        }
      >
        <div className="space-y-4">
          {queryError ? (
            <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="text-[13px] font-semibold">Akhir periode tidak dapat dimuat</p>
              <p className="mt-1 text-[13px]">{getApiErrorMessage(queryError, 'Gagal memuat status/checklist akhir periode.')}</p>
              <Button type="button" variant="outline" className="mt-3 h-8 text-[13px]" onClick={handleRetry}>
                Muat ulang
              </Button>
            </section>
          ) : null}

          <section className="rounded-lg border border-[#d9e2e5] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode</p>
                <h2 className="mt-1 text-[20px] font-semibold tabular-nums text-[#24323a]">{period}</h2>
              </div>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[12px] font-semibold',
                  statusClass(status?.status ?? 'not_started'),
                )}
              >
                {STATUS_LABEL[status?.status ?? 'not_started']}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Bisa Dijalankan</p>
                <p className="mt-1 text-[13px] font-medium text-[#24323a]">{status?.can_run ? 'Ya' : 'Tidak'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Bisa Reopen</p>
                <p className="mt-1 text-[13px] font-medium text-[#24323a]">{status?.can_reopen ? 'Ya' : 'Tidak'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Selesai Pada</p>
                <p className="mt-1 text-[13px] font-medium tabular-nums text-[#24323a]">
                  {status?.run?.completed_at ? formatDate(status.run.completed_at, 'long') : '-'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[#d9e2e5] bg-white">
            <div className="border-b border-[#d9e2e5] px-4 py-3">
              <h3 className="text-[13px] font-semibold text-[#24323a]">Checklist</h3>
            </div>
            <div className="divide-y divide-[#f1f5f9]">
              {checklistQuery.isLoading ? (
                <div className="px-4 py-6 text-center text-[13px] text-[#64748b]">Memuat checklist...</div>
              ) : checklistQuery.isError ? (
                <div className="px-4 py-6 text-center text-[13px] text-red-700">
                  Gagal memuat checklist akhir periode.
                </div>
              ) : checklistItems.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-[#64748b]">Belum ada checklist untuk periode ini.</div>
              ) : (
                checklistItems.map((item) => (
                  <div key={item.key} className="flex items-start gap-3 px-4 py-3">
                    {checklistIcon(item)}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#24323a]">
                        {item.label ?? CHECKLIST_LABEL[item.key] ?? item.key}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#64748b]">
                        {item.message ?? (item.status === 'ok' ? 'Siap diproses.' : 'Perlu ditinjau.')}
                      </p>
                    </div>
                    {typeof item.count === 'number' && (
                      <span className="tabular-nums text-[12px] font-semibold text-[#64748b]">{item.count}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {(checklist?.blocking_errors.length || checklist?.warnings.length) ? (
            <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-[12px] font-semibold text-red-700">Blocking Error</p>
                <ul className="mt-2 space-y-1 text-[12px] text-red-700">
                  {(checklist?.blocking_errors ?? []).map((item) => <li key={item.code}>{issueText(item)}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[12px] font-semibold text-amber-700">Peringatan</p>
                <ul className="mt-2 space-y-1 text-[12px] text-amber-700">
                  {(checklist?.warnings ?? []).map((item) => <li key={item.code}>{issueText(item)}</li>)}
                </ul>
              </div>
            </section>
          ) : null}
        </div>
      </WorkspaceLayout>

      <ConfirmDialog
        isOpen={runConfirmOpen}
        onClose={() => setRunConfirmOpen(false)}
        onConfirm={() => {
          setRunConfirmOpen(false)
          void handleRun()
        }}
        title="Jalankan Akhir Periode"
        description={`Proses akan menjalankan routine akhir periode untuk ${period}. Pastikan checklist tidak memiliki blocking error.`}
        confirmLabel="Jalankan"
        loadingLabel="Memproses..."
        isLoading={mutations.run.isPending}
      />

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Buka Kembali Periode</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">Buka kembali periode akuntansi yang sudah ditutup. Tindakan ini tercatat di audit trail.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Alasan <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              rows={3}
              className="resize-none text-[13px]"
              placeholder="Alasan membuka kembali periode..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => setReopenOpen(false)}>Batal</Button>
            <Button type="button" className="h-8 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9c]" disabled={mutations.reopen.isPending} onClick={() => void handleReopen()}>
              {mutations.reopen.isPending ? 'Memproses...' : 'Reopen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
