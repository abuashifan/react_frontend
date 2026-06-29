import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatCurrency } from '@/lib/utils'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { budgetApi } from '../services/budgetApi'
import type { BudgetConsolidationRow } from '../types/budget.types'

type BreakdownBy = 'department' | 'project' | 'project_department'

interface Props {
  periodId: number
}

export function BudgetConsolidationTable({ periodId }: Props) {
  const [by, setBy] = useState<BreakdownBy>('department')
  const [deptId, setDeptId] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [accountId, setAccountId] = useState<number | null>(null)

  const searchDept = useCallback((q: string) => departemenApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])
  const searchCoa = useCallback((q: string) => coaApi.search(q), [])

  const params = {
    by,
    ...(deptId ? { department_id: deptId } : {}),
    ...(projectId ? { project_id: projectId } : {}),
    ...(accountId ? { account_id: accountId } : {}),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['budget', 'consolidation', periodId, params],
    queryFn: () => budgetApi.getConsolidation(periodId, params),
  })
  const result = data?.data

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-[11px] text-[#64748b]">Tampilkan per</Label>
          <Select value={by} onValueChange={(v) => setBy(v as BreakdownBy)}>
            <SelectTrigger className="h-8 w-44 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Departemen</SelectItem>
              <SelectItem value="project">Proyek</SelectItem>
              <SelectItem value="project_department">Proyek × Dept</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Label className="text-[11px] text-[#64748b]">Filter Departemen</Label>
          <SearchableSelect value={deptId} onSearch={searchDept} onChange={setDeptId} placeholder="Semua dept" size="sm" />
        </div>
        <div className="w-44">
          <Label className="text-[11px] text-[#64748b]">Filter Proyek</Label>
          <SearchableSelect value={projectId} onSearch={searchProject} onChange={setProjectId} placeholder="Semua proyek" size="sm" />
        </div>
        <div className="w-44">
          <Label className="text-[11px] text-[#64748b]">Filter Akun</Label>
          <SearchableSelect value={accountId} onSearch={searchCoa} onChange={setAccountId} placeholder="Semua akun" size="sm" />
        </div>
      </div>

      {isLoading && <div className="py-8 text-center text-[13px] text-[#64748b]">Memuat konsolidasi...</div>}

      {!isLoading && result && (
        <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
          <table className="w-full text-[12px]">
            <thead className="bg-[#1e293b]">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">
                  {by === 'department' ? 'Departemen' : by === 'project' ? 'Proyek' : 'Dept / Proyek'}
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Akun</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Anggaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                    Belum ada anggaran yang disetujui.
                  </td>
                </tr>
              )}
              {result.rows.map((row: BudgetConsolidationRow, i: number) => {
                const rowLabel = row.department_name ?? row.project_name ?? '—'
                return row.accounts.map((acc, j) => (
                  <tr key={`${i}-${j}`} className="hover:bg-[#f8fafc]">
                    {j === 0 && (
                      <td rowSpan={row.accounts.length} className="px-3 py-1.5 align-top font-medium text-[#334155]">
                        {rowLabel}
                        <div className="text-[11px] font-bold text-[#1e293b] mt-1">
                          Total: {formatCurrency(parseFloat(row.total_amount))}
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-1.5 text-[#334155]">{acc.account_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(acc.total_amount))}</td>
                  </tr>
                ))
              })}
            </tbody>
            <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
              <tr>
                <td colSpan={2} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Grand Total</td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">
                  {formatCurrency(parseFloat(result.grand_total))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
