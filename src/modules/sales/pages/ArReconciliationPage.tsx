import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { formatCurrency } from '@/lib/utils'
import { useArReconciliation } from '../hooks/useArData'

export default function ArReconciliationPage() {
  const { data, isLoading } = useArReconciliation()
  const rows = data?.data ?? []

  return (
    <WorkspaceLayout
      title="AR Rekonsiliasi"
      breadcrumb={[{ label: 'Sales' }, { label: 'AR' }, { label: 'Rekonsiliasi' }]}
    >
      <p className="mb-3 text-[13px] text-[#64748b]">
        Rekonsiliasi antara saldo AR di buku besar vs saldo per invoice.
      </p>

      <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#eeeeee]">
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Akun</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Saldo Buku Besar</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Saldo AR</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-[#94a3b8]">Memuat data...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada data rekonsiliasi</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                    <td className="px-3 py-2.5 font-medium text-[#24323a]">
                      <span className="text-[11px] text-[#94a3b8] mr-1">{row.account_code}</span>
                      {row.account_name}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(row.gl_balance)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(row.ar_balance)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span className={row.difference === 0 ? 'text-[#065F46] font-medium' : 'text-[#991B1B] font-semibold'}>
                        {formatCurrency(row.difference)}{row.difference === 0 ? ' ✓' : ''}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
