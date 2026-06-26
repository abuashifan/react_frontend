import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { formatCurrency } from '@/lib/utils'
import { useApReconciliation } from '../hooks/useApData'

export default function ApReconciliationPage() {
  const { data, isLoading } = useApReconciliation()
  const summary = data?.data

  return (
    <WorkspaceLayout
      title="AP Rekonsiliasi"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'AP' }, { label: 'Rekonsiliasi' }]}
    >
      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      ) : summary ? (
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Subledger</p>
            <p className="mt-1 text-[18px] font-semibold tabular-nums text-[#334155]">{formatCurrency(summary.subsidiary_balance)}</p>
          </div>
          <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo GL</p>
            <p className="mt-1 text-[18px] font-semibold tabular-nums text-[#334155]">{formatCurrency(summary.gl_ap_balance)}</p>
          </div>
          <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Selisih</p>
            <p className={`mt-1 text-[18px] font-semibold tabular-nums ${summary.difference !== 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(summary.difference)}</p>
          </div>
          <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</p>
            <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${summary.is_reconciled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{summary.is_reconciled ? 'Sesuai' : 'Selisih'}</p>
          </div>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Tidak ada data rekonsiliasi</div>
      )}
    </WorkspaceLayout>
  )
}
