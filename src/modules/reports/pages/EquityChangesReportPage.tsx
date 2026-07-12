import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfYear = today.slice(0, 4) + '-01-01'

export default function EquityChangesReportPage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfYear, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'equity-changes', activeParams],
    queryFn: () => reportsApi.equityChanges(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const rows = report?.rows ?? []
  const totals = report?.totals
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Perubahan Ekuitas" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Perubahan Ekuitas' }]}>
      <div className="space-y-4">
        {showFilter
          ? <ReportParameterModal open={showFilter} onClose={() => setShowFilter(false)} params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} dimensions={{ department: true, project: true }} />
          : <ReportCompactBar params={activeParams ?? params} onOpenModal={() => setShowFilter(true)} />}

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && rows.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-[12px]"
              onClick={() => exportCsv(
                `perubahan-ekuitas-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
                ['Akun', 'Saldo Awal', 'Pergerakan', 'Saldo Akhir'],
                rows.map((r) => [r.account_name, r.opening_balance, r.movement, r.closing_balance])
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
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Komponen Ekuitas</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Awal</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pergerakan</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {rows.map((r, i) => (
                  <tr key={r.account_id ?? `earn-${i}`} className="hover:bg-[#f8fafc]">
                    <td className={`px-3 py-1.5 ${r.is_current_earnings ? 'italic text-[#64748b]' : 'text-[#334155]'}`}>
                      {r.account_code ? <span className="text-[#64748b]">{r.account_code} · </span> : null}{r.account_name}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(r.opening_balance)}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${r.movement < 0 ? 'text-red-600' : r.movement > 0 ? 'text-green-700' : 'text-[#64748b]'}`}>{formatCurrency(r.movement)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(r.closing_balance)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-[#94a3b8]">Tidak ada data ekuitas pada periode ini.</td></tr>
                )}
              </tbody>
              {totals && rows.length > 0 && (
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total Ekuitas</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(totals.opening_total)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-bold ${totals.movement_total < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{formatCurrency(totals.movement_total)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(totals.closing_total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
