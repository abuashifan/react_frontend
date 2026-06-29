import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { budgetApi } from '../services/budgetApi'
import type { BudgetPeriod } from '../types/budget.types'

const STATUS_LABELS = { open: 'Aktif', closed: 'Ditutup' }
const STATUS_CLASSES = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
}

export default function BudgetPeriodListPage() {
  const navigate = useNavigate()
  const { can } = usePermission()

  const { data, isLoading } = useQuery({
    queryKey: ['budget', 'periods'],
    queryFn: budgetApi.listPeriods,
  })
  const periods: BudgetPeriod[] = data?.data ?? []

  return (
    <WorkspaceLayout title="Anggaran" breadcrumb={[{ label: 'Anggaran' }]}>
      <div className="space-y-4">
        {can('budgets.manage') && (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => navigate('/budget/periods/new')}>
              Buat Period
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
        )}

        {!isLoading && periods.length === 0 && (
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-12 text-center text-[13px] text-[#64748b]">
            Belum ada periode anggaran.
          </div>
        )}

        {!isLoading && periods.length > 0 && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tahun</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Submission</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {periods.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-2 font-medium text-[#1e293b]">{p.name}</td>
                    <td className="px-3 py-2 tabular-nums">{p.fiscal_year}</td>
                    <td className="px-3 py-2">
                      {formatDate(p.period_from)} — {formatDate(p.period_to)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASSES[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.submissions_count ?? 0}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="outline" size="sm" className="text-[12px]" onClick={() => navigate(`/budget/periods/${p.id}`)}>
                        Lihat
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
