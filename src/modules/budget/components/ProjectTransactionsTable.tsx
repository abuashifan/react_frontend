import { useCallback, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { useProjectTransactions } from '../hooks/useProjectFinancials'
import { ReportExportButton } from '@/modules/reports/components/ReportExportButton'
import { toExcelDate, toExcelNumber } from '@/lib/exportXlsx'
import type { BudgetParams } from '../types/budget.types'

/**
 * Daftar jurnal yang menyusun Actual Revenue/Cost proyek — jawaban atas
 * "angka ini datang dari transaksi mana saja".
 *
 * Sumbernya sama persis dengan yang dijumlahkan `BudgetActualService`, jadi
 * totalnya selalu cocok dengan blok Realisasi untuk filter yang sama.
 */
export function ProjectTransactionsTable({
  projectId,
  params,
}: {
  projectId: number | null
  params: BudgetParams
}) {
  const [direction, setDirection] = useState<'all' | 'revenue' | 'expense'>('all')
  const [accountId, setAccountId] = useState<number | null>(null)

  const searchAccount = useCallback((q: string) => coaApi.search(q), [])

  const { data, isLoading, isError } = useProjectTransactions(projectId, {
    ...params,
    ...(direction !== 'all' ? { direction } : {}),
    ...(accountId ? { account_id: accountId } : {}),
  })
  const result = data?.data

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="tx-direction" className="text-[11px] text-[#64748b]">Arah</Label>
          <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
            <SelectTrigger id="tx-direction" className="h-8 w-32 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="revenue">Pendapatan</SelectItem>
              <SelectItem value="expense">Beban</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-56">
          <Label className="text-[11px] text-[#64748b]">Akun</Label>
          <SearchableSelect
            value={accountId}
            onSearch={searchAccount}
            onChange={setAccountId}
            placeholder="Semua akun"
            size="sm"
          />
        </div>

        {result && (
          <div className="ml-auto flex items-center gap-4 text-[12px]">
            <Total label="Pendapatan" value={result.totals.revenue} />
            <Total label="Biaya" value={result.totals.cost} />
            <Total label="Net" value={result.totals.net} strong />
            {/* Ikut filter Arah & Akun yang aktif — sumbernya `result` yang sama
                dengan tabel di bawah. Kalau backend memotong hasil, spanduk
                `truncated` di bawah tetap tampil. */}
            {result.lines.length > 0 && (
              <ReportExportButton
                variant="outline"
                filename={`transaksi-project-${projectId ?? ''}`}
                sheetName="Transaksi Project"
                headers={['Tanggal', 'No Jurnal', 'Kode Akun', 'Akun', 'Keterangan', 'Sumber', 'Arah', 'Jumlah']}
                rows={() => result.lines.map((line) => [
                  toExcelDate(line.journal_date),
                  line.journal_number,
                  line.account_code,
                  line.account_name,
                  line.description ?? '',
                  line.source_number ?? '',
                  line.direction,
                  toExcelNumber(line.amount),
                ])}
                formats={['date', 'text', 'text', 'text', 'text', 'text', 'text', 'currency']}
              />
            )}
          </div>
        )}
      </div>

      {isLoading && <p className="py-6 text-center text-[12px] text-[#64748b]">Memuat transaksi...</p>}

      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          Gagal memuat transaksi proyek.
        </div>
      )}

      {result?.truncated && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
          Menampilkan {result.lines.length.toLocaleString()} dari {result.total_lines.toLocaleString()} baris.
          Persempit rentang tanggal untuk melihat semua.
        </div>
      )}

      {result && (
        <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
          <table className="w-full text-[12px]">
            <thead className="bg-[#1e293b]">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Tanggal</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">No Jurnal</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Akun</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Keterangan</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Sumber</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {result.lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[#94a3b8]">
                    Tidak ada transaksi pada rentang ini.
                  </td>
                </tr>
              )}
              {result.lines.map((line) => (
                <tr key={line.journal_entry_line_id} className="hover:bg-[#f8fafc]">
                  <td className="px-3 py-1.5 text-[#64748b]">{formatDate(line.journal_date)}</td>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-[#5c9ead]">{line.journal_number}</td>
                  <td className="px-3 py-1.5 text-[#334155]">{line.account_code} — {line.account_name}</td>
                  <td className="px-3 py-1.5 text-[#334155]">{line.description ?? '—'}</td>
                  <td className="px-3 py-1.5 text-[#64748b]">{line.source_number ?? '—'}</td>
                  <td
                    className={cn(
                      'px-3 py-1.5 text-right font-medium tabular-nums',
                      parseFloat(line.amount) < 0 ? 'text-red-600' : 'text-[#334155]',
                    )}
                  >
                    {formatCurrency(parseFloat(line.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className={cn('tabular-nums', strong ? 'font-bold text-[#1e293b]' : 'text-[#334155]')}>
        {formatCurrency(parseFloat(value))}
      </p>
    </div>
  )
}
