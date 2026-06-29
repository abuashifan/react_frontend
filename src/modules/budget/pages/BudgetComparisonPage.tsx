import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatCurrency } from '@/lib/utils'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { budgetApi } from '../services/budgetApi'
import type { BudgetParams } from '../types/budget.types'

export default function BudgetComparisonPage() {
  const [periodIdStr, setPeriodIdStr] = useState('')
  const [deptId, setDeptId] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [activeParams, setActiveParams] = useState<BudgetParams | null>(null)

  const searchDept = useCallback((q: string) => departemenApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])

  const { data: periodsData } = useQuery({
    queryKey: ['budget', 'periods'],
    queryFn: budgetApi.listPeriods,
  })
  const periods = periodsData?.data ?? []

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'budget-comparison', activeParams],
    queryFn: () => budgetApi.getComparison(activeParams!),
    enabled: !!activeParams?.budget_period_id,
  })
  const result = data?.data

  const handleSubmit = () => {
    if (!periodIdStr) return
    setActiveParams({
      budget_period_id: Number(periodIdStr),
      ...(deptId ? { department_id: deptId } : {}),
      ...(projectId ? { project_id: projectId } : {}),
      ...(periodFrom ? { period_from: periodFrom } : {}),
      ...(periodTo ? { period_to: periodTo } : {}),
    })
  }

  return (
    <WorkspaceLayout
      title="Realisasi vs Anggaran"
      breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Realisasi vs Anggaran' }]}
    >
      <div className="space-y-4">
        {/* Filter panel */}
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label htmlFor="period-select" className="text-[11px] text-[#64748b]">Periode Anggaran <span className="text-red-500">*</span></Label>
              <Select value={periodIdStr} onValueChange={setPeriodIdStr}>
                <SelectTrigger id="period-select" className="h-8 w-52 text-[12px]">
                  <SelectValue placeholder="Pilih periode..." />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-44">
              <Label className="text-[11px] text-[#64748b]">Departemen</Label>
              <SearchableSelect value={deptId} onSearch={searchDept} onChange={setDeptId} placeholder="Semua dept" size="sm" />
            </div>

            <div className="w-44">
              <Label className="text-[11px] text-[#64748b]">Proyek</Label>
              <SearchableSelect value={projectId} onSearch={searchProject} onChange={setProjectId} placeholder="Semua proyek" size="sm" />
            </div>

            <div>
              <Label className="text-[11px] text-[#64748b]">Dari</Label>
              <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="h-8 w-36 text-[12px]" />
            </div>

            <div>
              <Label className="text-[11px] text-[#64748b]">Sampai</Label>
              <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="h-8 w-36 text-[12px]" />
            </div>

            <Button size="sm" onClick={handleSubmit} disabled={!periodIdStr || isLoading}>
              {isLoading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>

        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            Gagal memuat laporan.
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#1e293b]">{result.period.name}</p>
            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#1e293b]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Akun</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Anggaran</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Realisasi</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Selisih</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {result.rows.map((row) => (
                    <tr key={row.account_id} className={row.over_budget ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-[#f8fafc]'}>
                      <td className="px-3 py-1.5 text-[#334155]">
                        {row.account_code ? `${row.account_code} — ` : ''}{row.account_name ?? '—'}
                        {row.over_budget && <span className="ml-2 text-[10px] font-semibold text-red-600">OVER</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.budget_amount))}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.actual_amount))}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${parseFloat(row.variance) < 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {formatCurrency(parseFloat(row.variance))}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                        {row.variance_pct !== null ? `${row.variance_pct.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(parseFloat(result.totals.budget_amount))}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(parseFloat(result.totals.actual_amount))}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-bold ${parseFloat(result.totals.variance) < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {formatCurrency(parseFloat(result.totals.variance))}
                    </td>
                    <td />
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
