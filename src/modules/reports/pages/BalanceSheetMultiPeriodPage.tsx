import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { PeriodSelector } from '../components/PeriodSelector'
import { ReportError } from '../components/ReportError'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { MultiPeriodInput } from '../types/reports.types'

export default function BalanceSheetMultiPeriodPage() {
  const [periods, setPeriods] = useState<MultiPeriodInput[] | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'balance-sheet-multi', periods],
    queryFn: () => reportsApi.balanceSheetMultiPeriod({ periods: periods! }),
    enabled: !!periods && periods.length > 0,
  })
  const report = data?.data
  const cols = report?.periods ?? []
  const sections = report?.sections ?? []
  const summary = report?.summary_totals ?? []

  return (
    <WorkspaceLayout title="Neraca Multi-Periode" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Neraca Multi-Periode' }]}>
      <div className="space-y-4">
        <PeriodSelector onApply={setPeriods} isLoading={isLoading} />
        <p className="text-[11px] text-[#94a3b8]">Neraca bersifat per-tanggal — tiap kolom memakai tanggal akhir periode sebagai tanggal acuan.</p>

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && cols.length > 0 && (
          <>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-[12px]"
                onClick={() => exportCsv(
                  'neraca-multi-periode.csv',
                  ['Akun', ...cols.map((c) => c.label)],
                  sections.flatMap((s) => s.rows.map((r) => [r.account_name, ...r.values]))
                )}
              >
                Export CSV
              </Button>
            </div>

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#1e293b]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Akun</th>
                    {cols.map((c, i) => (
                      <th key={i} className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {sections.map((section) => (
                    <Fragment key={section.key}>
                      <tr className="bg-[#f8fafc]">
                        <td className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]" colSpan={cols.length + 1}>{section.label}</td>
                      </tr>
                      {section.rows.map((r, ri) => (
                        <tr key={r.account_id ?? `r-${ri}`} className="hover:bg-[#f8fafc]">
                          <td className="px-3 py-1.5 pl-6 text-[#334155]">{r.account_code ? <span className="text-[#64748b]">{r.account_code} · </span> : null}{r.account_name}</td>
                          {r.values.map((v, vi) => (
                            <td key={vi} className="px-3 py-1.5 text-right tabular-nums text-[#334155]">{v ? formatCurrency(v) : '-'}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="border-t border-[#e2e8f0] bg-[#fbfdfe]">
                        <td className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total {section.label}</td>
                        {section.totals.map((t, ti) => (
                          <td key={ti} className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(t)}</td>
                        ))}
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total Kewajiban + Ekuitas</td>
                    {summary.map((s, i) => (
                      <td key={i} className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(s.total_liabilities_and_equity)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Seimbang?</td>
                    {summary.map((s, i) => (
                      <td key={i} className={`px-3 py-1 text-right text-[11px] font-semibold ${s.is_balanced ? 'text-green-700' : 'text-red-600'}`}>{s.is_balanced ? 'Ya' : 'Tidak'}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
