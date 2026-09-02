import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormField } from '@/components/shared/form/FormField'
import { LineItemsTable, type LineItemColumn, FLUSH_INPUT_CLASS } from '@/components/shared/form/LineItemsTable'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage, getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { cn, fieldErrorClass, formatCurrency, toDateInputValue } from '@/lib/utils'
import { AccountPickerDialog } from '@/modules/master-data/components/AccountPickerDialog'
import { useJournalEntry, useJournalEntryMutations } from '../hooks/useJournalEntryList'
import { journalEntrySchema, type JournalEntryFormValues } from '../schemas/journalEntrySchema'
import { journalEntryApi } from '../services/journalEntryApi'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import type { BudgetWarning } from '../types/journalEntry.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

interface EditableLine {
  account_id: number | null
  /**
   * Kode dan nama akun disimpan di state baris, bukan hanya `account_id`.
   * Tabel memisahkan kolom "No. Akun" dan "Nama Akun" (mengikuti tata letak
   * bukti jurnal), dan keduanya harus tetap terbaca setelah reload tanpa
   * memanggil ulang detail akun per baris.
   */
  account_code: string
  account_name: string
  description: string
  debit: number
  credit: number
}

const DEFAULT_LINE: EditableLine = { account_id: null, account_code: '', account_name: '', description: '', debit: 0, credit: 0 }

/** Nominal dari API/draft bisa berupa string desimal — pastikan selalu number. */
function toAmount(value: number | string | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Nilai `account` dari kolom No. Akun — satu update untuk id + kode + nama. */
interface AccountSelection {
  id: number | null
  code: string
  name: string
}

/**
 * Terapkan satu perubahan sel ke baris. Kolom "No. Akun" mengirim objek
 * `AccountSelection` supaya id, kode, dan nama akun berubah bersamaan; sisanya
 * update field biasa.
 */
function applyLineUpdate(line: EditableLine, field: string, value: unknown): EditableLine {
  if (field === 'account') {
    const selection = value as AccountSelection
    return { ...line, account_id: selection.id, account_code: selection.code, account_name: selection.name }
  }
  return { ...line, [field]: value }
}

/** Normalisasi baris dari draft localStorage (bisa berasal dari versi state lama). */
function normalizeDraftLine(line: Partial<EditableLine>): EditableLine {
  return {
    account_id: line.account_id ?? null,
    account_code: line.account_code ?? '',
    account_name: line.account_name ?? '',
    description: line.description ?? '',
    debit: toAmount(line.debit),
    credit: toAmount(line.credit),
  }
}

export default function JournalFormPage() {
  const { id } = useParams()
  // `/accounting/journals/create` dan `/accounting/journals/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <JournalFormPageContent key={id ?? 'create'} />
}

function JournalFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useJournalEntry(id ? Number(id) : undefined)
  const journal = data?.data
  const { create, update, approve, post, void: voidJournal } = useJournalEntryMutations()

  const { register, handleSubmit, control, getValues, reset, setError, formState: { errors, isSubmitting } } = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: { journal_date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE, DEFAULT_LINE])

  // Error per baris dari backend (mis. lines.0.account_id) supaya baris yang
  // ditolak ikut ditandai, bukan cuma toast.
  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isVoidOpen, setVoidOpen] = useState(false)
  /** Indeks baris yang sedang membuka dialog pemilih akun; `null` = dialog tertutup. */
  const [pickerRow, setPickerRow] = useState<number | null>(null)

  /**
   * Terapkan akun-akun terpilih mulai dari baris pemicu: akun pertama mengisi
   * baris itu, sisanya menjadi baris baru tepat di bawahnya. Memilih 3 akun
   * berarti 3 baris terisi sekali klik, tanpa perlu menekan "Tambah Baris".
   */
  const applyPickedAccounts = (startIndex: number, accounts: { id: number; account_code: string; account_name: string }[]) => {
    if (accounts.length === 0) return

    setLines((prev) => {
      const next = [...prev]
      accounts.forEach((account, offset) => {
        const target = startIndex + offset
        const filled: EditableLine = {
          ...(next[target] ?? DEFAULT_LINE),
          account_id: account.id,
          account_code: account.account_code,
          account_name: account.account_name,
        }

        if (target < next.length) {
          // Baris yang sudah terisi akun lain tidak ditimpa — akun berikutnya
          // disisipkan sebagai baris baru supaya nominal yang sudah diketik
          // pada baris tersebut tidak ikut berpindah pasangan akunnya.
          if (offset > 0 && next[target].account_id !== null) {
            next.splice(target, 0, { ...DEFAULT_LINE, account_id: account.id, account_code: account.account_code, account_name: account.account_name })
            return
          }
          next[target] = filled
          return
        }

        next.push({ ...DEFAULT_LINE, account_id: account.id, account_code: account.account_code, account_name: account.account_name })
      })
      return next
    })
  }

  const status = (journal?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || journal?.status === 'draft'

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
  const difference = totalDebit - totalCredit
  const isBalanced = Math.abs(difference) < 0.001

  useEffect(() => {
    if (journal) {
      reset({ journal_date: toDateInputValue(journal.journal_date), description: journal.description ?? '' })
      // Detail load is the source of truth for editable line state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines(journal.lines.map((l) => ({
        account_id: l.account_id,
        account_code: l.account?.account_code ?? '',
        account_name: l.account?.account_name ?? '',
        description: l.description ?? '',
        // Kolom decimal dikirim backend sebagai string ("1000.00"). Tanpa
        // koersi ini, `reduce` di bawah menyambung string alih-alih menjumlah
        // dan ringkasan total tampil sebagai "-".
        debit: toAmount(l.debit),
        credit: toAmount(l.credit),
      })))
    }
  }, [journal, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  // `version: 2` — bentuk baris berubah (kode & nama akun kini disimpan),
  // draft versi lama sengaja tidak dipulihkan agar labelnya tidak kosong.
  const formDraft = usePersistentFormDraft<JournalEntryFormValues, EditableLine[]>({
    draftKey: `accounting.journal.${id ?? 'new'}`,
    version: 2,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) =>
      setLines(draftLines.length > 0 ? draftLines.map(normalizeDraftLine) : [DEFAULT_LINE]),
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<JournalEntryFormValues>({
    id,
    basePath: '/accounting/journals',
    createLabel: 'Jurnal Baru',
    sequenceQueryKey: ['accounting', 'journals', 'adjacent'],
    fetchAdjacent: async (recordId) => (await journalEntryApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values, creating) => {
      const linePayloads = lines.map((l, i) => ({ account_id: l.account_id!, description: l.description || null, debit: l.debit || undefined, credit: l.credit || undefined, line_order: i + 1 }))
      if (creating) await create.mutateAsync({ ...values, lines: linePayloads })
      else await update.mutateAsync({ id: Number(id), payload: { ...values, lines: linePayloads } })
    },
    onSaved: () => {
      formDraft.clearDraft()
      setLineErrors({})
    },
    successMessage: (creating) => (creating ? 'Jurnal berhasil dibuat.' : 'Jurnal berhasil diperbarui.'),
    onError: (error) => {
      setLineErrors(getApiLineErrors(error))
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan jurnal.'))
    },
    canSave: isEditable,
  })

  const handleApprove = async () => { try { await approve.mutateAsync(Number(id)); toast.success('Jurnal di-approve.') } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal approve.')) } }
  const handlePost = async () => {
    if (!isBalanced) { toast.error('Total debit harus sama dengan total kredit.'); return }
    try {
      const res = await post.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Jurnal berhasil diposting.')
      const warnings = (res.meta?.warnings ?? []) as BudgetWarning[]
      warnings.forEach((w) => {
        toast.warning(
          `Anggaran terlampaui: akun #${w.account_id} — realisasi ${formatCurrency(w.new_total)} dari anggaran ${formatCurrency(w.budget_amount)} (lebih ${formatCurrency(w.overage)})`,
        )
      })
    } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal posting jurnal.')) }
  }
  const handleVoid = async (reason: string) => {
    try {
      await voidJournal.mutateAsync({ id: Number(id), reason })
      formDraft.clearDraft()
      toast.success('Jurnal berhasil di-void.')
      setVoidOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal void jurnal.'))
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'account', header: 'No. Akun', width: 140,
      render: ({ item, index, isReadOnly }) => (
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => setPickerRow(index)}
          className={cn(
            'flex h-8 w-full items-center justify-between gap-1 rounded-md border border-[#d9e2e5] bg-white px-2 text-left text-[12px]',
            'hover:border-[#5c9ead] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead]/30',
            isReadOnly && 'cursor-not-allowed bg-[#f8fbfc] text-[#94a3b8]',
            !item.account_code && !isReadOnly && 'text-[#94a3b8]',
          )}
        >
          <span className="truncate tabular-nums">
            {item.account_code || (item.account_id ? `#${item.account_id}` : 'Pilih akun...')}
          </span>
          <Search className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
        </button>
      ),
    },
    {
      id: 'account_name', header: 'Nama Akun', width: 200,
      render: ({ item }) => (
        <span className="block truncate py-1 text-[12px] text-[#334155]" title={item.account_name}>
          {item.account_name || (item.account_id ? '—' : '')}
        </span>
      ),
    },
    {
      id: 'debit', header: 'Debit', width: 130, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput
          value={item.debit}
          onChange={(value) => { onUpdate('debit', value); onUpdate('credit', 0) }}
          disabled={isReadOnly}
          decimals={2}
          ariaLabel="Debit"
          className={cn(FLUSH_INPUT_CLASS, 'text-right')}
        />
      ),
    },
    {
      id: 'credit', header: 'Kredit', width: 130, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput
          value={item.credit}
          onChange={(value) => { onUpdate('credit', value); onUpdate('debit', 0) }}
          disabled={isReadOnly}
          decimals={2}
          ariaLabel="Kredit"
          className={cn(FLUSH_INPUT_CLASS, 'text-right')}
        />
      ),
    },
    // Keterangan dipindah ke belakang Kredit: pasangan akun–nominal adalah inti
    // baris jurnal dan harus terbaca berurutan tanpa disela teks bebas.
    {
      id: 'description', header: 'Keterangan', width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Keterangan baris..." className={cn('h-8 text-[12px]', FLUSH_INPUT_CLASS)} />
      ),
    },
  ]

  const actions: DocumentActionButton[] = []
  if (isEditable && can('journal.create')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (journal?.status === 'draft' && can('journal.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'secondary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (['draft', 'approved'].includes(journal?.status ?? '') && can('journal.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (['draft', 'approved', 'posted'].includes(journal?.status ?? '') && can('journal.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Jurnal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Jurnal', path: '/accounting/journals' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Jurnal' : 'Jurnal Umum'}
        documentNumber={journal?.journal_number}
        status={status}
        readOnly={!isEditable}
        breadcrumb={[{ label: 'Akuntansi' }, { label: 'Jurnal', path: '/accounting/journals' }, { label: isCreate ? 'Buat Jurnal' : (journal?.journal_number ?? '') }]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={journal?.journal_number} actions={actions} />
          </>
        }
      >
        {/* Kepadatan mengikuti spec-23 §7.1–7.2: identitas dokumen dibuat satu
            baris ringkas supaya tabel baris jurnal — bagian yang benar-benar
            dikerjakan user — mendapat sisa tinggi layar tablet. */}
        <div className="space-y-2.5 [@media(max-height:620px)]:space-y-2">
          <section className="rounded-lg border border-[#d9e2e5] bg-white px-3 py-2.5 lg:px-4 [@media(max-height:620px)]:py-2">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <FormField label="No. Jurnal" className="w-[170px]">
                <div className="flex h-8 items-center rounded-md border border-[#e2e8f0] bg-[#f8fbfc] px-2 text-[12px] tabular-nums text-[#64748b]">
                  {journal?.journal_number ?? 'Otomatis'}
                </div>
              </FormField>

              <FormField label="Tgl. Jurnal" htmlFor="journal-date" required error={errors.journal_date?.message} className="w-[160px]">
                <Input
                  id="journal-date"
                  {...register('journal_date')}
                  type="date"
                  disabled={!isEditable}
                  className={cn('h-8 text-[12px]', fieldErrorClass(errors.journal_date))}
                />
              </FormField>

            </div>
          </section>

          <LineItemsTable
            items={lines}
            columns={columns}
            errors={lineErrors}
            onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
            onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
            onUpdate={(i, field, value) =>
              setLines((prev) => prev.map((l, idx) => (idx === i ? applyLineUpdate(l, field, value) : l)))
            }
            isReadOnly={!isEditable}
            addLabel="Tambah Baris"
            emptyLabel="Belum ada baris jurnal"
          />

          {/* Deskripsi dokumen dan ringkasan saldo disandingkan dalam satu baris
              — keduanya pendek, jadi menumpuknya hanya membuang tinggi layar. */}
          <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_280px]">
            <FormField label="Deskripsi" htmlFor="journal-description" error={errors.description?.message}>
              <Textarea
                id="journal-description"
                {...register('description')}
                disabled={!isEditable}
                placeholder="Deskripsi jurnal..."
                rows={2}
                className={cn('min-h-[58px] resize-none text-[12px]', fieldErrorClass(errors.description))}
              />
            </FormField>

            <div className="h-fit rounded-lg border border-[#d9e2e5] bg-[#f8fafc] px-3 py-2 text-[12px]">
              <div className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-[#64748b]">Total Debit</span>
                <span className="font-semibold tabular-nums text-[#334155]">{formatCurrency(totalDebit)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-[#64748b]">Total Kredit</span>
                <span className="font-semibold tabular-nums text-[#334155]">{formatCurrency(totalCredit)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-1.5">
                <span className={cn('font-medium', isBalanced ? 'text-[#15803d]' : 'text-red-600')}>
                  {isBalanced ? 'Seimbang' : 'Selisih'}
                </span>
                <span className={cn('font-semibold tabular-nums', isBalanced ? 'text-[#15803d]' : 'text-red-600')}>
                  {isBalanced ? '✓' : formatCurrency(Math.abs(difference))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={journal?.journal_number ?? ''} isLoading={voidJournal.isPending} />

      <AccountPickerDialog
        open={pickerRow !== null}
        onClose={() => setPickerRow(null)}
        onConfirm={(accounts) => {
          if (pickerRow !== null) applyPickedAccounts(pickerRow, accounts)
          setPickerRow(null)
        }}
      />
    </>
  )
}
