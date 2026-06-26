import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { formatCurrency } from '@/lib/utils'
import { useApAging } from '../hooks/useApData'

export default function ApAgingPage() {
  const { data, isLoading } = useApAging()
  const report = data?.data
  const rows = report?.lines ?? []
  const totals = report?.totals ?? { current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, days_over_90: 0, total: 0 }

  return (
    <WorkspaceLayout
      title="AP Aging"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'AP' }, { label: 'Aging' }]}
    >
      {report && <p className="mb-3 text-[12px] text-[#64748b]">As of {report.as_of_date}</p>}
      <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#eeeeee]">
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Vendor</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Current</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">1–30 Hari</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">31–60 Hari</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">61–90 Hari</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#94a3b8]">&gt;90 Hari</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Memuat data...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada data aging</td></tr>
              ) : rows.map((line) => (
                <tr key={line.contact_id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                  <td className="px-3 py-2.5 font-medium text-[#334155]">{line.contact_name}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(line.buckets.current)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(line.buckets.days_1_30)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={line.buckets.days_31_60 > 0 ? 'text-amber-600' : ''}>{formatCurrency(line.buckets.days_31_60)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={line.buckets.days_61_90 > 0 ? 'font-semibold text-orange-600' : ''}>{formatCurrency(line.buckets.days_61_90)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={line.buckets.days_over_90 > 0 ? 'font-semibold text-red-600' : ''}>{formatCurrency(line.buckets.days_over_90)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatCurrency(line.buckets.total)}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#d9e2e5] bg-[#f8fafc]">
                  <td className="px-3 py-2.5 text-[11px] font-bold uppercase text-[#64748b]">Total</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{formatCurrency(totals.current)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{formatCurrency(totals.days_1_30)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{formatCurrency(totals.days_31_60)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{formatCurrency(totals.days_61_90)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{formatCurrency(totals.days_over_90)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{formatCurrency(totals.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
