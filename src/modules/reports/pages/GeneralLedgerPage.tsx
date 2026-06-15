import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileDown, ChevronDown, ChevronRight } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { reportsApi } from '../services/reportsApi'
import { useReportExport } from '../hooks/useReportExport'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReportParams, GeneralLedgerGroup } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

function AccountGroup({ group }: { group: GeneralLedgerGroup }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <>
      <tr className="cursor-pointer bg-[#f1f5f9] hover:bg-[#e8edf3]" onClick={() => setExpanded((p) => !p)}>
        <td className="px-3 py-2" colSpan={6}>
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#64748b]" />}
            <span className="text-[12px] font-semibold text-[#1e293b]">{group.account_code} — {group.account_name}</span>
            <span className="ml-auto text-[11px] text-[#64748b]">Saldo awal: {formatCurrency(group.opening_balance)} | Debit: {formatCurrency(group.total_debit)} | Kredit: {formatCurrency(group.total_credit)} | Saldo akhir: {formatCurrency(group.closing_balance)}</span>
          </div>
        </td>
      </tr>
      {expanded && group.lines.map((line, i) => (
        <tr key={i} className="hover:bg-[#f8fafc]/50">
          <td className="px-3 py-1 text-[12px] text-[#64748b]">{formatDate(line.date)}</td>
          <td className="px-3 py-1 text-[12px] text-[#64748b]">{line.journal_number ?? '-'}</td>
          <td className="px-3 py-1 text-[12px] text-[#334155]">{line.description ?? '-'}</td>
          <td className="px-3 py-1 text-right tabular-nums text-[12px] text-green-700">{line.debit ? formatCurrency(line.debit) : '-'}</td>
          <td className="px-3 py-1 text-right tabular-nums text-[12px] text-red-600">{line.credit ? formatCurrency(line.credit) : '-'}</td>
          <td className="px-3 py-1 text-right tabular-nums text-[12px] font-medium text-[#1e293b]">{formatCurrency(line.balance)}</td>
        </tr>
      ))}
    </>
  )
}

export default function GeneralLedgerPage() {
  const [params, setParams] = useState<ReportParams>({ date_from: firstOfMonth, date_to: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [showFilter, setShowFilter] = useState(true)
  const { exportPdf, exportExcel, isExportingPdf, isExportingExcel } = useReportExport('general-ledger')

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'general-ledger', activeParams], queryFn: () => reportsApi.generalLedger(activeParams!), enabled: !!activeParams })
  const report = data?.data
  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Buku Besar" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Buku Besar' }]}
      action={activeParams && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void exportPdf(activeParams)} disabled={isExportingPdf}><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void exportExcel(activeParams)} disabled={isExportingExcel}><FileDown className="mr-1 h-3.5 w-3.5" /> Excel</Button>
        </div>
      )}>
      <div className="space-y-4">
        {showFilter ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} isLoading={isLoading} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} />}
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {report && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No. Jurnal</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keterangan</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {report.accounts.map((group) => <AccountGroup key={group.account_id} group={group} />)}
                {report.accounts.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-[#94a3b8]">Tidak ada transaksi pada periode ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
