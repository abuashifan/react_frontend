import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { cn, formatCurrency } from '@/lib/utils'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { budgetApi } from '../services/budgetApi'
import { useProjectFinancials } from '../hooks/useProjectFinancials'
import type { BudgetParams, ProjectFinancialBlock } from '../types/budget.types'

/**
 * Project Profitability & Margin. Semua angkanya turunan — Profit dan Margin
 * tidak pernah disimpan, dihitung dari baris anggaran dan ledger yang sama
 * dengan view lain.
 */
export default function ProjectFinancialSummaryPage() {
  const [periodIdStr, setPeriodIdStr] = useState('')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [appliedProjectId, setAppliedProjectId] = useState<number | null>(null)
  const [params, setParams] = useState<BudgetParams>({})

  const searchProject = useCallback((q: string) => proyekApi.search(q), [])

  const { data: periodsData } = useQuery({
    queryKey: ['budget', 'periods'],
    queryFn: budgetApi.listPeriods,
  })
  const periods = periodsData?.data ?? []

  const { data, isLoading, isError } = useProjectFinancials(appliedProjectId, params)
  const summary = data?.data

  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2.5 lg:px-6">
      <div>
        <Label htmlFor="project-period" className="text-[11px] text-[#64748b]">
          Periode Anggaran <span className="text-red-500">*</span>
        </Label>
        <Select value={periodIdStr} onValueChange={setPeriodIdStr}>
          <SelectTrigger id="project-period" className="h-8 w-52 text-[12px]">
            <SelectValue placeholder="Pilih periode..." />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.id} value={String(period.id)}>{period.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-56">
        <Label className="text-[11px] text-[#64748b]">Proyek <span className="text-red-500">*</span></Label>
        <SearchableSelect value={projectId} onSearch={searchProject} onChange={setProjectId} placeholder="Pilih proyek..." size="sm" />
      </div>

      <Button
        size="sm"
        onClick={() => {
          if (!periodIdStr || !projectId) return
          setAppliedProjectId(projectId)
          setParams({ budget_period_id: Number(periodIdStr) })
        }}
        disabled={!periodIdStr || !projectId || isLoading}
      >
        {isLoading ? 'Memuat...' : 'Tampilkan'}
      </Button>
    </div>
  )

  return (
    <WorkspaceLayout hideHeader toolbar={toolbar}>
      <div className="space-y-4">
        {!summary && !isError && (
          <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
            Pilih periode anggaran dan proyek, lalu klik Tampilkan.
          </p>
        )}

        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            Gagal memuat ringkasan finansial proyek.
          </div>
        )}

        {summary && (
          <>
            <div>
              <h2 className="text-[15px] font-semibold text-[#1e293b]">
                {summary.project.code} — {summary.project.name}
              </h2>
              <p className="text-[12px] text-[#64748b]">{summary.period.name}</p>
            </div>

            {/* Keterbatasan ini muncul di UI, bukan hanya di dokumen: menampilkan
                angka yang diam-diam kurang lebih berbahaya daripada tidak menampilkan. */}
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{summary.meta.limitation}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FinancialBlock title="Anggaran" block={summary.budget} />
              <FinancialBlock title="Realisasi" block={summary.actual} />
            </div>

            <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">Selisih</p>
              <dl className="grid gap-2 text-[12px] md:grid-cols-3">
                <VarianceItem label="Pendapatan" value={summary.variance.revenue} />
                <VarianceItem label="Biaya" value={summary.variance.cost} />
                <VarianceItem label="Laba" value={summary.variance.profit} />
              </dl>
              <p className="mt-3 text-[11px] text-[#64748b]">
                Serapan biaya:{' '}
                <span className="tabular-nums font-medium text-[#334155]">
                  {summary.cost_utilization_pct !== null ? `${summary.cost_utilization_pct.toFixed(1)}%` : '—'}
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}

function FinancialBlock({ title, block }: { title: string; block: ProjectFinancialBlock }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">{title}</p>
      <dl className="space-y-1.5 text-[12px]">
        <div className="flex justify-between">
          <dt className="text-[#64748b]">Pendapatan</dt>
          <dd className="tabular-nums">{formatCurrency(parseFloat(block.revenue))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[#64748b]">Biaya</dt>
          <dd className="tabular-nums">{formatCurrency(parseFloat(block.cost))}</dd>
        </div>
        <div className="flex justify-between border-t border-[#e2e8f0] pt-1.5">
          <dt className="font-semibold text-[#334155]">Laba</dt>
          <dd
            className={cn(
              'font-bold tabular-nums',
              parseFloat(block.profit) < 0 ? 'text-red-600' : 'text-green-700',
            )}
          >
            {formatCurrency(parseFloat(block.profit))}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[#64748b]">Margin</dt>
          {/* null = tidak ada pendapatan sama sekali, bukan margin 0%. */}
          <dd className="tabular-nums text-[#334155]">
            {block.margin_pct !== null ? `${block.margin_pct.toFixed(1)}%` : '—'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function VarianceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[#64748b]">{label}</dt>
      <dd
        className={cn(
          'tabular-nums font-semibold',
          parseFloat(value) < 0 ? 'text-red-600' : 'text-green-700',
        )}
      >
        {formatCurrency(parseFloat(value))}
      </dd>
    </div>
  )
}
