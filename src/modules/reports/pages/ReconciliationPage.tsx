import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams, ReconciliationReport } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)

type ReconType = 'ar' | 'ap' | 'inventory'

function ReconTable({ report }: { report: ReconciliationReport }) {
  return (
    <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
      <table className="w-full text-[12px]">
        <thead className="bg-[#f8fafc]">
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Buku Besar</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Subledger</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Selisih</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {report.lines.map((line) => (
            <tr key={line.account_id} className={`hover:bg-[#f8fafc] ${Math.abs(line.difference) > 0.01 ? 'bg-red-50/30' : ''}`}>
              <td className="px-3 py-1.5 text-[#334155]">{line.account_code} — {line.account_name}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(line.gl_balance)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(line.subledger_balance)}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${Math.abs(line.difference) > 0.01 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(line.difference)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
          <tr>
            <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
            <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(report.total_gl)}</td>
            <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(report.total_subledger)}</td>
            <td className={`px-3 py-2 text-right tabular-nums font-bold ${Math.abs(report.total_difference) > 0.01 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(report.total_difference)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

const RECON_LABELS: Record<ReconType, string> = { ar: 'Piutang (AR)', ap: 'Hutang (AP)', inventory: 'Inventori' }

export default function ReconciliationPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [activeType, setActiveType] = useState<ReconType>('ar')
  const [showFilter, setShowFilter] = useState(true)

  const fetchFn = activeType === 'ar' ? reportsApi.reconciliationAr : activeType === 'ap' ? reportsApi.reconciliationAp : reportsApi.reconciliationInventory
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'reconciliation', activeType, activeParams], queryFn: () => fetchFn(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Rekonsiliasi" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Rekonsiliasi' }]}>
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['ar', 'ap', 'inventory'] as ReconType[]).map((t) => (
            <button key={t} type="button" onClick={() => setActiveType(t)} className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${activeType === t ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}>{RECON_LABELS[t]}</button>
          ))}
        </div>
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} mode="as_of_date" />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {report && <ReconTable report={report} />}
      </div>
    </WorkspaceLayout>
  )
}
