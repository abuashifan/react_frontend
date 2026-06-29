import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams, ReconciliationReport, GrniReconciliationReport, DepositReconciliationReport } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)

type ReconType = 'ar' | 'ap' | 'inventory' | 'grni' | 'customer_deposits' | 'vendor_deposits'
const RECON_LABELS: Record<ReconType, string> = {
  ar: 'Piutang (AR)',
  ap: 'Hutang (AP)',
  inventory: 'Inventori',
  grni: 'GRNI',
  customer_deposits: 'Deposit Pelanggan',
  vendor_deposits: 'Deposit Pemasok',
}

// ─── Sub-ledger vs GL table (AR / AP / Inventory) ───────────────────────────

function ReconTable({ report }: { report: ReconciliationReport }) {
  return (
    <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
      <table className="w-full text-[12px]">
        <thead className="bg-[#f8fafc]">
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun / Entitas</th>
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

// ─── GRNI table ──────────────────────────────────────────────────────────────

function GrniTable({ report }: { report: GrniReconciliationReport }) {
  const s = report.summary
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <p className="text-[11px] text-[#64748b]">Qty Outstanding</p>
          <p className="text-[14px] font-semibold tabular-nums text-[#334155]">{s.total_outstanding_quantity.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <p className="text-[11px] text-[#64748b]">Estimasi Nilai</p>
          <p className="text-[14px] font-semibold tabular-nums text-[#334155]">{formatCurrency(s.total_estimated_outstanding_amount)}</p>
        </div>
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <p className="text-[11px] text-[#64748b]">Saldo GL Interim</p>
          <p className="text-[14px] font-semibold tabular-nums text-[#334155]">{formatCurrency(s.total_grni_gl_balance_related)}</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${s.mismatch_count > 0 ? 'border-red-200 bg-red-50' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
          <p className="text-[11px] text-[#64748b]">Selisih</p>
          <p className={`text-[14px] font-semibold tabular-nums ${s.mismatch_count > 0 ? 'text-red-600' : 'text-green-700'}`}>{s.mismatch_count} baris</p>
        </div>
      </div>
      <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
        <table className="w-full text-[12px]">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No Penerimaan</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pemasok</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Produk</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Diterima</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Ditagih</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Outstanding</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Estimasi Nilai</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo GL</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Selisih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {report.data.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-6 text-center text-[12px] text-[#64748b]">Tidak ada data GRNI</td></tr>
            )}
            {report.data.map((r) => (
              <tr key={r.goods_receipt_id} className={`hover:bg-[#f8fafc] ${r.status === 'mismatch' ? 'bg-red-50/30' : ''}`}>
                <td className="px-3 py-1.5 font-mono text-[11px] text-[#334155]">{r.receipt_number}</td>
                <td className="px-3 py-1.5 text-[#64748b]">{r.receipt_date}</td>
                <td className="px-3 py-1.5 text-[#334155]">{r.vendor_name ?? '-'}</td>
                <td className="px-3 py-1.5 text-[#334155]">{r.product_name ?? '-'}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.received_quantity.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.billed_quantity.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{r.outstanding_quantity.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(r.estimated_outstanding_amount)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(r.grni_gl_balance_related)}</td>
                <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${r.status === 'mismatch' ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(r.difference)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Deposit table (customer & vendor share same shape) ──────────────────────

const DEPOSIT_STATUS_LABEL: Record<string, string> = {
  posted: 'Diposting',
  partially_allocated: 'Sebagian',
  refunded: 'Dikembalikan',
}

function DepositTable({ report, contactLabel }: { report: DepositReconciliationReport; contactLabel: string }) {
  const s = report.summary
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <p className="text-[11px] text-[#64748b]">Total Deposit</p>
          <p className="text-[14px] font-semibold tabular-nums text-[#334155]">{formatCurrency(s.total_deposit)}</p>
        </div>
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <p className="text-[11px] text-[#64748b]">Dialokasikan</p>
          <p className="text-[14px] font-semibold tabular-nums text-[#334155]">{formatCurrency(s.total_allocated)}</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${s.total_unapplied > 0 ? 'border-amber-200 bg-amber-50' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
          <p className="text-[11px] text-[#64748b]">Belum Dialokasikan</p>
          <p className={`text-[14px] font-semibold tabular-nums ${s.total_unapplied > 0 ? 'text-amber-700' : 'text-green-700'}`}>{formatCurrency(s.total_unapplied)}</p>
        </div>
      </div>
      <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
        <table className="w-full text-[12px]">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">No Deposit</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{contactLabel}</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dialokasikan</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sisa</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {report.data.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-[12px] text-[#64748b]">Tidak ada data deposit</td></tr>
            )}
            {report.data.map((r) => (
              <tr key={r.deposit_id} className={`hover:bg-[#f8fafc] ${r.remaining_amount > 0 ? 'bg-amber-50/20' : ''}`}>
                <td className="px-3 py-1.5 font-mono text-[11px] text-[#334155]">{r.deposit_number}</td>
                <td className="px-3 py-1.5 text-[#64748b]">{r.deposit_date ?? '-'}</td>
                <td className="px-3 py-1.5 text-[#334155]">{r.contact_name ?? r.contact_number}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{formatCurrency(r.amount)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(r.allocated_amount)}</td>
                <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${r.remaining_amount > 0 ? 'text-amber-700' : 'text-green-700'}`}>{formatCurrency(r.remaining_amount)}</td>
                <td className="px-3 py-1.5 text-[#64748b]">{DEPOSIT_STATUS_LABEL[r.status] ?? r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReconciliationPage() {
  const [params, setParams] = useState<ReportParams>({ as_of_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)
  const [activeType, setActiveType] = useState<ReconType>('ar')
  const [showFilter, setShowFilter] = useState(true)

  const isSubledgerType = activeType === 'ar' || activeType === 'ap' || activeType === 'inventory'
  const isGrniType = activeType === 'grni'

  const fetchFn = activeType === 'ar'
    ? reportsApi.reconciliationAr
    : activeType === 'ap'
      ? reportsApi.reconciliationAp
      : activeType === 'inventory'
        ? reportsApi.reconciliationInventory
        : null

  const { data: subData, isLoading: loadingSub, isError: errSub, refetch: refetchSub } = useQuery({
    queryKey: ['reports', 'reconciliation', activeType, activeParams],
    queryFn: () => fetchFn!(activeParams!),
    enabled: !!activeParams && isSubledgerType,
  })

  const { data: grniData, isLoading: loadingGrni, isError: errGrni, refetch: refetchGrni } = useQuery({
    queryKey: ['reports', 'reconciliation', 'grni', activeParams],
    queryFn: () => reportsApi.reconciliationGrni(activeParams!),
    enabled: !!activeParams && isGrniType,
  })

  const { data: custData, isLoading: loadingCust, isError: errCust, refetch: refetchCust } = useQuery({
    queryKey: ['reports', 'reconciliation', 'customer-deposits', activeParams],
    queryFn: () => reportsApi.reconciliationCustomerDeposits(activeParams!),
    enabled: !!activeParams && activeType === 'customer_deposits',
  })

  const { data: vendData, isLoading: loadingVend, isError: errVend, refetch: refetchVend } = useQuery({
    queryKey: ['reports', 'reconciliation', 'vendor-deposits', activeParams],
    queryFn: () => reportsApi.reconciliationVendorDeposits(activeParams!),
    enabled: !!activeParams && activeType === 'vendor_deposits',
  })

  const isLoading = loadingSub || loadingGrni || loadingCust || loadingVend
  const isError = errSub || errGrni || errCust || errVend
  const refetch = isSubledgerType ? refetchSub : isGrniType ? refetchGrni : activeType === 'customer_deposits' ? refetchCust : refetchVend

  const handleSubmit = () => { setActiveParams({ ...params }); setShowFilter(false) }

  return (
    <WorkspaceLayout title="Rekonsiliasi" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Rekonsiliasi' }]}>
      <div className="space-y-4">
        <div role="tablist" aria-label="Tab Rekonsiliasi" className="flex flex-wrap gap-2">
          {(['ar', 'ap', 'inventory', 'grni', 'customer_deposits', 'vendor_deposits'] as ReconType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={activeType === t}
              onClick={() => setActiveType(t)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${activeType === t ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
            >
              {RECON_LABELS[t]}
            </button>
          ))}
        </div>

        {showFilter
          ? <ReportFilterParameter params={params} onChange={(p) => setParams((prev) => ({ ...prev, ...p }))} onSubmit={handleSubmit} mode="as_of_date" isLoading={isLoading} extras={{ only_difference: true }} />
          : <ReportCompactBar params={activeParams!} onEdit={() => setShowFilter(true)} mode="as_of_date" />}

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && isSubledgerType && subData?.data && <ReconTable report={subData.data} />}
        {!isLoading && !isError && isGrniType && grniData?.data && <GrniTable report={grniData.data} />}
        {!isLoading && !isError && activeType === 'customer_deposits' && custData?.data && <DepositTable report={custData.data} contactLabel="Pelanggan" />}
        {!isLoading && !isError && activeType === 'vendor_deposits' && vendData?.data && <DepositTable report={vendData.data} contactLabel="Pemasok" />}
      </div>
    </WorkspaceLayout>
  )
}
