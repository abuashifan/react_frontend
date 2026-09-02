import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { LineItemsTable, type LineItemColumn, FLUSH_INPUT_CLASS } from '@/components/shared/form/LineItemsTable'
import { AccountPickerDialog } from '@/modules/master-data/components/AccountPickerDialog'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import { openingBalanceApi } from '../services/openingBalanceApi'
import { formatCurrency, cn } from '@/lib/utils'
import { useOBBatch, useOBMutations } from '../hooks/useOpeningBalance'
import type { OBBatchStatus, OBPreview } from '../types/openingBalance.types'
import { getApiErrorMessage } from '@/lib/apiError'

const STATUS_BADGE: Record<OBBatchStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]' },
  reopened: { label: 'Dibuka Kembali', className: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]' },
  validated: { label: 'Tervalidasi', className: 'bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE]' },
  posted: { label: 'Diposting', className: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]' },
  locked: { label: 'Dikunci', className: 'bg-[#E0E7FF] text-[#3730A3] hover:bg-[#E0E7FF]' },
  voided: { label: 'Dibatalkan', className: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]' },
}

interface EditableLine {
  /** null selama baris baru belum dipilihkan akunnya. */
  account_id: number | null
  account_code: string | null
  account_name: string | null
  debit: number
  credit: number
  description: string
}

const DEFAULT_LINE: EditableLine = {
  account_id: null,
  account_code: null,
  account_name: null,
  debit: 0,
  credit: 0,
  description: '',
}


/**
 * `opening_date` di-cast `date` di backend, jadi JSON-nya berupa ISO penuh
 * (`2026-01-01T00:00:00.000000Z`). `<input type="date">` menolak format itu dan
 * tampil kosong sebagai `mm/dd/yyyy`, jadi dipotong ke `YYYY-MM-DD` di sini.
 */
const toDateInputValue = (value?: string | null): string => (value ? value.slice(0, 10) : '')

export default function OpeningBalanceBatchPage() {
  const { batchId } = useParams()
  const id = Number(batchId)
  const { toast } = useToast()
  const { data, isLoading } = useOBBatch(id)
  const { replaceLines, updateBatch, validate, post, lock, reopen } = useOBMutations()

  const batch = data?.data
  const status = batch?.status ?? 'draft'

  /**
   * Backend `OpeningBalanceBatch::editable()` menerima draft ATAU reopened, dan
   * `assertEditable()` memakainya untuk replaceLines/update. Halaman ini dulu
   * mengunci semua kontrol ke `status === 'draft'` saja, jadi batch yang baru
   * dibuka kembali tampil read-only: tidak ada tambah akun, simpan, atau
   * validasi. Padahal justru itu satu-satunya jalur revisi manual setelah
   * saldo awal diposting.
   */
  const isEditable = status === 'draft' || status === 'reopened'

  const [lines, setLines] = useState<EditableLine[]>([])
  const [reopenOpen, setReopenOpen] = useState(false)
  const [preview, setPreview] = useState<OBPreview | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [openingDate, setOpeningDate] = useState('')
  const [pickerRow, setPickerRow] = useState<number | null>(null)

  useEffect(() => {
    if (batch?.lines) {
      const batchLines = batch.lines
      const timer = window.setTimeout(() => {
        setLines(batchLines.filter((l) => !l.is_system_generated).map((l) => ({
          account_id: l.account_id,
          account_code: l.account_code ?? l.account?.account_code ?? null,
          account_name: l.account_name ?? l.account?.account_name ?? null,
          debit: Number(l.debit ?? 0),
          credit: Number(l.credit ?? 0),
          description: l.description ?? '',
        })))
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [batch])

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
  const difference = totalDebit - totalCredit

  /**
   * Satu akun hanya boleh punya satu baris saldo awal — backend menolak batch
   * yang memuat akun ganda. Dicegat saat memilih supaya penolakannya terjadi di
   * baris itu juga, bukan nanti saat Validasi.
   */
  const applyPickedAccounts = (startIndex: number, accounts: { id: number; account_code: string; account_name: string }[]) => {
    if (accounts.length === 0) return

    const usedElsewhere = new Set(
      lines.filter((line, index) => index !== startIndex && line.account_id !== null).map((line) => line.account_id),
    )
    const fresh = accounts.filter((account) => !usedElsewhere.has(account.id))

    if (fresh.length < accounts.length) toast.error('Akun yang sudah dipakai baris lain dilewati.')
    if (fresh.length === 0) return

    setLines((prev) => {
      const next = [...prev]
      fresh.forEach((account, offset) => {
        const target = startIndex + offset
        const filled: EditableLine = {
          ...(next[target] ?? DEFAULT_LINE),
          account_id: account.id,
          account_code: account.account_code,
          account_name: account.account_name,
        }

        // Baris yang sudah terisi akun lain tidak ditimpa — akun berikutnya
        // disisipkan sebagai baris baru supaya nominal yang sudah diketik di
        // baris itu tidak berpindah pasangan akunnya.
        if (target < next.length) {
          if (offset > 0 && next[target].account_id !== null) {
            next.splice(target, 0, { ...DEFAULT_LINE, account_id: account.id, account_code: account.account_code, account_name: account.account_name })
            return
          }
          next[target] = filled
          return
        }

        next.push(filled)
      })
      return next
    })
  }

  const updateLine = (idx: number, field: keyof EditableLine, value: string | number | null) => {
    setLines((prev) => prev.map((l, i) => {
      if (i !== idx) return l
      if (field === 'debit') return { ...l, debit: Number(value) || 0, credit: 0 }
      if (field === 'credit') return { ...l, credit: Number(value) || 0, debit: 0 }
      return { ...l, [field]: value }
    }))
  }

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))

  /*
   * Kolom mengikuti pola baris alokasi Penerimaan Kas (CashReceiptFormPage):
   * tabel `bordered` + semua kontrol memakai FLUSH_INPUT_CLASS, sehingga
   * barisnya terbaca sebagai satu grid spreadsheet, bukan deretan kotak input
   * yang masing-masing punya border sendiri.
   *
   * `<Input type="number">` sengaja tidak dipakai — spinner-nya mudah
   * tersenggol di tablet dan nominal besar tampil tanpa pemisah ribuan.
   */
  const lineColumns: LineItemColumn<EditableLine>[] = [
    {
      id: 'account',
      header: 'Nama Akun',
      width: 240,
      render: ({ item, index, isReadOnly }) => (
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => setPickerRow(index)}
          className={cn(
            'flex h-8 w-full items-center justify-between gap-1 text-left text-[12px]',
            FLUSH_INPUT_CLASS,
            'hover:bg-[#f8fbfc]',
            isReadOnly && 'cursor-not-allowed text-[#94a3b8] hover:bg-transparent',
            !item.account_id && !isReadOnly && 'text-[#94a3b8]',
          )}
        >
          <span className="truncate" title={item.account_name ?? undefined}>
            {item.account_name ?? (isReadOnly ? '-' : 'Pilih akun...')}
          </span>
          {!isReadOnly && <Search className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />}
        </button>
      ),
    },
    {
      id: 'debit',
      header: 'Debit',
      width: 130,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput
          value={item.debit}
          onChange={(value) => onUpdate('debit', value)}
          disabled={isReadOnly}
          decimals={2}
          ariaLabel="Debit"
          className={cn(FLUSH_INPUT_CLASS, 'text-right')}
        />
      ),
    },
    {
      id: 'credit',
      header: 'Kredit',
      width: 130,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput
          value={item.credit}
          onChange={(value) => onUpdate('credit', value)}
          disabled={isReadOnly}
          decimals={2}
          ariaLabel="Kredit"
          className={cn(FLUSH_INPUT_CLASS, 'text-right')}
        />
      ),
    },
    {
      id: 'description',
      header: 'Keterangan',
      width: 180,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input
          value={item.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          disabled={isReadOnly}
          placeholder="Keterangan..."
          className={cn('h-8 text-[12px]', FLUSH_INPUT_CLASS)}
        />
      ),
    },
  ]

  const handleSaveLines = async () => {
    // Baris yang belum dipilihkan akunnya tidak dikirim: `account_id` wajib di
    // backend, dan baris kosong hasil "Tambah Baris" yang belum diisi bukan
    // kesalahan user — cukup diabaikan saat menyimpan.
    const payload = lines
      .filter((l): l is EditableLine & { account_id: number } => l.account_id !== null)
      .map((l) => ({ account_id: l.account_id, debit: l.debit || undefined, credit: l.credit || undefined, description: l.description || undefined }))

    try {
      await replaceLines.mutateAsync({ batchId: id, lines: payload })
      toast.success('Baris saldo awal disimpan.')
    } catch (saveError) { toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan baris.')) }
  }

  const handleSaveDate = async () => {
    try {
      await updateBatch.mutateAsync({ batchId: id, payload: { opening_date: openingDate } })
      setOpeningDate('')
      toast.success('Tanggal saldo awal disimpan.')
    } catch (dateError) { toast.error(getApiErrorMessage(dateError, 'Gagal menyimpan tanggal.')) }
  }

  // Backend mengembalikan HTTP 200 dengan `valid: false` untuk batch yang tidak
  // lolos -- ia tidak melempar. Versi sebelumnya hanya menangkap error HTTP,
  // jadi validasi yang GAGAL tetap memunculkan toast hijau "Batch tervalidasi."
  // sementara status batch diam di draft, tanpa petunjuk apa pun ke user.
  const handleValidate = async () => {
    try {
      const res = await validate.mutateAsync(id)
      if (res.data.valid) {
        toast.success('Batch tervalidasi.')
        return
      }
      const reasons = res.data.preview.blocking_errors
      toast.error(
        reasons.length > 0
          ? `Validasi gagal: ${reasons.map((e) => e.message).join(' ')}`
          : 'Validasi gagal. Periksa keseimbangan debit/kredit.',
      )
      setPreview(res.data.preview)
      setPreviewOpen(true)
    } catch { toast.error('Validasi gagal. Periksa keseimbangan debit/kredit.') }
  }

  const handlePreview = async () => {
    try { const res = await openingBalanceApi.preview(id); setPreview(res.data); setPreviewOpen(true) }
    catch { toast.error('Gagal memuat preview.') }
  }

  const handlePost = async () => {
    if (!confirm('Posting saldo awal? Jurnal pembuka akan dibuat.')) return
    try { await post.mutateAsync(id); toast.success('Saldo awal diposting.') }
    catch { toast.error('Gagal memposting saldo awal.') }
  }

  const handleLock = async () => {
    if (!confirm('Kunci batch saldo awal? Tidak bisa diubah setelah dikunci kecuali dibuka kembali.')) return
    try { await lock.mutateAsync(id); toast.success('Batch dikunci.') }
    catch { toast.error('Gagal mengunci batch.') }
  }

  const handleReopen = async (reason: string) => {
    try { await reopen.mutateAsync({ batchId: id, reason }); toast.success('Batch dibuka kembali.'); setReopenOpen(false) }
    catch { toast.error('Gagal membuka kembali batch.') }
  }

  if (isLoading || !batch) {
    return (
      <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal', path: '/opening-balance' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
      </WorkspaceLayout>
    )
  }

  const badge = STATUS_BADGE[status]

  return (
    <WorkspaceLayout
      title={batch.batch_number}
      breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal', path: '/opening-balance' }, { label: batch.batch_number }]}
      action={<Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', badge.className)}>{badge.label}</Badge>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white p-3">
          <span className="text-[12px] font-medium text-[#64748b]">Tanggal saldo awal:</span>
          {isEditable ? (
            <PermissionGuard
              permission="opening_balance.manage"
              fallback={<span className="text-[12px] tabular-nums text-[#334155]">{toDateInputValue(batch.opening_date)}</span>}
            >
              <Input
                type="date"
                value={openingDate || toDateInputValue(batch.opening_date)}
                onChange={(event) => setOpeningDate(event.target.value)}
                className="h-8 w-[150px] text-[12px] tabular-nums"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSaveDate()}
                disabled={updateBatch.isPending || (openingDate || toDateInputValue(batch.opening_date)) === toDateInputValue(batch.opening_date)}
                className="h-8 text-[12px]"
              >
                {updateBatch.isPending ? 'Menyimpan...' : 'Simpan Tanggal'}
              </Button>
            </PermissionGuard>
          ) : (
            <span className="text-[12px] tabular-nums text-[#334155]">{toDateInputValue(batch.opening_date)}</span>
          )}
        </div>

        <LineItemsTable<EditableLine>
          items={lines}
          columns={lineColumns}
          onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
          onRemove={removeLine}
          onUpdate={(index, field, value) => updateLine(index, field as keyof EditableLine, value as string | number | null)}
          isReadOnly={!isEditable}
          addLabel="Tambah Baris"
          emptyLabel={isEditable ? 'Belum ada baris. Klik "Tambah Baris" di bawah.' : 'Belum ada baris.'}
          footer={(_items, cellCount) => (
            <>
              <tr>
                <td colSpan={cellCount - 4} className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                  Total
                </td>
                <td className="px-2.5 py-2 text-right text-[12px] font-medium tabular-nums text-[#334155]">{formatCurrency(totalDebit)}</td>
                <td className="px-2.5 py-2 text-right text-[12px] font-medium tabular-nums text-[#334155]">{formatCurrency(totalCredit)}</td>
                <td colSpan={2} />
              </tr>
              <tr className="border-t border-[#e2e8f0]">
                <td colSpan={cellCount - 4} className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#334155]">
                  Selisih
                </td>
                <td
                  colSpan={2}
                  className={cn(
                    'px-2.5 py-2 text-right text-[12px] font-semibold tabular-nums',
                    Math.abs(difference) < 0.01 ? 'text-green-700' : 'text-red-600',
                  )}
                >
                  {formatCurrency(difference)}
                </td>
                <td colSpan={2} />
              </tr>
            </>
          )}
        />

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2">
          {isEditable && (
            <PermissionGuard permission="opening_balance.manage" fallback={null}>
              <Button type="button" variant="outline" onClick={() => void handleSaveLines()} disabled={replaceLines.isPending} className="h-9 text-[13px]">{replaceLines.isPending ? 'Menyimpan...' : 'Simpan Baris'}</Button>
            </PermissionGuard>
          )}
          {isEditable && (
            <PermissionGuard permission="opening_balance.validate" fallback={null}>
              <Button type="button" onClick={() => void handleValidate()} disabled={validate.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">{validate.isPending ? 'Memvalidasi...' : 'Validasi'}</Button>
            </PermissionGuard>
          )}
          {status === 'validated' && (
            <>
              <Button type="button" variant="outline" onClick={() => void handlePreview()} className="h-9 text-[13px]">Lihat Preview</Button>
              <PermissionGuard permission="opening_balance.post" fallback={null}>
                <Button type="button" onClick={() => void handlePost()} disabled={post.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">{post.isPending ? 'Memposting...' : 'Posting'}</Button>
              </PermissionGuard>
            </>
          )}
          {status === 'posted' && (
            <PermissionGuard permission="opening_balance.lock" fallback={null}>
              <Button type="button" onClick={() => void handleLock()} disabled={lock.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">{lock.isPending ? 'Mengunci...' : 'Kunci'}</Button>
            </PermissionGuard>
          )}
          {(status === 'posted' || status === 'locked') && (
            <PermissionGuard permission="opening_balance.reopen" fallback={null}>
              <Button type="button" variant="outline" onClick={() => setReopenOpen(true)} className="h-9 text-[13px]">Buka Kembali</Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Buka Kembali BUKAN void: backend membatalkan jurnal pembukanya lalu
          mengembalikan batch ke status `reopened` yang masih bisa diubah, dan
          batch yang sama diposting ulang setelah direvisi. Teks default dialog
          ini ("Void Dokumen ... tidak dapat dibatalkan") menyesatkan untuk aksi
          itu, jadi salinannya di-override. */}
      <VoidConfirmDialog
        isOpen={reopenOpen}
        onClose={() => setReopenOpen(false)}
        onConfirm={(reason) => void handleReopen(reason)}
        documentNumber={batch.batch_number}
        isLoading={reopen.isPending}
        title="Buka Kembali Saldo Awal"
        description={`Jurnal pembuka ${batch.batch_number} akan dibatalkan dan batch kembali bisa diubah.`}
        warning="Aset tetap awal ikut dikembalikan ke draft. Setelah direvisi, batch ini divalidasi dan diposting ulang."
        reasonLabel="Alasan buka kembali"
        reasonPlaceholder="Masukkan alasan buka kembali..."
        confirmLabel="Buka Kembali"
        loadingLabel="Membuka..."
      />

      <AccountPickerDialog
        open={pickerRow !== null}
        onClose={() => setPickerRow(null)}
        onConfirm={(accounts) => {
          if (pickerRow !== null) applyPickedAccounts(pickerRow, accounts)
          setPickerRow(null)
        }}
      />


      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Preview Saldo Awal</DialogTitle><DialogDescription className="text-[13px] text-[#64748b]">Tinjau ringkasan saldo awal sebelum diposting.</DialogDescription></DialogHeader>
          {preview && (
            <div className="space-y-3 text-[13px]">
              <div className="space-y-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
                <div className="flex justify-between"><span className="text-[#64748b]">Total Debit</span><span className="tabular-nums font-medium">{formatCurrency(preview.total_debit)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Total Kredit</span><span className="tabular-nums font-medium">{formatCurrency(preview.total_credit)}</span></div>
                <div className="flex justify-between border-t border-[#e2e8f0] pt-1"><span className="font-semibold">Selisih</span><span className={cn('tabular-nums font-semibold', Math.abs(preview.difference) < 0.01 ? 'text-green-700' : 'text-red-600')}>{formatCurrency(preview.difference)}</span></div>
              </div>
              {preview.blocking_errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-600">
                  <p className="font-semibold">Error:</p>
                  <ul className="list-inside list-disc">{preview.blocking_errors.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
                </div>
              )}
              {preview.warnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-700">
                  <p className="font-semibold">Peringatan:</p>
                  <ul className="list-inside list-disc">{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              {preview.validation.valid && preview.blocking_errors.length === 0 && (
                <p className="text-[12px] text-green-700">✓ Saldo awal valid dan siap diposting.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)} className="h-9 text-[13px]">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
