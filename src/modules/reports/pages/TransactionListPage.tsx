import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileDown } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { reportsApi } from '../services/reportsApi'
import { useReportExport } from '../hooks/useReportExport'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'
import type { DocumentStatus } from '@/types/common.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

type TxType = 'sales' | 'purchase'
const TYPE_LABELS: Record<TxType, string> = { sales: 'Penjualan', purchase: 'Pembelian' }

export default function TransactionListPage() {
  const [txType, setTxType] = useState<TxType>('sales')
  const [params, setParams] = useState<ReportParams>({ date_from: firstOfMonth, date_to: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const { exportExcel, isExportingExcel } = useReportExport('transactions')

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'transactions', txType, activeParams], queryFn: () => reportsApi.transactionList({ ...activeParams!, type: txType }), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Daftar Transaksi" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Daftar Transaksi' }]}
      action={activeParams && <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void exportExcel({ ...activeParams, type: txType } as ReportParams)} disabled={isExportingExcel}><FileDown className="mr-1 h-3.5 w-3.5" /> Excel</Button>}>
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['sales', 'purchase'] as TxType[]).map((t) => (
            <button key={t} type="button" onClick={() => setTxType(t)} className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${txType === t ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}>{TYPE_LABELS[t]}</button>
          ))}
        </div>
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {report && (
          <>
            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]"><tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nomor</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{txType === 'sales' ? 'Pelanggan' : 'Supplier'}</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dibayar</th>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {report.lines.map((line) => (
                    <tr key={line.id} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 font-medium text-[#5c9ead]">{line.number}</td>
                      <td className="px-3 py-1.5 text-[#64748b]">{formatDate(line.date)}</td>
                      <td className="px-3 py-1.5 text-[#334155]">{line.contact_name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#1e293b]">{formatCurrency(line.total_amount)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{line.paid_amount !== undefined ? formatCurrency(line.paid_amount) : '-'}</td>
                      <td className="px-3 py-1.5 text-center"><DocumentStatusBadge status={line.status as DocumentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">{formatCurrency(report.total_amount)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(report.total_paid)}</td>
                    <td />
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
