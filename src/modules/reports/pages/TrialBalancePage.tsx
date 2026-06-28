import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function TrialBalancePage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfMonth, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'trial-balance', activeParams],
    queryFn: () => reportsApi.trialBalance(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const accounts = report?.accounts ?? []
  const totals = report?.totals

  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Neraca Saldo" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Neraca Saldo' }]}>
      <div className="space-y-4">
        {showFilter
          ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} extras={{ include_zero_balance: true }} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />
        }
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}
        {!isLoading && !isError && report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit Awal</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit Awal</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit Periode</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit Periode</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit Akhir</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {accounts.map((l) => (
                  <tr key={l.account_id} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 text-[#64748b]">{l.account_code}</td>
                    <td className="px-3 py-1.5 text-[#1e293b]">{l.account_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{l.opening_debit ? formatCurrency(l.opening_debit) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{l.opening_credit ? formatCurrency(l.opening_credit) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{l.period_debit ? formatCurrency(l.period_debit) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{l.period_credit ? formatCurrency(l.period_credit) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium">{l.ending_debit ? formatCurrency(l.ending_debit) : '-'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium">{l.ending_credit ? formatCurrency(l.ending_credit) : '-'}</td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-[#94a3b8]">Tidak ada saldo akun pada periode ini.</td></tr>
                )}
              </tbody>
              {totals && (
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(totals.opening_debit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(totals.opening_credit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(totals.period_debit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(totals.period_credit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(totals.ending_debit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(totals.ending_credit)}</td>
                  </tr>
                  {!totals.is_balanced && (
                    <tr>
                      <td colSpan={8} className="px-3 py-1.5 text-[12px] font-medium text-red-600">
                        ⚠ Tidak seimbang — selisih: {formatCurrency(totals.difference)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
