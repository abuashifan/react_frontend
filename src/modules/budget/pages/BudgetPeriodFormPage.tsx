import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { FormField } from '@/components/shared/form/FormField'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Input } from '@/components/ui/input'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { applyApiValidationErrors, getApiErrorMessage, getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { cn, fieldErrorClass, formatCurrency } from '@/lib/utils'
import { fiscalYearApi } from '@/modules/accounting/services/fiscalYearApi'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { useQuery } from '@tanstack/react-query'
import { budgetApi } from '../services/budgetApi'
import { BUDGET_PERIODS_QUERY_KEY } from '../hooks/useBudgetPeriods'
import type { BudgetAllocationInput } from '../types/budget.types'

const schema = z.object({
  name: z.string(),
  fiscal_year: z.string().regex(/^\d{4}$/, 'Tahun tidak valid'),
  period_from: z.string().min(1, 'Tanggal mulai wajib diisi'),
  period_to: z.string().min(1, 'Tanggal selesai wajib diisi'),
})

type FormValues = z.infer<typeof schema>

/** Satu baris pagu departemen. `department_label` disimpan agar pilihan tetap terbaca setelah draft dipulihkan. */
interface AllocationLine {
  department_id: number | null
  department_label?: string
  amount: number
}

const DEFAULT_LINE: AllocationLine = { department_id: null, amount: 0 }

/** Style input "flush" — menyatu dengan sel tabel `bordered`, sama seperti CashReceiptFormPage. */
const FLUSH_INPUT_CLASS =
  'rounded-none border-0 bg-transparent px-2 focus:shadow-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5c9ead]/40'

const FORM_PATH = '/budget/periods/new'

export default function BudgetPeriodFormPage() {
  const { replaceRecordTab, closeRecordTab } = useRecordTab()
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: fyData } = useQuery({
    queryKey: ['accounting', 'fiscal-year', 'status'],
    queryFn: fiscalYearApi.status,
  })
  const activeFiscalYear = fyData?.data.active_fiscal_year

  const searchDept = useCallback((q: string) => departemenApi.search(q), [])

  const [lines, setLines] = useState<AllocationLine[]>([DEFAULT_LINE])
  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const totalAllocated = lines.reduce((sum, l) => sum + (l.amount || 0), 0)

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', fiscal_year: String(new Date().getFullYear()), period_from: '', period_to: '' },
  })

  // Baris pagu hidup di `useState`, DI LUAR react-hook-form. `useUnsavedFormTracker`
  // sendirian tidak cukup: ia hanya melihat `dirtyFields` RHF, dan komponen ini
  // tetap di-unmount saat user sekadar pindah tab — jadi seluruh angka pagu yang
  // sudah diketik hilang tanpa peringatan. Draft dipersist lewat `extra` supaya
  // isian kembali utuh. (Hook ini sudah memanggil `useUnsavedFormTracker` di
  // dalamnya, jadi tidak dipasang dua kali.)
  const formDraft = usePersistentFormDraft<FormValues, AllocationLine[]>({
    draftKey: 'budget.period.new',
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [DEFAULT_LINE]),
  })

  // Prefill sekali saja saat tahun fiskal aktif datang — bukan tiap refetch,
  // supaya tidak menimpa tanggal/nama yang sudah diubah user secara manual.
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !activeFiscalYear) return
    prefilled.current = true
    // Draft yang dipulihkan selalu menang atas prefill — kalau tidak, isian yang
    // ditinggalkan user akan ditimpa nilai tahun fiskal begitu query-nya selesai.
    // `getValues` ikut diperiksa untuk kasus draft dan fiscal year yang tiba pada
    // pass render yang sama (isRestored belum sempat terbaca).
    if (formDraft.isRestored || getValues('period_from')) return
    setValue('name', `Pagu Anggaran ${activeFiscalYear.year}`)
    setValue('fiscal_year', String(activeFiscalYear.year))
    setValue('period_from', activeFiscalYear.start_date)
    setValue('period_to', activeFiscalYear.end_date)
  }, [activeFiscalYear, formDraft.isRestored, getValues, setValue])

  const createMut = useMutation({
    mutationFn: (data: FormValues) => {
      const department_allocations: BudgetAllocationInput[] = lines
        .filter((l) => l.department_id !== null && l.amount > 0)
        .map((l) => ({ department_id: l.department_id as number, amount: l.amount }))

      return budgetApi.createPeriod({
        name: data.name.trim() || undefined,
        fiscal_year: Number(data.fiscal_year),
        fiscal_year_id: activeFiscalYear?.id ?? null,
        period_from: data.period_from,
        period_to: data.period_to,
        department_allocations: department_allocations.length > 0 ? department_allocations : undefined,
      })
    },
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: BUDGET_PERIODS_QUERY_KEY })
      // Draft dibuang setelah tersimpan — tanpa ini, membuka form "Pagu Baru"
      // berikutnya akan memulihkan isian pagu yang sudah jadi periode.
      formDraft.clearDraft()
      setLineErrors({})
      // Tab "Pagu Baru" berubah jadi tab pagu itu sendiri, bukan menambah tab
      // kedua yang menunjuk record yang sama.
      replaceRecordTab(FORM_PATH, { label: res.data.name, path: `/budget/periods/${res.data.id}` })
    },
    onError: (error) => {
      // Tandai field dan baris penyebabnya, jangan hanya "Gagal menyimpan".
      setLineErrors(getApiLineErrors(error))
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan pagu anggaran.'))
    },
  })

  const submit = handleSubmit((data) => createMut.mutate(data))

  const columns: LineItemColumn<AllocationLine>[] = [
    {
      id: 'department',
      header: 'Departemen',
      width: 280,
      render: ({ item, isReadOnly, onUpdate }) => (
        <SearchableSelect
          value={item.department_id}
          onSearch={searchDept}
          onChange={(v, opt) => {
            onUpdate('department_id', v)
            onUpdate('department_label', opt?.label)
          }}
          placeholder="Pilih departemen..."
          disabled={isReadOnly}
          size="sm"
          selectedOptions={
            item.department_id && item.department_label
              ? [{ value: item.department_id, label: item.department_label }]
              : []
          }
        />
      ),
    },
    {
      id: 'amount',
      header: 'Pagu',
      width: 160,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput
          value={item.amount}
          onChange={(v) => onUpdate('amount', v)}
          disabled={isReadOnly}
          ariaLabel="Pagu departemen"
          className={cn(FLUSH_INPUT_CLASS, 'text-right')}
        />
      ),
    },
  ]

  return (
    <FormLayout
      title="Buat Pagu Anggaran"
      breadcrumb={[
        { label: 'Anggaran' },
        { label: 'Pagu Anggaran', path: '/budget/periods' },
        { label: 'Buat' },
      ]}
      headerActions={
        <FormSaveActions
          onCancel={() => closeRecordTab(FORM_PATH, '/budget/periods')}
          onSave={() => void submit()}
          isSaving={isSubmitting || createMut.isPending}
        />
      }
    >
      <form onSubmit={submit} className="space-y-2.5">
        {/* Header ringkas — mengikuti pola CashReceiptFormPage. */}
        <section className="rounded-lg border border-[#d9e2e5] bg-white px-3 py-2.5 lg:px-4">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <FormField label="Nama Pagu" htmlFor="period-name" error={errors.name?.message} className="w-[280px]">
              <Input
                id="period-name"
                {...register('name')}
                placeholder="Contoh: Pagu Anggaran 2026"
                className={cn('h-8 text-[12px]', fieldErrorClass(errors.name))}
              />
            </FormField>

            <FormField label="Tahun Fiskal" htmlFor="fiscal-year" required error={errors.fiscal_year?.message} className="w-[130px]">
              <Input
                id="fiscal-year"
                type="number"
                {...register('fiscal_year')}
                className={cn('h-8 text-[12px] tabular-nums', fieldErrorClass(errors.fiscal_year))}
              />
            </FormField>

            <FormField label="Dari Tanggal" htmlFor="period-from" required error={errors.period_from?.message} className="w-[160px]">
              <Input
                id="period-from"
                type="date"
                {...register('period_from')}
                className={cn('h-8 text-[12px]', fieldErrorClass(errors.period_from))}
              />
            </FormField>

            <FormField
              label="Sampai Tanggal"
              htmlFor="period-to"
              required
              error={errors.period_to?.message}
              className="w-[160px]"
              hint="Terisi otomatis dari tahun fiskal aktif."
            >
              <Input
                id="period-to"
                type="date"
                {...register('period_to')}
                className={cn('h-8 text-[12px]', fieldErrorClass(errors.period_to))}
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
            setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
          }
          addLabel="Tambah Departemen"
          emptyLabel="Belum ada pagu departemen"
          bordered
        />

        {/* Total pagu perusahaan tidak diinput — selalu jumlah baris di atas,
            supaya batas induk tidak pernah bisa lebih kecil dari isinya. */}
        <div className="flex justify-end">
          <div className="h-fit w-[280px] rounded-lg border border-[#d9e2e5] bg-[#f8fafc] px-3 py-2 text-[12px]">
            <div className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-[#64748b]">Jumlah Departemen</span>
              <span className="font-semibold tabular-nums text-[#334155]">
                {lines.filter((l) => l.department_id !== null && l.amount > 0).length}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-1.5">
              <span className="font-medium text-[#334155]">Total Pagu Perusahaan</span>
              <span className="font-semibold tabular-nums text-[#1e293b]">{formatCurrency(totalAllocated)}</span>
            </div>
          </div>
        </div>
      </form>
    </FormLayout>
  )
}
