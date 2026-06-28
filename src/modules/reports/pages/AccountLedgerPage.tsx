import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { formatCurrency } from '@/lib/utils'
import type { SelectOption } from '@/types/common.types'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function AccountLedgerPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [accountOption, setAccountOption] = useState<SelectOption<number> | null>(null)
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [deptId, setDeptId] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [activeQuery, setActiveQuery] = useState<{ accountId: number; params: ReportParams } | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'account-ledger', activeQuery],
    queryFn: () => reportsApi.accountLedger(activeQuery!.accountId, activeQuery!.params),
    enabled: !!activeQuery,
  })

  const report = data?.data
  const handleSearch = useCallback((q: string) => coaApi.search(q), [])
  const searchDept = useCallback((q: string) => departemenApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])

  const handleSubmit = () => {
    if (!accountId) return
    setActiveQuery({
      accountId,
      params: {
        start_date: startDate,
        end_date: endDate,
        ...(deptId ? { department_id: deptId } : {}),
        ...(projectId ? { project_id: projectId } : {}),
      },
    })
  }

  return (
    <WorkspaceLayout
      title="Buku Besar per Akun"
      breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Buku Besar per Akun' }]}
    >
      <div className="space-y-4">
        {/* Filter panel */}
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Label htmlFor="account-ledger-account" className="mb-1 block text-[12px] font-medium text-[#334155]">
                Akun
              </Label>
              <SearchableSelect
                triggerId="account-ledger-account"
                triggerAriaLabel="Pilih akun"
                value={accountId}
                onChange={(val, opt) => { setAccountId(val); setAccountOption(opt ?? null) }}
                onSearch={handleSearch}
                placeholder="Cari akun..."
                size="sm"
              />
            </div>
            <div>
              <Label htmlFor="account-ledger-start" className="mb-1 block text-[12px] font-medium text-[#334155]">
                Dari Tanggal
              </Label>
              <Input
                id="account-ledger-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-[30px] text-[12px]"
              />
            </div>
            <div>
              <Label htmlFor="account-ledger-end" className="mb-1 block text-[12px] font-medium text-[#334155]">
                Sampai Tanggal
              </Label>
              <Input
                id="account-ledger-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-[30px] text-[12px]"
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-[12px] font-medium text-[#334155]">Departemen</Label>
              <SearchableSelect value={deptId} onChange={(val) => setDeptId(val)} onSearch={searchDept} placeholder="Semua departemen" size="sm" />
            </div>
            <div>
              <Label className="mb-1 block text-[12px] font-medium text-[#334155]">Proyek</Label>
              <SearchableSelect value={projectId} onChange={(val) => setProjectId(val)} onSearch={searchProject} placeholder="Semua proyek" size="sm" />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!accountId || isLoading}
              className="text-[12px]"
            >
              {isLoading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>

        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && (
          <div className="space-y-3">
            {/* Account header */}
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-[#1e293b]">
                    {report.account.account_code} — {report.account.account_name}
                  </p>
                  <p className="text-[11px] text-[#64748b]">
                    {report.account.account_type} · Saldo normal: {report.account.normal_balance}
                  </p>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-[11px] text-[#64748b]">Saldo Awal</p>
                    <p className="text-[13px] font-semibold tabular-nums text-[#334155]">{formatCurrency(report.opening_balance.balance)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748b]">Total Debet</p>
                    <p className="text-[13px] font-semibold tabular-nums text-[#334155]">{formatCurrency(report.period_totals.debit)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748b]">Total Kredit</p>
                    <p className="text-[13px] font-semibold tabular-nums text-[#334155]">{formatCurrency(report.period_totals.credit)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748b]">Saldo Akhir</p>
                    <p className="text-[13px] font-semibold tabular-nums text-[#1e293b]">{formatCurrency(report.ending_balance)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction table */}
            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No Jurnal</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keterangan</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Referensi</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debet</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {/* Opening balance row */}
                  <tr className="bg-[#f1f5f9]/60">
                    <td className="px-3 py-1.5 text-[#64748b]">{activeQuery?.params.start_date ?? ''}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">—</td>
                    <td className="px-3 py-1.5 font-medium text-[#64748b]" colSpan={2}>Saldo Awal</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(report.opening_balance.debit)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(report.opening_balance.credit)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#334155]">{formatCurrency(report.opening_balance.balance)}</td>
                  </tr>

                  {report.lines.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-[12px] text-[#64748b]">Tidak ada transaksi pada periode ini</td>
                    </tr>
                  )}

                  {report.lines.map((line) => (
                    <tr key={line.journal_entry_line_id} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 text-[#64748b]">{line.journal_date}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-[#5c9ead]">{line.journal_number}</td>
                      <td className="px-3 py-1.5 text-[#334155]">{line.description ?? '—'}</td>
                      <td className="px-3 py-1.5 text-[#64748b]">{line.source_number ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{line.debit > 0 ? formatCurrency(line.debit) : '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{line.credit > 0 ? formatCurrency(line.credit) : '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#334155]">{formatCurrency(line.running_balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Saldo Akhir</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(report.period_totals.debit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(report.period_totals.credit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.ending_balance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
