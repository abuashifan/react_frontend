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
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { AccountPickerDialog } from '@/modules/master-data/components/AccountPickerDialog'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage, getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { useCashReceipt, useCashReceiptMutations } from '../hooks/useCashBankList'
import { cashReceiptSchema, type CashReceiptFormValues } from '../schemas/cashBankSchemas'
import { cashReceiptApi } from '../services/cashBankApi'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation, FormValidationAbort } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import type { Coa } from '@/modules/master-data/types/coa.types'
import { cn, fieldErrorClass, formatCurrency, toDateInputValue } from '@/lib/utils'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

interface EditableLine { account_id: number | null; account?: { id: number; code: string; name: string } | null; amount: number; description: string }
const DEFAULT_LINE: EditableLine = { account_id: null, account: null, amount: 0, description: '' }


export default function CashReceiptFormPage() {
  const { id } = useParams()
  // `/cash-bank/cash-receipts/create` dan `/cash-bank/cash-receipts/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <CashReceiptFormPageContent key={id ?? 'create'} />
}

function CashReceiptFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = useCashReceipt(id ? Number(id) : undefined)
  const receipt = data?.data
  const { create, post, void: voidReceipt } = useCashReceiptMutations()
  const { register, handleSubmit, control, getValues, setValue, watch, reset, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<CashReceiptFormValues>({ resolver: zodResolver(cashReceiptSchema), defaultValues: { receipt_date: new Date().toISOString().slice(0, 10) } })
  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  // Error per baris dari backend (mis. lines.0.quantity) supaya baris yang
  // ditolak ikut ditandai, bukan cuma toast.
  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isVoidOpen, setVoidOpen] = useState(false)
  /** Indeks baris yang sedang membuka dialog pemilih akun; `null` = dialog tertutup. */
  const [pickerRow, setPickerRow] = useState<number | null>(null)
  /** Mode penomoran saat create: "auto" (default, digenerate backend) atau "manual" (user ketik sendiri). */
  const [numberMode, setNumberMode] = useState<'auto' | 'manual'>('auto')
  const status = (receipt?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate

  useEffect(() => {
    if (receipt) {
      reset({ receipt_date: toDateInputValue(receipt.receipt_date), cash_bank_account_id: receipt.cash_bank_account_id, contact_id: receipt.contact_id, amount: receipt.amount, notes: receipt.notes ?? '' })
      setLines(receipt.lines.map((l) => ({ account_id: l.account_id, account: l.account, amount: l.amount, description: l.description ?? '' })))
    }
  }, [receipt, reset])

  // Auto-sum: "Jumlah" header adalah total dari seluruh baris alokasi.
  useEffect(() => {
    const total = lines.reduce((s, l) => s + (l.amount || 0), 0)
    setValue('amount', total)
  }, [lines, setValue])

  /**
   * Terapkan akun-akun terpilih dari dialog mulai dari baris pemicu: akun
   * pertama mengisi baris itu, sisanya menjadi baris baru tepat di bawahnya.
   * Memilih 3 akun berarti 3 baris terisi sekali klik, tanpa perlu menekan
   * "Tambah Baris". Sama seperti `JournalFormPage.applyPickedAccounts`.
   */
  const applyPickedAccounts = (startIndex: number, accounts: Coa[]) => {
    if (accounts.length === 0) return

    setLines((prev) => {
      const next = [...prev]
      accounts.forEach((account, offset) => {
        const target = startIndex + offset
        const picked = { id: account.id, code: account.account_code, name: account.account_name }

        if (target < next.length) {
          // Baris yang sudah terisi akun lain tidak ditimpa — akun berikutnya
          // disisipkan sebagai baris baru supaya nominal yang sudah diketik
          // pada baris tersebut tidak ikut berpindah pasangan akunnya.
          if (offset > 0 && next[target].account_id !== null) {
            next.splice(target, 0, { ...DEFAULT_LINE, account_id: account.id, account: picked })
            return
          }
          next[target] = { ...next[target], account_id: account.id, account: picked }
          return
        }

        next.push({ ...DEFAULT_LINE, account_id: account.id, account: picked })
      })
      return next
    })
  }

  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<CashReceiptFormValues, EditableLine[]>({
    draftKey: `cash-bank.cash-receipt.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [DEFAULT_LINE]),
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<CashReceiptFormValues>({
    id,
    basePath: '/cash-bank/cash-receipts',
    createLabel: 'Penerimaan Kas Baru',
    sequenceQueryKey: ['cash-bank', 'receipts', 'adjacent'],
    fetchAdjacent: async (recordId) => (await cashReceiptApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values) => {
      // Mode "Manual" tanpa nomor diisi dibatalkan di sini — melemparnya sebagai
      // FormValidationAbort menghentikan simpan sekaligus navigasi tanpa toast kedua.
      const trimmedNumber = (values.receipt_number ?? '').trim()
      if (numberMode === 'manual' && trimmedNumber === '') {
        setError('receipt_number', { message: 'Nomor penerimaan wajib diisi untuk mode manual.' })
        toast.error('Nomor penerimaan wajib diisi untuk mode manual.')
        throw new FormValidationAbort()
      }

      const linePayloads = lines.filter((l) => l.account_id).map((l) => ({ account_id: l.account_id!, amount: l.amount, description: l.description || null }))
      await create.mutateAsync({
        ...values,
        receipt_number: numberMode === 'manual' ? trimmedNumber : undefined,
        lines: linePayloads.length ? linePayloads : undefined,
      })
    },
    onSaved: () => {
      formDraft.clearDraft()
      setLineErrors({})
    },
    successMessage: () => 'Penerimaan kas berhasil dibuat.',
    onError: (saveError) => {
      // Tandai field penyebab dari backend supaya user tahu isian mana yang salah,
      // bukan hanya toast generik "Gagal menyimpan".
      setLineErrors(getApiLineErrors(saveError))
      applyApiValidationErrors(saveError, setError)
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan penerimaan kas.'))
    },
    canSave: isEditable,
  })

  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Diposting.') } catch (postError) { toast.error(getApiErrorMessage(postError, 'Gagal posting.')) } }
  const handleVoid = async (reason: string) => { await voidReceipt.mutateAsync({ id: Number(id), reason }); toast.success('Berhasil di-void.'); setVoidOpen(false) }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'account', header: 'Nama Akun', width: 220,
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
            !item.account && !isReadOnly && 'text-[#94a3b8]',
          )}
        >
          <span className="truncate" title={item.account?.name}>
            {item.account?.name ?? 'Pilih akun...'}
          </span>
          <Search className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
        </button>
      ),
    },
    {
      id: 'amount', header: 'Jumlah', width: 130, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput
          value={item.amount}
          onChange={(v) => onUpdate('amount', v)}
          disabled={isReadOnly}
          decimals={2}
          ariaLabel="Jumlah"
          className={cn(FLUSH_INPUT_CLASS, 'text-right')}
        />
      ),
    },
    {
      id: 'description', header: 'Keterangan', width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Keterangan..." className={cn('h-8 text-[12px]', FLUSH_INPUT_CLASS)} />
      ),
    },
  ]

  const actions: DocumentActionButton[] = []
  if (isCreate && can('cash_bank.create')) actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  if (!isCreate && receipt?.status === 'draft' && can('cash_bank.post')) actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
  if (!isCreate && receipt?.status === 'posted' && can('cash_bank.void')) actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })

  if (!isCreate && isLoading) return <FormLayout title="Penerimaan Kas" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Penerimaan Kas', path: '/cash-bank/cash-receipts' }, { label: 'Memuat...' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>

  return (
    <>
      <FormLayout title={isCreate ? 'Buat Penerimaan Kas' : 'Penerimaan Kas'} documentNumber={receipt?.number} status={status} readOnly={!isEditable}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Penerimaan Kas', path: '/cash-bank/cash-receipts' }, { label: isCreate ? 'Buat' : (receipt?.number ?? '') }]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={receipt?.number} actions={actions} />
          </>
        }>
        <div className="space-y-2.5 [@media(max-height:620px)]:space-y-2">
          {/* Header ringkas — mengikuti pola form jurnal. */}
          <section className="rounded-lg border border-[#d9e2e5] bg-white px-3 py-2.5 lg:px-4 [@media(max-height:620px)]:py-2">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              {/* No. Penerimaan: user pilih Otomatis (digenerate backend) atau Manual
                  (ketik sendiri, divalidasi unik oleh StoreCashReceiptRequest). */}
              <FormField label="No. Penerimaan" error={errors.receipt_number?.message} className="w-[220px]">
                {isCreate ? (
                  <div className="space-y-1">
                    <div className="inline-flex h-6 items-center gap-0.5 rounded-md border border-[#d9e2e5] bg-[#f8fbfc] p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setNumberMode('auto'); setValue('receipt_number', ''); clearErrors('receipt_number') }}
                        className={cn('rounded px-2 py-0.5 font-medium transition-colors', numberMode === 'auto' ? 'bg-white text-[#326273] shadow-sm' : 'text-[#64748b] hover:text-[#326273]')}
                      >
                        Otomatis
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumberMode('manual')}
                        className={cn('rounded px-2 py-0.5 font-medium transition-colors', numberMode === 'manual' ? 'bg-white text-[#326273] shadow-sm' : 'text-[#64748b] hover:text-[#326273]')}
                      >
                        Manual
                      </button>
                    </div>
                    {numberMode === 'manual' ? (
                      <Input
                        {...register('receipt_number')}
                        placeholder="Ketik nomor penerimaan..."
                        className={cn('h-8 text-[12px]', fieldErrorClass(errors.receipt_number))}
                      />
                    ) : (
                      <div className="flex h-8 items-center rounded-md border border-[#e2e8f0] bg-[#f8fbfc] px-2 text-[12px] tabular-nums text-[#64748b]">
                        Otomatis
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-8 items-center rounded-md border border-[#e2e8f0] bg-[#f8fbfc] px-2 text-[12px] tabular-nums text-[#64748b]">
                    {receipt?.number ?? '-'}
                  </div>
                )}
              </FormField>

              <FormField label="Tgl. Terima" htmlFor="receipt-date" required error={errors.receipt_date?.message} className="w-[160px]">
                <Input
                  id="receipt-date"
                  {...register('receipt_date')}
                  type="date"
                  disabled={!isEditable}
                  className={cn('h-8 text-[12px]', fieldErrorClass(errors.receipt_date))}
                />
              </FormField>

              <FormField label="Akun Kas/Bank" required error={errors.cash_bank_account_id?.message} className="w-[240px]">
                <SearchableSelect
                  value={watch('cash_bank_account_id') ?? null}
                  onChange={(v) => setValue('cash_bank_account_id', v as number)}
                  onSearch={(q) => coaApi.search(q, { is_cash_bank: true })}
                  placeholder="Pilih akun kas/bank..."
                  disabled={!isEditable}
                  size="sm"
                  selectedOptions={receipt?.cash_bank_account ? [{ value: receipt.cash_bank_account.id, label: receipt.cash_bank_account.name, sublabel: receipt.cash_bank_account.code }] : []}
                />
              </FormField>

              <FormField label="Kontak" error={errors.contact_id?.message} className="w-[220px]">
                <SearchableSelect
                  value={watch('contact_id') ?? null}
                  onChange={(v) => setValue('contact_id', v)}
                  onSearch={kontakApi.search}
                  placeholder="Pilih kontak..."
                  disabled={!isEditable}
                  size="sm"
                  selectedOptions={receipt?.contact ? [{ value: receipt.contact.id, label: receipt.contact.name }] : []}
                />
              </FormField>
            </div>
          </section>

          <LineItemsTable
            errors={lineErrors}
            items={lines}
            columns={columns}
            onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
            onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
            onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))}
            isReadOnly={!isEditable}
            addLabel="Tambah Baris"
            emptyLabel="Belum ada baris alokasi"
          />

          {/* Catatan dan ringkasan jumlah disandingkan. */}
          <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_280px]">
            <FormField label="Catatan" htmlFor="receipt-notes" error={errors.notes?.message}>
              <Textarea
                id="receipt-notes"
                {...register('notes')}
                disabled={!isEditable}
                placeholder="Catatan..."
                rows={2}
                className={cn('min-h-[58px] resize-none text-[12px]', fieldErrorClass(errors.notes))}
              />
            </FormField>

            <div className="h-fit rounded-lg border border-[#d9e2e5] bg-[#f8fafc] px-3 py-2 text-[12px]">
              <div className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-[#64748b]">Total Alokasi</span>
                <span className="font-semibold tabular-nums text-[#334155]">{formatCurrency(lines.reduce((s, l) => s + (l.amount || 0), 0))}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-[#64748b]">Jumlah</span>
                <span className="font-semibold tabular-nums text-[#334155]">{formatCurrency(watch('amount') ?? 0)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-1.5">
                <span className={cn('font-medium', lines.reduce((s, l) => s + (l.amount || 0), 0) === (watch('amount') ?? 0) ? 'text-[#15803d]' : 'text-red-600')}>
                  {lines.reduce((s, l) => s + (l.amount || 0), 0) === (watch('amount') ?? 0) ? 'Seimbang' : 'Selisih'}
                </span>
                <span className={cn('font-semibold tabular-nums', lines.reduce((s, l) => s + (l.amount || 0), 0) === (watch('amount') ?? 0) ? 'text-[#15803d]' : 'text-red-600')}>
                  {lines.reduce((s, l) => s + (l.amount || 0), 0) === (watch('amount') ?? 0) ? '✓' : formatCurrency(Math.abs((lines.reduce((s, l) => s + (l.amount || 0), 0)) - (watch('amount') ?? 0)))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={receipt?.number ?? ''} isLoading={voidReceipt.isPending} />

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
