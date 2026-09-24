import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { Search } from 'lucide-react'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { AccountPickerDialog } from '@/modules/master-data/components/AccountPickerDialog'
import type { Coa } from '@/modules/master-data/types/coa.types'
import { LineItemsTable, type LineItemColumn, FLUSH_INPUT_CLASS } from '@/components/shared/form/LineItemsTable'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { cn, formatCurrency } from '@/lib/utils'
import { getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { budgetApi } from '../services/budgetApi'
import type { BudgetLine, BudgetLineInput } from '../types/budget.types'

/**
 * Baris kosong = anggaran setahun (dibandingkan dengan realisasi kumulatif);
 * diisi = anggaran bulan itu saja. Backend mencocokkan string ini dengan bulan
 * jurnal, jadi salah ketik berarti peringatan over-budget diam-diam tidak
 * pernah menyala tanpa error apa pun — karena itu divalidasi ketat di sini juga.
 */
const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

const isPeriodInvalid = (period: string) => period !== '' && !PERIOD_PATTERN.test(period)

interface LineState {
  account_id: number | null
  account_label?: string
  /** Dimensi baris — default mengikuti departemen pemilik dokumen. */
  department_id: number | null
  department_label?: string
  project_id: number | null
  project_label?: string
  period: string
  amount: string
}

interface Props {
  submissionId: number
  lines: BudgetLine[]
  readonly?: boolean
  onSaveSuccess?: () => void
}

function linesToState(lines: BudgetLine[]): LineState[] {
  return lines.map((l) => ({
    account_id: l.account_id,
    account_label: l.account_name ?? undefined,
    department_id: l.department_id ?? null,
    department_label: l.department_name ?? undefined,
    project_id: l.project_id ?? null,
    project_label: l.project_name ?? undefined,
    period: l.period_month ?? l.period ?? '',
    amount: l.amount,
  }))
}

const DEFAULT_ROW: LineState = { account_id: null, department_id: null, project_id: null, period: '', amount: '' }

export function BudgetLineEditor({ submissionId, lines, readonly = false, onSaveSuccess }: Props) {
  const qc = useQueryClient()
  const [rows, setRows] = useState<LineState[]>(() => linesToState(lines))
  const [pickerRow, setPickerRow] = useState<number | null>(null)

  /**
   * `useState` di atas hanya berjalan sekali saat mount, sehingga baris yang
   * ditampilkan bisa tertinggal dari server: setelah "Simpan Baris" backend
   * mengembalikan bentuk kanonik (mis. `direction` terisi, baris tanpa akun
   * dibuang), dan tanpa sinkronisasi ini layar tetap menampilkan bentuk lama.
   *
   * Yang dibandingkan adalah SIDIK JARI data server, bukan identitas prop.
   * `invalidateQueries` pada aksi persetujuan membuat objek `lines` baru dengan
   * isi yang sama persis — menyeed ulang di situ akan membuang baris yang
   * sedang diketik user tapi belum disimpan. Membandingkan isinya membuat
   * re-seed hanya terjadi saat baris di server benar-benar berubah.
   */
  const serverSignature = useMemo(() => JSON.stringify(linesToState(lines)), [lines])
  const lastSyncedRef = useRef(serverSignature)
  useEffect(() => {
    if (lastSyncedRef.current === serverSignature) return
    lastSyncedRef.current = serverSignature
    setRows(linesToState(lines))
  }, [serverSignature, lines])
  const searchDepartment = useCallback((q: string) => departemenApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: BudgetLineInput[] = rows
        .filter((r) => r.account_id !== null)
        .map((r) => ({
          account_id: r.account_id as number,
          department_id: r.department_id ?? null,
          project_id: r.project_id ?? null,
          period_month: r.period || null,
          amount: parseFloat(r.amount) || 0,
        }))
      return budgetApi.updateLines(submissionId, payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budget', 'submission', submissionId] })
      onSaveSuccess?.()
    },
  })

  const addRow = () => setRows((prev) => [...prev, { ...DEFAULT_ROW }])

  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index))

  /**
   * Centang beberapa akun di AccountPickerDialog = beberapa baris sekaligus.
   * Baris yang sudah terisi akun lain tidak ditimpa — akun berikutnya
   * disisipkan sebagai baris baru supaya nominal yang sudah diketik pada baris
   * tersebut tidak ikut berpindah pasangan akunnya. Sama seperti
   * `CashReceiptFormPage.applyPickedAccounts`.
   */
  const applyPickedAccounts = (startIndex: number, accounts: Coa[]) => {
    if (accounts.length === 0) return

    setRows((prev) => {
      const next = [...prev]
      accounts.forEach((account, offset) => {
        const target = startIndex + offset
        const picked = { account_id: account.id, account_label: account.account_name }

        if (target < next.length) {
          if (offset > 0 && next[target].account_id !== null) {
            next.splice(target, 0, { ...DEFAULT_ROW, ...picked })
            return
          }
          next[target] = { ...next[target], ...picked }
          return
        }

        next.push({ ...DEFAULT_ROW, ...picked })
      })
      return next
    })
  }

  const updateRow = (index: number, field: string, value: unknown) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
  const hasInvalidPeriod = rows.some((r) => isPeriodInvalid(r.period))

  /**
   * Validasi format periode dihitung di sini, bukan di dalam `LineItemsTable` —
   * komponen itu sudah punya satu jalur tampil error per baris (`errors`), jadi
   * pesan client-side digabung ke bentuk yang sama dengan pesan 422 backend
   * alih-alih dirender lewat jalur kedua.
   *
   * Indeks error backend mengikuti payload yang dikirim, yang membuang baris
   * tanpa akun — tanpa dipetakan balik, pesan baris ke-N backend akan menempel
   * di baris yang salah begitu ada baris kosong di atasnya.
   */
  const rowErrors = useMemo<LineItemErrorMap>(() => {
    const sentRowIndexes = rows.reduce<number[]>((acc, r, i) => {
      if (r.account_id !== null) acc.push(i)
      return acc
    }, [])

    const merged: LineItemErrorMap = {}
    Object.entries(getApiLineErrors(saveMut.error)).forEach(([payloadIndex, fields]) => {
      const uiIndex = sentRowIndexes[Number(payloadIndex)]
      if (uiIndex !== undefined) merged[uiIndex] = { ...fields }
    })

    rows.forEach((r, i) => {
      if (isPeriodInvalid(r.period)) {
        merged[i] = { ...(merged[i] ?? {}), period: 'Format harus YYYY-MM, mis. 2026-01.' }
      }
    })

    return merged
  }, [rows, saveMut.error])

  const columns: LineItemColumn<LineState>[] = [
    {
      id: 'account',
      header: 'Akun',
      width: 220,
      render: ({ item, index, isReadOnly }) =>
        isReadOnly ? (
          <span className="text-[12px]">{item.account_label ?? '—'}</span>
        ) : (
          <button
            type="button"
            onClick={() => setPickerRow(index)}
            className={cn(
              'flex h-8 w-full items-center justify-between gap-1 text-left text-[12px]',
              FLUSH_INPUT_CLASS,
              'hover:bg-[#f8fbfc]',
              !item.account_label && 'text-[#94a3b8]',
            )}
          >
            <span className="truncate" title={item.account_label}>
              {item.account_label ?? 'Pilih akun...'}
            </span>
            <Search className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
          </button>
        ),
    },
    {
      id: 'department',
      header: 'Cost Center',
      width: 170,
      render: ({ item, isReadOnly, onUpdate }) =>
        isReadOnly ? (
          <span className="text-[12px]">{item.department_label ?? '—'}</span>
        ) : (
          <SearchableSelect
          flush
            value={item.department_id}
            onSearch={searchDepartment}
            onChange={(v, opt) => {
              onUpdate('department_id', v)
              onUpdate('department_label', opt?.label)
            }}
            placeholder="Ikut dokumen"
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
      id: 'project',
      header: 'Proyek',
      width: 180,
      render: ({ item, isReadOnly, onUpdate }) =>
        isReadOnly ? (
          <span className="text-[12px]">{item.project_label ?? '—'}</span>
        ) : (
          <SearchableSelect
          flush
            value={item.project_id}
            onSearch={searchProject}
            onChange={(v, opt) => {
              onUpdate('project_id', v)
              onUpdate('project_label', opt?.label)
            }}
            placeholder="Semua proyek"
            size="sm"
            selectedOptions={
              item.project_id && item.project_label
                ? [{ value: item.project_id, label: item.project_label }]
                : []
            }
          />
        ),
    },
    {
      id: 'period',
      header: 'Periode (YYYY-MM)',
      width: 140,
      render: ({ item, isReadOnly, onUpdate }) =>
        isReadOnly ? (
          <span className="text-[12px] tabular-nums">{item.period || '—'}</span>
        ) : (
          <Input
            value={item.period}
            onChange={(e) => onUpdate('period', e.target.value)}
            placeholder="2026-01"
            aria-invalid={isPeriodInvalid(item.period)}
            className={cn(
              'h-8 text-[12px] tabular-nums',
              FLUSH_INPUT_CLASS,
              isPeriodInvalid(item.period) && 'ring-1 ring-inset ring-red-500',
            )}
          />
        ),
    },
    {
      id: 'amount',
      header: 'Nominal',
      width: 140,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) =>
        isReadOnly ? (
          <span className="text-[12px] tabular-nums">{formatCurrency(parseFloat(item.amount) || 0)}</span>
        ) : (
          // `AmountInput` menggantikan `<Input type="number">`: nominal anggaran
          // umumnya berjuta-juta dan tanpa pemisah ribuan praktis tidak terbaca
          // di layar tablet. Nilainya tetap disimpan sebagai string karena payload
          // baris memakai `parseFloat` saat dikirim.
          <AmountInput
            value={item.amount}
            onChange={(v) => onUpdate('amount', String(v))}
            ariaLabel="Nominal anggaran"
            className={cn('h-8 text-right text-[12px]', FLUSH_INPUT_CLASS)}
          />
        ),
    },
  ]

  return (
    <div className="space-y-3">
      <LineItemsTable<LineState>
        items={rows}
        columns={columns}
        onAdd={addRow}
        onRemove={removeRow}
        onUpdate={updateRow}
        isReadOnly={readonly}
        addLabel="Tambah Baris"
        emptyLabel="Belum ada baris anggaran."
        errors={rowErrors}
        footer={(_items, cellCount) => (
          <tr>
            <td
              colSpan={cellCount - 2}
              className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]"
            >
              Total
            </td>
            <td className="px-2.5 py-2 text-right text-[13px] font-bold tabular-nums text-[#1e293b]">
              {formatCurrency(total)}
            </td>
            <td />
          </tr>
        )}
      />

      <AccountPickerDialog
        open={pickerRow !== null}
        onClose={() => setPickerRow(null)}
        onConfirm={(accounts) => {
          if (pickerRow !== null) applyPickedAccounts(pickerRow, accounts)
          setPickerRow(null)
        }}
      />

      {!readonly && (
        <div className="flex items-center gap-2">
          <Button size="sm" className="text-[12px]" onClick={() => saveMut.mutate()} disabled={saveMut.isPending || hasInvalidPeriod}>
            {saveMut.isPending ? 'Menyimpan...' : 'Simpan Baris'}
          </Button>
          {saveMut.isSuccess && (
            <span className="text-[12px] text-green-600">Tersimpan</span>
          )}
          {saveMut.isError && (
            <span className="text-[12px] text-red-600">Gagal menyimpan</span>
          )}
        </div>
      )}
    </div>
  )
}
