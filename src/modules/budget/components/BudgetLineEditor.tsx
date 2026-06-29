import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { formatCurrency } from '@/lib/utils'
import { budgetApi } from '../services/budgetApi'
import type { BudgetLine, BudgetLineInput } from '../types/budget.types'

interface LineState {
  _key: number
  account_id: number | null
  account_label?: string
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
  return lines.map((l, i) => ({
    _key: i,
    account_id: l.account_id,
    account_label: l.account_name ?? undefined,
    project_id: l.project_id ?? null,
    project_label: l.project_name ?? undefined,
    period: l.period ?? '',
    amount: l.amount,
  }))
}

export function BudgetLineEditor({ submissionId, lines, readonly = false, onSaveSuccess }: Props) {
  const qc = useQueryClient()
  const [rows, setRows] = useState<LineState[]>(() => linesToState(lines))
  const [nextKey, setNextKey] = useState(lines.length)

  const searchCoa = useCallback((q: string) => coaApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: BudgetLineInput[] = rows
        .filter((r) => r.account_id !== null)
        .map((r) => ({
          account_id: r.account_id as number,
          project_id: r.project_id ?? null,
          period: r.period || null,
          amount: parseFloat(r.amount) || 0,
        }))
      return budgetApi.updateLines(submissionId, payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budget', 'submission', submissionId] })
      onSaveSuccess?.()
    },
  })

  const addRow = () => {
    setRows((prev) => [...prev, { _key: nextKey, account_id: null, project_id: null, period: '', amount: '' }])
    setNextKey((k) => k + 1)
  }

  const removeRow = (key: number) => setRows((prev) => prev.filter((r) => r._key !== key))

  const update = (key: number, patch: Partial<LineState>) =>
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)))

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
        <table className="w-full text-[12px]">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Proyek</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode (YYYY-MM)</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nominal</th>
              {!readonly && <th className="w-10 px-2 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={readonly ? 4 : 5} className="px-3 py-4 text-center text-[12px] text-[#94a3b8]">
                  Belum ada baris anggaran.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row._key} className="hover:bg-[#f8fafc]">
                <td className="px-2 py-1.5">
                  {readonly ? (
                    <span>{row.account_label ?? '—'}</span>
                  ) : (
                    <SearchableSelect
                      value={row.account_id}
                      onSearch={searchCoa}
                      onChange={(v, opt) => update(row._key, { account_id: v, account_label: opt?.label })}
                      placeholder="Pilih akun..."
                      size="sm"
                      selectedOptions={row.account_id && row.account_label ? [{ value: row.account_id, label: row.account_label }] : []}
                    />
                  )}
                </td>
                <td className="px-2 py-1.5">
                  {readonly ? (
                    <span>{row.project_label ?? '—'}</span>
                  ) : (
                    <SearchableSelect
                      value={row.project_id}
                      onSearch={searchProject}
                      onChange={(v, opt) => update(row._key, { project_id: v, project_label: opt?.label })}
                      placeholder="Semua proyek"
                      size="sm"
                      selectedOptions={row.project_id && row.project_label ? [{ value: row.project_id, label: row.project_label }] : []}
                    />
                  )}
                </td>
                <td className="px-2 py-1.5">
                  {readonly ? (
                    <span>{row.period || '—'}</span>
                  ) : (
                    <Input
                      value={row.period}
                      onChange={(e) => update(row._key, { period: e.target.value })}
                      placeholder="2026-01"
                      className="h-7 text-[12px]"
                    />
                  )}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {readonly ? (
                    <span>{formatCurrency(parseFloat(row.amount) || 0)}</span>
                  ) : (
                    <Input
                      type="number"
                      value={row.amount}
                      onChange={(e) => update(row._key, { amount: e.target.value })}
                      className="h-7 text-right text-[12px] tabular-nums"
                    />
                  )}
                </td>
                {!readonly && (
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => removeRow(row._key)}
                      className="text-[#94a3b8] hover:text-red-500"
                      aria-label="Hapus baris"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
            <tr>
              <td colSpan={readonly ? 3 : 3} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(total)}</td>
              {!readonly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {!readonly && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-[12px]" onClick={addRow}>
            <Plus size={14} className="mr-1" /> Tambah Baris
          </Button>
          <Button size="sm" className="text-[12px]" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
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
