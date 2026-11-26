import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { usePermission } from '@/hooks/usePermission'
import { useRecordTab } from '@/hooks/useRecordTab'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import {
  disbursementAmount, disbursementPermissions, kindLabels, stateLabels, trancheStateLabels, workspaceDisbursementApi,
  type Tranche, type WorkspaceDisbursement,
} from '../services/workspaceDisbursementApi'
import { FORM_ID, NoteForm, QcApproveForm, SettlementForm, TrancheForm } from './workspace-disbursement/TrancheForms'

type Action = 'create' | 'edit' | 'cancel' | 'approve' | 'reject' | 'reopen' | 'settle' | 'unsettle'
const actionLabel: Record<Action, string> = {
  create: 'Simpan tahap', edit: 'Simpan koreksi', cancel: 'Batalkan tahap', approve: 'Setujui QC', reject: 'Kembalikan QC',
  reopen: 'Buka kembali QC', settle: 'Selesaikan dana muka', unsettle: 'Batalkan penyelesaian',
}
const eventLabel: Record<string, string> = {
  record_tranche: 'Tahap dicatat', record_disbursement: 'Tahap dikoreksi', cancel_tranche: 'Tahap dibatalkan',
  approve_qc: 'QC disetujui', reject_qc: 'QC dikembalikan', reopen_qc: 'QC dibuka kembali',
  settle_advance: 'Dana muka diselesaikan', cancel_settlement: 'Penyelesaian dibatalkan', close_activity: 'Kegiatan diselesaikan di Workspace',
}

export function WorkspaceDisbursementDetail({ row, onChange, onClose }: {
  row: WorkspaceDisbursement
  onChange: (data: WorkspaceDisbursement) => void
  onClose: () => void
}) {
  const { can } = usePermission()
  const { openRecordTab } = useRecordTab()
  const [selectedId, setSelectedId] = useState<number | undefined>(row.tranches.find((tranche) => tranche.state !== 'cancelled' && tranche.state !== 'complete')?.id)
  const [action, setAction] = useState<Action>()
  const selected = row.tranches.find((tranche) => tranche.id === selectedId)
  const closed = row.closed_at !== null
  const canRecord = can(disbursementPermissions.record) && !closed
  const canReview = can(disbursementPermissions.review)
  const remaining = row.source_lines.reduce((sum, line) => sum + line.remaining_minor, 0)

  const mutation = useMutation({
    mutationFn: (call: () => Promise<{ data: WorkspaceDisbursement }>) => call(),
    onSuccess: ({ data }) => {
      setAction(undefined)
      if (action === 'create') setSelectedId(data.tranches[data.tranches.length - 1]?.id)
      onChange(data)
    },
  })
  const run = (call: () => Promise<{ data: WorkspaceDisbursement }>) => mutation.mutate(call)
  const choose = (next?: Action) => { mutation.reset(); setAction(next) }
  const tranche = selected!

  const form = () => {
    switch (action) {
      case 'create': return <TrancheForm row={row} onSubmit={(input) => run(() => workspaceDisbursementApi.createTranche(row.id, input))} />
      case 'edit': return <TrancheForm row={row} tranche={tranche} onSubmit={(input) => run(() => workspaceDisbursementApi.updateTranche(row.id, tranche.id, input))} />
      case 'approve': return <QcApproveForm row={row} tranche={tranche} onSubmit={(input) => run(() => workspaceDisbursementApi.review(row.id, tranche.id, 'approve', input))} />
      case 'settle': return <SettlementForm row={row} tranche={tranche} onSubmit={(input) => run(() => workspaceDisbursementApi.settle(row.id, tranche.id, input))} />
      case 'reject': return <NoteForm label="Alasan" onSubmit={(note) => run(() => workspaceDisbursementApi.review(row.id, tranche.id, 'reject', { note }))} />
      case 'reopen': return <NoteForm label="Alasan" hint={tranche.cash_payment?.status === 'void' ? 'Kas keluar void tetap tersimpan. Persetujuan QC berikutnya membuat draf baru.' : 'Draf kas keluar tahap ini akan dihapus.'}
        onSubmit={(note) => run(() => workspaceDisbursementApi.review(row.id, tranche.id, 'reopen', { note }))} />
      case 'cancel': return <NoteForm label="Alasan pembatalan" hint="Tahap yang dibatalkan tidak dihitung dalam batas pencairan dan tetap tercatat di riwayat."
        onSubmit={(note) => run(() => workspaceDisbursementApi.cancelTranche(row.id, tranche.id, note))} />
      case 'unsettle': return <NoteForm label="Alasan" hint="Jurnal penyelesaian akan di-void dan dana muka kembali menunggu penyelesaian."
        onSubmit={(note) => run(() => workspaceDisbursementApi.cancelSettlement(row.id, tranche.id, note))} />
      default: return null
    }
  }

  const trancheActions = (item: Tranche) => {
    const actions: { action?: Action; label: string; primary?: boolean; onClick?: () => void }[] = []
    const editable = item.state === 'awaiting_qc' || item.state === 'returned'
    if (editable && canRecord) actions.push({ action: 'edit', label: 'Koreksi' }, { action: 'cancel', label: 'Batalkan tahap' })
    if (editable && canReview) actions.push({ action: 'reject', label: 'Kembalikan QC' }, { action: 'approve', label: 'Periksa dan setujui', primary: true })
    if ((item.state === 'awaiting_posting' || item.state === 'payment_void') && canReview && !closed) actions.push({ action: 'reopen', label: 'Buka kembali QC' })
    if (item.state === 'awaiting_settlement' && canReview) actions.push({ action: 'settle', label: 'Selesaikan dana muka', primary: true })
    if (item.state === 'complete' && item.kind === 'advance' && canReview && !closed) actions.push({ action: 'unsettle', label: 'Batalkan penyelesaian' })
    if (item.cash_payment && can('cash_bank.payments.view')) {
      actions.push({ label: 'Buka kas keluar', primary: item.state === 'awaiting_posting', onClick: () => {
        onClose()
        openRecordTab({ label: item.cash_payment!.payment_number, path: '/cash-bank/cash-payments/' + item.cash_payment!.id })
      } })
    }
    return actions
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="min-h-0 space-y-3 overflow-y-auto px-4 py-3">
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div><dt className="text-muted-foreground">RAB Workspace</dt><dd>#{row.workspace_document_id} · v{row.source_version}</dd></div>
          <div><dt className="text-muted-foreground">Unit</dt><dd>{row.unit_name}</dd></div>
          <div><dt className="text-muted-foreground">Tanggal kegiatan</dt><dd>{formatDate(row.activity_date)}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{stateLabels[row.state]}</dd></div>
          <div><dt className="text-muted-foreground">RAB disetujui</dt><dd className="tabular-nums">{disbursementAmount(row.amount_minor)}</dd></div>
          <div><dt className="text-muted-foreground">Dicairkan</dt><dd className="tabular-nums">{disbursementAmount(row.disbursed_minor)}</dd></div>
          <div><dt className="text-muted-foreground">Biaya posted</dt><dd className="tabular-nums">{disbursementAmount(row.realized_minor)}</dd></div>
          <div><dt className="text-muted-foreground">Dikembalikan</dt><dd className="tabular-nums">{disbursementAmount(row.refund_minor)}</dd></div>
        </dl>
        {closed && <p role="status" className="rounded-md border border-border px-3 py-2 text-sm">Kegiatan sudah diselesaikan di Workspace. Tahap baru tidak dapat dicatat.</p>}

        {action ? (
          <section aria-label={actionLabel[action]} className="space-y-2">
            <h3 className="text-sm font-semibold">{action === 'create' ? 'Tahap baru' : actionLabel[action] + ' · tahap ' + tranche.sequence}</h3>
            {form()}
          </section>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="min-w-full text-sm">
                <caption className="sr-only">Baris RAB dan sisa yang bisa dicairkan</caption>
                <thead><tr className="bg-muted text-left text-xs uppercase text-muted-foreground">
                  <th scope="col" className="px-3 py-2">Pos</th><th scope="col" className="px-3 py-2">Rincian</th>
                  <th scope="col" className="px-3 py-2 text-right">RAB</th><th scope="col" className="px-3 py-2 text-right">Sudah dicairkan</th><th scope="col" className="px-3 py-2 text-right">Sisa</th>
                </tr></thead>
                <tbody>{row.source_lines.map((line) => (
                  <tr key={line.id} className="border-t border-border">
                    <td className="px-3 py-2">{line.budget_code}</td><td className="px-3 py-2">{line.description}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{disbursementAmount(line.amount_minor)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{disbursementAmount(line.allocated_minor)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{disbursementAmount(line.remaining_minor)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Tahap pencairan</h3>
              {canRecord && remaining > 0 && <Button type="button" size="sm" onClick={() => choose('create')}>Catat pencairan</Button>}
            </div>
            {row.tranches.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pencairan. Catat setelah dana dikeluarkan.</p> : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="min-w-full text-sm">
                  <caption className="sr-only">Tahap pencairan</caption>
                  <thead><tr className="bg-muted text-left text-xs uppercase text-muted-foreground">
                    <th scope="col" className="px-3 py-2">Tahap</th><th scope="col" className="px-3 py-2">Jenis</th><th scope="col" className="px-3 py-2">Tanggal</th>
                    <th scope="col" className="px-3 py-2 text-right">Nominal</th><th scope="col" className="px-3 py-2">Status</th><th scope="col" className="px-3 py-2">Dokumen</th>
                  </tr></thead>
                  <tbody>{row.tranches.map((item) => (
                    <tr key={item.id} aria-selected={item.id === selectedId} className={'border-t border-border ' + (item.id === selectedId ? 'bg-[#eef6f8]' : '')}>
                      <td className="px-3 py-2"><Button type="button" variant="link" className="h-auto p-0" onClick={() => setSelectedId(item.id)}>Tahap {item.sequence}</Button></td>
                      <td className="px-3 py-2">{kindLabels[item.kind]}</td>
                      <td className="px-3 py-2">{formatDate(item.disbursed_on)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{disbursementAmount(item.amount_minor)}</td>
                      <td className="px-3 py-2">{trancheStateLabels[item.state]}</td>
                      <td className="px-3 py-2 text-xs">{[item.cash_payment?.payment_number, item.settlement_journal?.journal_number].filter(Boolean).join(' · ') || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {selected && (
              <section aria-label={'Tahap ' + selected.sequence} className="space-y-2 rounded-md border border-border p-3 text-sm">
                <h3 className="font-semibold">Tahap {selected.sequence} · {kindLabels[selected.kind]} · {trancheStateLabels[selected.state]}</h3>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div><dt className="text-muted-foreground">Referensi</dt><dd>{selected.payment_reference}</dd></div>
                  <div><dt className="text-muted-foreground">Kas/bank</dt><dd>{selected.cash_bank_account?.account_name ?? '—'}</dd></div>
                  {selected.advance_account && <div><dt className="text-muted-foreground">Akun uang muka</dt><dd>{selected.advance_account.account_code} · {selected.advance_account.account_name}</dd></div>}
                  {selected.journal && <div><dt className="text-muted-foreground">Jurnal kas keluar</dt><dd>{selected.journal.journal_number}</dd></div>}
                  {selected.settled_on && <div><dt className="text-muted-foreground">Diselesaikan</dt><dd>{formatDate(selected.settled_on)} · kembali {disbursementAmount(selected.refund_minor)}</dd></div>}
                </dl>
                {selected.qc_note && <p className="whitespace-pre-wrap break-words">{selected.qc_note}</p>}
                {selected.state === 'returned' && <p role="status" className="text-muted-foreground">QC dikembalikan. Koreksi tahap ini untuk mengirimnya lagi ke antrean QC.</p>}
                {selected.state === 'payment_void' && <p role="status" className="text-muted-foreground">Kas keluar tahap ini dibatalkan. Buka kembali QC untuk membuat draf baru.</p>}
                {selected.state === 'awaiting_settlement' && <p role="status" className="text-muted-foreground">Dana muka sudah keluar. Selesaikan dengan biaya terverifikasi dan pengembalian sisa.</p>}
                <div className="flex flex-wrap gap-2">
                  {trancheActions(selected).map((item) => (
                    <Button key={item.label} type="button" size="sm" variant={item.primary ? 'default' : 'outline'} onClick={item.onClick ?? (() => choose(item.action))}>{item.label}</Button>
                  ))}
                </div>
              </section>
            )}

            {row.history.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Riwayat pencairan dan QC</summary>
                <ol className="space-y-1 pt-2">{row.history.map((event, index) => (
                  <li key={event.action + index}>{formatDate(event.created_at)} · {eventLabel[event.action] ?? event.action}
                    {event.details.tranche ? ' · tahap ' + event.details.tranche : ''} · Pengguna #{event.user_id}
                    {event.details.note && <span className="block text-muted-foreground">{event.details.note}</span>}
                  </li>
                ))}</ol>
              </details>
            )}
          </>
        )}
        {mutation.error && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(mutation.error, 'Tindakan gagal disimpan.')}</p>}
      </div>
      <DialogFooter className="shrink-0 flex-wrap gap-2 border-t border-border px-4 py-3">
        {action ? (
          <>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => choose()}>Kembali</Button>
            <Button type="submit" form={FORM_ID} disabled={mutation.isPending}>{actionLabel[action]}</Button>
          </>
        ) : <Button type="button" variant="outline" onClick={onClose}>Tutup</Button>}
      </DialogFooter>
    </div>
  )
}
