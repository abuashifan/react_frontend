import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { TablePagination } from '@/components/shared/table/TablePagination'
import type { PaginationState } from '@/components/shared/table/TablePagination'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function GeneralLedgerPage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfMonth, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports', 'general-ledger', activeParams], queryFn: () => reportsApi.generalLedger(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const allAccounts = report?.accounts ?? []

  const pagedAccounts = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return allAccounts.slice(start, start + pagination.pageSize)
  }, [allAccounts, pagination])

  const handleSubmit = () => {
    setActiveParams({ ...params })
    setShowFilter(false)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  return (
    <WorkspaceLayout title="Buku Besar" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Buku Besar' }]}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} extras={{ include_zero_balance: true }} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}
        {!isLoading && !isError && report && allAccounts.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-[12px]"
              onClick={() => exportCsv(
                `buku-besar-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
                ['Kode', 'Akun', 'Saldo Awal', 'Debit Periode', 'Kredit Periode', 'Saldo Akhir'],
                allAccounts.map((a) => [a.account_code, a.account_name, a.opening_balance, a.period_debit, a.period_credit, a.ending_balance])
              )}
            >
              Export CSV
            </Button>
          </div>
        )}
        {!isLoading && !isError && report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Awal</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {pagedAccounts.map((acc) => (
                  <tr key={acc.account_id} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 text-[#64748b]">{acc.account_code}</td>
                    <td className="px-3 py-1.5 text-[#334155]">{acc.account_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(acc.opening_balance)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{acc.period_debit ? formatCurrency(acc.period_debit) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{acc.period_credit ? formatCurrency(acc.period_credit) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(acc.ending_balance)}</td>
                  </tr>
                ))}
                {allAccounts.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-[#94a3b8]">Tidak ada transaksi pada periode ini.</td></tr>
                )}
              </tbody>
            </table>
            {allAccounts.length > 0 && (
              <TablePagination pagination={pagination} totalRows={allAccounts.length} onChange={setPagination} isFetching={isLoading} />
            )}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
