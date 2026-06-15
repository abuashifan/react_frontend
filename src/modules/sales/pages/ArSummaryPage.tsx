import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { useArCustomerSummary } from '../hooks/useArData'
import { kontakApi } from '@/modules/master-data/services/kontakApi'

export default function ArSummaryPage() {
  const navigate = useNavigate()
  const [filterCustomer, setFilterCustomer] = useState<number | undefined>()
  const [asOf, setAsOf] = useState('')

  const { data, isLoading } = useArCustomerSummary({
    customer_id: filterCustomer,
    as_of: asOf || undefined,
  })

  const rows = data?.data ?? []

  return (
    <WorkspaceLayout
      title="AR Customer Summary"
      breadcrumb={[{ label: 'Sales' }, { label: 'AR' }, { label: 'Customer Summary' }]}
    >
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="w-60">
          <Label className="mb-1 block text-[11px] font-semibold uppercase text-[#64748b]">Customer</Label>
          <SearchableSelect
            value={filterCustomer ?? null}
            onChange={(v) => setFilterCustomer(v ?? undefined)}
            onSearch={(q) => kontakApi.search(q, 'customer')}
            placeholder="Semua customer"
          />
        </div>
        <div>
          <Label className="mb-1 block text-[11px] font-semibold uppercase text-[#64748b]">Per Tanggal</Label>
          <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="h-9 w-36 text-[13px]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#eeeeee]">
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Customer</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Total Piutang</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Overdue</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Saldo Deposit</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold uppercase text-[#64748b]">Invoice Terbuka</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-[#94a3b8]">Memuat data...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada data AR</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.customer_id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/sales/ar/customer-ledger/${row.customer_id}`)}
                        className="font-medium text-[#5c9ead] hover:underline"
                      >
                        {row.customer_name}
                        <span className="ml-1 text-[11px] text-[#94a3b8]">{row.customer_code}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(row.total_receivable)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span className={row.overdue_amount > 0 ? 'font-semibold text-[#991B1B]' : 'text-[#94a3b8]'}>
                        {formatCurrency(row.overdue_amount)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span className={row.deposit_balance > 0 ? 'text-[#065F46]' : 'text-[#94a3b8]'}>
                        {formatCurrency(row.deposit_balance)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-[#64748b]">{row.open_invoice_count}</td>
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
