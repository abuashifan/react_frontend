import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)

function KPICard({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const color = positive !== undefined ? (positive ? 'text-green-700' : 'text-red-600') : 'text-[#1e293b]'
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className={`text-[18px] font-bold tabular-nums ${color}`}>{formatCurrency(value)}</p>
    </div>
  )
}

export default function FinancialSummaryPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'financial-summary', activeParams], queryFn: () => reportsApi.financialSummary(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Ringkasan Keuangan" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Ringkasan Keuangan' }]}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} mode="as_of_date" />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {report && (
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Posisi Keuangan</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard label="Total Aset" value={report.balance_sheet.total_assets} />
                <KPICard label="Total Kewajiban" value={report.balance_sheet.total_liabilities} />
                <KPICard label="Total Ekuitas" value={report.balance_sheet.total_equity} />
                <KPICard label="Laba/Rugi Tahun Berjalan" value={report.balance_sheet.current_year_profit_or_loss} positive={report.balance_sheet.current_year_profit_or_loss >= 0} />
              </div>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kinerja Periode</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <KPICard label="Laba/Rugi Bersih" value={report.profit_loss.net_profit_or_loss} positive={report.profit_loss.net_profit_or_loss >= 0} />
                <KPICard label="Arus Kas Bersih" value={report.cash_flow.cash_in - report.cash_flow.cash_out} positive={report.cash_flow.cash_in - report.cash_flow.cash_out >= 0} />
              </div>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kas</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard label="Saldo Kas Awal" value={report.cash_flow.opening_cash_balance} />
                <KPICard label="Kas Masuk" value={report.cash_flow.cash_in} />
                <KPICard label="Kas Keluar" value={report.cash_flow.cash_out} />
                <KPICard label="Saldo Kas Akhir" value={report.cash_flow.ending_cash_balance} />
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
