import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { formatCurrency } from '@/lib/utils'
import { useApReconciliation } from '../hooks/useApData'

export default function ApReconciliationPage() {
  const { data, isLoading } = useApReconciliation()
  const rows = data?.data ?? []

  return (
    <WorkspaceLayout
      title="AP Rekonsiliasi"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'AP' }, { label: 'Rekonsiliasi' }]}
    >
      <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#eeeeee]">
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Kode Akun</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Nama Akun</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Saldo Buku Besar</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Saldo AP</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Selisih</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold uppercase text-[#64748b]">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-[#94a3b8]">Memuat data...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada data rekonsiliasi</td></tr>
              ) : rows.map((row) => (
                <tr key={row.account_id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                  <td className="px-3 py-2.5 font-mono text-[12px] text-[#64748b]">{row.account_code}</td>
                  <td className="px-3 py-2.5 font-medium text-[#334155]">{row.account_name}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(row.gl_balance)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(row.ap_balance)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={row.difference !== 0 ? 'font-semibold text-red-600' : 'text-[#94a3b8]'}>{formatCurrency(row.difference)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.difference === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">✓ Sesuai</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">! Selisih</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
