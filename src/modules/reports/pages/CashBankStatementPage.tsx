import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { CashBankAccount } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

interface ActiveQuery {
  cash_bank_account_id: number
  start_date?: string
  end_date?: string
}

export default function CashBankStatementPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [activeQuery, setActiveQuery] = useState<ActiveQuery | null>(null)

  const { data: accountsData } = useQuery({
    queryKey: ['cash-bank', 'accounts'],
    queryFn: () => reportsApi.cashBankAccounts(),
  })
  const accounts: CashBankAccount[] = accountsData?.data?.accounts ?? []

  const searchAccounts = useCallback(
    (q: string) => {
      const filtered = accounts.filter(
        (a) =>
          a.is_active &&
          (a.account_name.toLowerCase().includes(q.toLowerCase()) ||
            a.account_code.toLowerCase().includes(q.toLowerCase())),
      )
      return Promise.resolve(filtered.map((a) => ({ id: a.id, label: `${a.account_code} — ${a.account_name}` })))
    },
    [accounts],
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'cash-bank-statement', activeQuery],
    queryFn: () => reportsApi.cashBankStatement(activeQuery!),
    enabled: !!activeQuery,
  })

  const report = data?.data

  const handleSubmit = () => {
    if (!accountId) return
    setActiveQuery({
      cash_bank_account_id: accountId,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    })
  }

  return (
    <WorkspaceLayout
      title="Mutasi Rekening"
      breadcrumb={[{ label: 'Laporan' }, { label: 'Kas & Bank' }, { label: 'Mutasi Rekening' }]}
    >
      <div className="space-y-4">
        {/* Filter */}
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Parameter Laporan
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 w-56">
              <Label className="text-[11px] font-medium text-[#64748b]">Rekening Kas/Bank</Label>
              <SearchableSelect
                value={accountId}
                onChange={(val) => setAccountId(val ?? null)}
                onSearch={searchAccounts}
                placeholder="Pilih rekening..."
                size="sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="cb-start-date" className="text-[11px] font-medium text-[#64748b]">
                Dari Tanggal
              </Label>
              <Input
                id="cb-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-40 text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="cb-end-date" className="text-[11px] font-medium text-[#64748b]">
                Sampai Tanggal
              </Label>
              <Input
                id="cb-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-40 text-[13px]"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!accountId || isLoading}
              className="h-8 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]"
            >
              {isLoading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>

        {isError && <ReportError />}

        {report && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
                <p className="text-[11px] text-[#64748b]">Saldo Awal</p>
                <p className="mt-1 text-[16px] font-semibold tabular-nums text-[#334155]">
                  {formatCurrency(report.opening_balance)}
                </p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
                <p className="text-[11px] text-[#64748b]">Total Mutasi</p>
                <div className="mt-1 flex gap-4">
                  <div>
                    <p className="text-[10px] text-[#64748b]">Debit</p>
                    <p className="text-[14px] font-medium tabular-nums text-[#16a34a]">
                      {formatCurrency(report.period_totals.debit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b]">Kredit</p>
                    <p className="text-[14px] font-medium tabular-nums text-[#dc2626]">
                      {formatCurrency(report.period_totals.credit)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
                <p className="text-[11px] text-[#64748b]">Saldo Akhir</p>
                <p className="mt-1 text-[16px] font-semibold tabular-nums text-[#1e293b]">
                  {formatCurrency(report.ending_balance)}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
              <div className="px-4 py-3 border-b border-[#f1f5f9]">
                <p className="text-[13px] font-semibold text-[#1e293b]">
                  {report.account.account_code} — {report.account.account_name}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#64748b]">
                      <th className="px-3 py-2 text-left">Tanggal</th>
                      <th className="px-3 py-2 text-left">No. Jurnal</th>
                      <th className="px-3 py-2 text-left">Keterangan</th>
                      <th className="px-3 py-2 text-left">Sumber</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Kredit</th>
                      <th className="px-3 py-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening row */}
                    <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                      <td className="px-3 py-1.5 text-[#64748b]" colSpan={6}>
                        Saldo Awal
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#334155]">
                        {formatCurrency(report.opening_balance)}
                      </td>
                    </tr>
                    {report.lines.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                          Tidak ada transaksi pada periode ini.
                        </td>
                      </tr>
                    )}
                    {report.lines.map((line) => (
                      <tr
                        key={line.journal_entry_line_id}
                        className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]"
                      >
                        <td className="px-3 py-1.5 tabular-nums text-[#64748b]">{line.journal_date}</td>
                        <td className="px-3 py-1.5 font-mono text-[12px] text-[#334155]">
                          {line.journal_number}
                        </td>
                        <td className="px-3 py-1.5 text-[#475569]">{line.description ?? '—'}</td>
                        <td className="px-3 py-1.5 text-[12px] text-[#64748b]">
                          {line.source_number ? `${line.source_number}` : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                          {line.debit > 0 ? formatCurrency(line.debit) : ''}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                          {line.credit > 0 ? formatCurrency(line.credit) : ''}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#334155]">
                          {formatCurrency(line.running_balance)}
                        </td>
                      </tr>
                    ))}
                    {/* Ending row */}
                    <tr className="border-t-2 border-[#e2e8f0] bg-[#f8fafc]">
                      <td className="px-3 py-2 font-semibold text-[#334155]" colSpan={4}>
                        Saldo Akhir
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#16a34a]">
                        {formatCurrency(report.period_totals.debit)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#dc2626]">
                        {formatCurrency(report.period_totals.credit)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">
                        {formatCurrency(report.ending_balance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
