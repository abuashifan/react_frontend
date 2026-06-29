import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { budgetApi } from '../services/budgetApi'
import { BudgetStatusBadge } from '../components/BudgetStatusBadge'
import { BudgetConsolidationTable } from '../components/BudgetConsolidationTable'
import type { BudgetSubmission } from '../types/budget.types'

type Tab = 'submissions' | 'consolidation'

export default function BudgetPeriodDetailPage() {
  const { id } = useParams<{ id: string }>()
  const periodId = Number(id)
  const navigate = useNavigate()
  const { can } = usePermission()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('submissions')

  const { data: periodData, isLoading: periodLoading } = useQuery({
    queryKey: ['budget', 'period', periodId],
    queryFn: () => budgetApi.getPeriod(periodId),
  })
  const period = periodData?.data

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['budget', 'submissions', periodId],
    queryFn: () => budgetApi.listSubmissions(periodId),
  })
  const submissions: BudgetSubmission[] = subsData?.data ?? []

  const closeMut = useMutation({
    mutationFn: () => budgetApi.closePeriod(periodId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budget', 'period', periodId] }),
  })

  const createSubmission = () => {
    navigate(`/budget/submissions/new?period_id=${periodId}`)
  }

  return (
    <WorkspaceLayout
      title={period?.name ?? 'Detail Periode Anggaran'}
      breadcrumb={[{ label: 'Anggaran', path: '/budget' }, { label: period?.name ?? '...' }]}
    >
      <div className="space-y-4">
        {period && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
            <div className="flex flex-wrap gap-4 text-[12px] text-[#64748b]">
              <span>Tahun Fiskal: <strong className="text-[#1e293b]">{period.fiscal_year}</strong></span>
              <span>Periode: <strong className="text-[#1e293b]">{formatDate(period.period_from)} — {formatDate(period.period_to)}</strong></span>
              <span>Status: <strong className={`${period.status === 'open' ? 'text-green-700' : 'text-slate-600'}`}>{period.status === 'open' ? 'Aktif' : 'Ditutup'}</strong></span>
            </div>
            {can('budgets.manage') && period.status === 'open' && (
              <Button variant="outline" size="sm" className="text-[12px] text-red-600 border-red-200 hover:bg-red-50" onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>
                Tutup Periode
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-1 border-b border-[#e2e8f0]">
          {(['submissions', 'consolidation'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-[#5c9ead] text-[#5c9ead]' : 'border-transparent text-[#64748b] hover:text-[#334155]'}`}
            >
              {tab === 'submissions' ? 'Pengajuan' : 'Konsolidasi'}
            </button>
          ))}
        </div>

        {activeTab === 'submissions' && (
          <div className="space-y-3">
            {can('budgets.submit') && period?.status === 'open' && (
              <div className="flex justify-end">
                <Button size="sm" onClick={createSubmission}>Ajukan Anggaran</Button>
              </div>
            )}

            {(periodLoading || subsLoading) && (
              <div className="flex h-24 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
            )}

            {!subsLoading && submissions.length === 0 && (
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-10 text-center text-[13px] text-[#64748b]">
                Belum ada pengajuan anggaran.
              </div>
            )}

            {!subsLoading && submissions.length > 0 && (
              <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Departemen</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Revisi ke</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-[#f8fafc]">
                        <td className="px-3 py-2 font-medium text-[#1e293b]">{s.department?.name ?? `Dept #${s.department_id}`}</td>
                        <td className="px-3 py-2"><BudgetStatusBadge status={s.status} /></td>
                        <td className="px-3 py-2 text-right tabular-nums">{s.revision_number}</td>
                        <td className="px-3 py-2 text-right">
                          <Button variant="outline" size="sm" className="text-[12px]" onClick={() => navigate(`/budget/submissions/${s.id}`)}>
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'consolidation' && (
          <BudgetConsolidationTable periodId={periodId} />
        )}
      </div>
    </WorkspaceLayout>
  )
}
