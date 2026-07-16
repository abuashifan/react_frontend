import { Download } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { PeriodSelector } from '../components/PeriodSelector'
import { ReportError } from '../components/ReportError'
import { ReportPrintToolbar } from '../components/ReportPrintToolbar'
import { ReportToolButton } from '../components/ReportToolButton'
import { ReportPrintDocument } from '../components/ReportPrintDocument'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { MultiPeriodInput } from '../types/reports.types'

export default function ProfitLossMultiPeriodPage() {
  const [periods, setPeriods] = useState<MultiPeriodInput[] | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'profit-loss-multi', periods],
    queryFn: () => reportsApi.profitLossMultiPeriod({ periods: periods! }),
    enabled: !!periods && periods.length > 0,
  })
  const report = data?.data
  const cols = report?.periods ?? []
  const sections = report?.sections ?? []
  const summary = report?.summary_totals ?? []
  const paramLabel = cols.map((c) => c.label).join(' · ')

  // Alat laporan menempel di section filter supaya tidak memakai baris toolbar sendiri.
  const tools = !isLoading && !isError && report && cols.length > 0 ? (
    <ReportPrintToolbar
      extra={
        <ReportToolButton icon={Download} label="Export CSV" onClick={() => exportCsv(
            'laba-rugi-multi-periode.csv',
            ['Akun', ...cols.map((c) => c.label)],
            sections.flatMap((s) => s.rows.map((r) => [r.account_name, ...r.values]))
          )} />
      }
    />
  ) : undefined

  return (
    <WorkspaceLayout hideHeader>
      <div className="space-y-4">
        <div className="no-print">
          <PeriodSelector onApply={setPeriods} isLoading={isLoading} actions={tools} />
        </div>

        {isLoading && <div className="no-print flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <div className="no-print"><ReportError onRetry={() => refetch()} /></div>}

        {!isLoading && !isError && report && cols.length > 0 && (
          <>
            <ReportPrintDocument title="Laba Rugi Multi-Periode" paramLabel={paramLabel}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="report-print-avoid-break border-b border-[#cbd5e1]">
                    <th className="px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-[#334155]">Akun</th>
                    {cols.map((c, i) => (
                      <th key={i} className="px-2 py-1 text-right text-[11px] font-bold uppercase tracking-wide text-[#334155]">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => (
                    <Fragment key={section.key}>
                      <tr className="report-print-avoid-break bg-[#f8fafc]">
                        <td className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#334155]" colSpan={cols.length + 1}>{section.label}</td>
                      </tr>
                      {section.rows.map((r, ri) => (
                        <tr key={r.account_id ?? `r-${ri}`}>
                          <td className="px-2 py-0.5 pl-6 text-[#334155]">{r.account_code ? <span className="text-[#64748b]">{r.account_code} · </span> : null}{r.account_name}</td>
                          {r.values.map((v, vi) => (
                            <td key={vi} className="px-2 py-0.5 text-right tabular-nums text-[#334155]">{v ? formatCurrency(v) : '-'}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="report-print-avoid-break border-t border-[#e2e8f0] bg-[#fbfdfe]">
                        <td className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total {section.label}</td>
                        {section.totals.map((t, ti) => (
                          <td key={ti} className="px-2 py-1 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(t)}</td>
                        ))}
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                    <td className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Laba / Rugi Bersih</td>
                    {summary.map((s, i) => (
                      <td key={i} className={`px-2 py-1.5 text-right tabular-nums font-bold ${s.net_profit_or_loss < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(s.net_profit_or_loss)}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </ReportPrintDocument>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
