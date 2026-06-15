import { useNavigate } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { formatCurrency } from '@/lib/utils'
import { useApVendorSummary } from '../hooks/useApData'

export default function ApSummaryPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useApVendorSummary()
  const rows = data?.data ?? []

  return (
    <WorkspaceLayout
      title="AP Vendor Summary"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'AP' }, { label: 'Vendor Summary' }]}
    >
      <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#eeeeee]">
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Vendor</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Total Hutang</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Overdue</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Saldo Deposit</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold uppercase text-[#64748b]">Bill Terbuka</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-[#94a3b8]">Memuat data...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada data AP</td></tr>
              ) : rows.map((row) => (
                <tr key={row.vendor_id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                  <td className="px-3 py-2.5">
                    <button type="button" onClick={() => navigate(`/purchase/ap/vendor-ledger/${row.vendor_id}`)} className="font-medium text-[#5c9ead] hover:underline">
                      {row.vendor_name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(row.total_payable)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={row.overdue_amount > 0 ? 'font-semibold text-[#991B1B]' : 'text-[#94a3b8]'}>{formatCurrency(row.overdue_amount)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={row.deposit_balance > 0 ? 'text-[#065F46]' : 'text-[#94a3b8]'}>{formatCurrency(row.deposit_balance)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-[#64748b]">{row.open_bill_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
