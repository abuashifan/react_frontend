import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { cn, formatCurrency } from '@/lib/utils'
import { BudgetPeriodSelect } from '../components/BudgetPeriodSelect'
import { useBudgetAnalysis } from '../hooks/useBudgetAnalysis'
import type { BudgetAnalysisParams } from '../types/budget.types'

/**
 * Dashboard anggaran: KPI tile + grafik anggaran vs realisasi per cost center.
 * Datanya dari mesin analisis yang sama — bukan agregasi terpisah.
 */
export default function BudgetDashboardPage() {
  const [periodId, setPeriodId] = useState<number | null>(null)

  const params = useMemo<BudgetAnalysisParams | null>(
    () => (periodId ? { budget_period_id: periodId, group_by: ['department'] } : null),
    [periodId],
  )

  const { data, isLoading } = useBudgetAnalysis(params)
  const result = data?.data

  const chartData = useMemo(
    () =>
      (result?.rows ?? []).map((row) => ({
        name: row.department_name ?? 'Tanpa Cost Center',
        Anggaran: parseFloat(row.budget_amount),
        Realisasi: parseFloat(row.actual_amount),
      })),
    [result],
  )

  const overBudgetCount = useMemo(
    () => (result?.rows ?? []).filter((row) => row.state === 'over_budget').length,
    [result],
  )

  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2.5 lg:px-6">
      <BudgetPeriodSelect
        id="dashboard-period"
        value={periodId}
        onChange={setPeriodId}
        emptyHint="Belum ada pagu anggaran."
      />
    </div>
  )

  return (
    <WorkspaceLayout hideHeader toolbar={toolbar}>
      <div className="space-y-4">
        {!params && (
          <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
            Pilih periode anggaran untuk melihat ringkasannya.
          </p>
        )}

        {isLoading && <p className="text-[13px] text-[#64748b]">Memuat ringkasan...</p>}

        {result && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiTile label="Total Anggaran" value={formatCurrency(parseFloat(result.totals.budget_amount))} />
              <KpiTile label="Total Realisasi" value={formatCurrency(parseFloat(result.totals.actual_amount))} />
              <KpiTile
                label="Sisa Anggaran"
                value={formatCurrency(parseFloat(result.totals.variance))}
                tone={parseFloat(result.totals.variance) < 0 ? 'bad' : 'good'}
              />
              <KpiTile
                label="Serapan"
                value={result.totals.utilization_pct !== null ? `${result.totals.utilization_pct.toFixed(1)}%` : '—'}
                hint={overBudgetCount > 0 ? `${overBudgetCount} cost center unfavorable` : undefined}
                tone={overBudgetCount > 0 ? 'bad' : 'neutral'}
              />
            </div>

            <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                Anggaran vs Realisasi per Cost Center
              </p>
              {chartData.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[#94a3b8]">Belum ada data anggaran.</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Anggaran" fill="#5c9ead" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Realisasi" fill="#326273" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}

function KpiTile({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'bad' | 'neutral'
}) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">{label}</p>
      <p
        className={cn(
          'mt-1 text-[18px] font-bold tabular-nums',
          tone === 'good' && 'text-green-700',
          tone === 'bad' && 'text-red-600',
          tone === 'neutral' && 'text-[#1e293b]',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-[#94a3b8]">{hint}</p>}
    </div>
  )
}
