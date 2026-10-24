import { useState } from 'react'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime } from '@/lib/utils'
import { useDocumentHistory } from '../hooks/useDocumentHistory'
import type { DocumentHistoryEntry, DocumentHistoryLabels, DocumentSnapshot } from '../services/documentHistoryApi'

/** Izin melihat riwayat edit. User tanpa izin ini tidak melihat tombolnya sama sekali. */
export const DOCUMENT_HISTORY_PERMISSION = 'audit.document_history.view'

interface DocumentHistoryButtonProps {
  /** Jenis dokumen di backend (snake_case nama model), mis. `sales_invoice`. */
  documentType: string
  /** Id dokumen dari URL; `new`/kosong = form buat baru, tombol tidak tampil. */
  documentId?: string
}

/**
 * Tombol "Riwayat Edit" + dialog isi dokumen sebelum/sesudah tiap edit.
 * Riwayat dicatat otomatis oleh backend tanpa tindakan user; tombol ini hanya
 * muncul untuk peran dengan izin `audit.document_history.view`. Hanya baca --
 * sengaja tidak ada restore.
 */
export function DocumentHistoryButton({ documentType, documentId }: DocumentHistoryButtonProps) {
  const { can } = usePermission()
  const [isOpen, setOpen] = useState(false)
  const id = Number(documentId)
  const enabled = can(DOCUMENT_HISTORY_PERMISSION) && Number.isInteger(id) && id > 0

  const { data, isLoading } = useDocumentHistory(documentType, id, enabled && isOpen)

  if (!enabled) return null

  const entries = data?.entries ?? []
  const labels = data?.labels ?? {}

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => setOpen(true)}>
        <History className="h-3.5 w-3.5" />
        Riwayat Edit
      </Button>
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Riwayat Edit</DialogTitle>
            <DialogDescription>Isi dokumen sebelum dan sesudah tiap edit, terbaru di atas.</DialogDescription>
          </DialogHeader>
          {isLoading && <p className="text-[13px] text-[#64748b]">Memuat riwayat...</p>}
          {!isLoading && entries.length === 0 && (
            <p className="text-[13px] text-[#64748b]">Belum ada edit sejak dokumen ini disimpan final.</p>
          )}
          <div className="space-y-3">
            {entries.map((entry) => (
              <HistoryEntryCard key={entry.id} entry={entry} labels={labels} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function HistoryEntryCard({ entry, labels }: { entry: DocumentHistoryEntry; labels: DocumentHistoryLabels }) {
  const headerChanges = diffRow(headerOf(entry.before), headerOf(entry.after))
  const lineChanges = diffLines(entry.before?.lines ?? [], entry.after?.lines ?? [])

  return (
    <div className="rounded-md border border-[#e2e8f0] p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold text-[#0f172a]">
          Edit ke-{Math.max(1, entry.version - 1)}
          {entry.document_number ? <span className="ml-2 font-normal text-[#64748b]">{entry.document_number}</span> : null}
        </p>
        <p className="text-[12px] text-[#64748b]">
          {entry.edited_by_name ?? 'Pengguna tidak dikenal'} · {formatDateTime(entry.edited_at)}
        </p>
      </div>

      {headerChanges.length === 0 && lineChanges.length === 0 && (
        <p className="text-[12px] text-[#64748b]">Tidak ada perubahan isi yang terbaca.</p>
      )}

      {headerChanges.length > 0 && (
        <ChangeTable rows={headerChanges.map((c) => ({ label: fieldLabel(c.field), before: display(c.field, c.before, labels), after: display(c.field, c.after, labels) }))} />
      )}

      {lineChanges.map((line) => (
        <div key={line.index} className="mt-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Baris {line.index + 1}
            {line.kind === 'added' ? ' (ditambah)' : line.kind === 'removed' ? ' (dihapus)' : ''}
          </p>
          <ChangeTable rows={line.changes.map((c) => ({ label: fieldLabel(c.field), before: display(c.field, c.before, labels), after: display(c.field, c.after, labels) }))} />
        </div>
      ))}
    </div>
  )
}

function ChangeTable({ rows }: { rows: { label: string; before: string; after: string }[] }) {
  return (
    <table className="w-full table-fixed text-[12px] tabular-nums">
      <thead>
        <tr className="text-left text-[#64748b]">
          <th className="w-1/4 pb-1 font-medium">Kolom</th>
          <th className="pb-1 font-medium">Sebelum</th>
          <th className="pb-1 font-medium">Sesudah</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-t border-[#f1f5f9] align-top">
            <td className="py-1 pr-2 text-[#334155]">{row.label}</td>
            <td className="break-words py-1 pr-2 text-[#b91c1c]">{row.before}</td>
            <td className="break-words py-1 text-[#15803d]">{row.after}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type Row = Record<string, unknown>
type FieldChange = { field: string; before: unknown; after: unknown }

/** Kolom teknis yang tidak berarti bagi pembaca riwayat. */
const HIDDEN_FIELDS = new Set(['id', 'company_id', 'created_by', 'deleted_by', 'source_batch_id', 'line_order', 'sort_order'])

function headerOf(snapshot?: DocumentSnapshot | null): Row {
  // Riwayat jurnal lama memakai kunci `journal`, bukan `header`.
  return (snapshot?.header ?? snapshot?.journal ?? {}) as Row
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null || a === '' || b === '') return (a ?? '') === (b ?? '')
  const na = Number(a)
  const nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb
  return JSON.stringify(a) === JSON.stringify(b)
}

function diffRow(before: Row, after: Row): FieldChange[] {
  const fields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
  return fields
    .filter((field) => !HIDDEN_FIELDS.has(field) && !sameValue(before[field], after[field]))
    .map((field) => ({ field, before: before[field], after: after[field] }))
}

function diffLines(before: Row[], after: Row[]) {
  const result: { index: number; kind: 'changed' | 'added' | 'removed'; changes: FieldChange[] }[] = []
  for (let i = 0; i < Math.max(before.length, after.length); i++) {
    const b = before[i]
    const a = after[i]
    if (b && a) {
      const changes = diffRow(b, a)
      if (changes.length > 0) result.push({ index: i, kind: 'changed', changes })
    } else if (a) {
      result.push({ index: i, kind: 'added', changes: diffRow({}, a) })
    } else if (b) {
      result.push({ index: i, kind: 'removed', changes: diffRow(b, {}) })
    }
  }
  return result
}

const FIELD_LABELS: Record<string, string> = {
  customer_id: 'Pelanggan', vendor_id: 'Pemasok', supplier_id: 'Pemasok', contact_id: 'Kontak',
  product_id: 'Produk', unit_id: 'Satuan', warehouse_id: 'Gudang', from_warehouse_id: 'Dari Gudang', to_warehouse_id: 'Ke Gudang',
  account_id: 'Akun', cash_bank_account_id: 'Akun Kas/Bank', from_cash_bank_account_id: 'Dari Akun', to_cash_bank_account_id: 'Ke Akun',
  department_id: 'Departemen', project_id: 'Proyek', payment_term_id: 'Syarat Pembayaran',
  status: 'Status', description: 'Deskripsi', notes: 'Catatan', internal_notes: 'Catatan Internal', reference: 'Referensi', reason: 'Alasan',
  quantity: 'Qty', unit_price: 'Harga', unit_cost: 'Biaya Satuan', discount_percent: 'Diskon %', discount_amount: 'Diskon', tax_percent: 'Pajak %',
  tax_amount: 'Pajak', subtotal: 'Subtotal', total: 'Total', grand_total: 'Total', amount: 'Jumlah', debit: 'Debit', credit: 'Kredit',
  invoice_date: 'Tanggal', bill_date: 'Tanggal', receipt_date: 'Tanggal', payment_date: 'Tanggal', deposit_date: 'Tanggal',
  transfer_date: 'Tanggal', return_date: 'Tanggal', delivery_date: 'Tanggal', adjustment_date: 'Tanggal', movement_date: 'Tanggal',
  opname_date: 'Tanggal', journal_date: 'Tanggal', due_date: 'Jatuh Tempo', physical_quantity: 'Qty Fisik', system_quantity: 'Qty Sistem',
  difference_quantity: 'Selisih Qty', adjustment_type: 'Jenis Penyesuaian', movement_type: 'Jenis Mutasi',
}

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_id$/, '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function labelKind(field: string): string | null {
  if (['customer_id', 'vendor_id', 'supplier_id', 'contact_id'].includes(field)) return 'contact'
  if (field === 'product_id') return 'product'
  if (field === 'unit_id') return 'unit'
  if (field.endsWith('warehouse_id')) return 'warehouse'
  if (field === 'department_id') return 'department'
  if (field === 'project_id') return 'project'
  if (field === 'payment_term_id') return 'payment_term'
  if (field === 'account_id' || field.endsWith('_account_id')) return 'account'
  return null
}

function display(field: string, value: unknown, labels: DocumentHistoryLabels): string {
  if (value === null || value === undefined || value === '') return '—'
  const kind = labelKind(field)
  if (kind) return labels[kind]?.[String(value)] ?? `#${String(value)}`
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (typeof value === 'object') return JSON.stringify(value)
  const text = String(value)
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text).toLocaleString('id-ID', { maximumFractionDigits: 4 })
  return text
}
