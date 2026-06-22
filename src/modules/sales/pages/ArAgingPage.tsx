import { useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { useArAging } from '../hooks/useArData'
import { kontakApi } from '@/modules/master-data/services/kontakApi'

export default function ArAgingPage() {
  const [filterCustomer, setFilterCustomer] = useState<number | undefined>()
  const [asOf, setAsOf] = useState('')

  const query = useArAging({
    as_of_date: asOf || undefined,
    customer_id: filterCustomer,
  })

  const aging = query.data?.data
  const rows = aging?.rows ?? []
  const totals = aging?.totals

  const thClass = 'px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]'
  const tdRight = 'px-3 py-2.5 text-right tabular-nums'

  return (
    <WorkspaceLayout
      title="AR Aging"
      breadcrumb={[{ label: 'Sales' }, { label: 'AR' }, { label: 'Aging' }]}
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

      {query.isError ? (
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="AR Aging gagal dimuat" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#eeeeee]">
                  <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Customer</th>
                  <th className={thClass}>Current</th>
                  <th className={thClass}>1-30 Hari</th>
                  <th className={thClass}>31-60 Hari</th>
                  <th className={thClass}>61-90 Hari</th>
                  <th className={thClass}>&gt;90 Hari</th>
                  <th className={thClass + ' font-extrabold'}>Total</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Memuat data...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada data aging</td></tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.customer_id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                      <td className="px-3 py-2.5 font-medium text-[#24323a]">{row.customer_name}</td>
                      <td className={tdRight}>{formatCurrency(row.current)}</td>
                      <td className={tdRight}>
                        <span className={row.days_1_30 > 0 ? 'text-[#B45309]' : 'text-[#94a3b8]'}>{formatCurrency(row.days_1_30)}</span>
                      </td>
                      <td className={tdRight}>
                        <span className={row.days_31_60 > 0 ? 'text-[#C2410C]' : 'text-[#94a3b8]'}>{formatCurrency(row.days_31_60)}</span>
                      </td>
                      <td className={tdRight}>
                        <span className={row.days_61_90 > 0 ? 'text-[#991B1B]' : 'text-[#94a3b8]'}>{formatCurrency(row.days_61_90)}</span>
                      </td>
                      <td className={tdRight}>
                        <span className={row.days_over_90 > 0 ? 'font-semibold text-[#991B1B]' : 'text-[#94a3b8]'}>{formatCurrency(row.days_over_90)}</span>
                      </td>
                      <td className={tdRight + ' font-semibold'}>{formatCurrency(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {rows.length > 0 && totals && (
                <tfoot>
                  <tr className="border-t-2 border-[#d9e2e5] bg-[#f8fbfc]">
                    <td className="px-3 py-2.5 text-[11px] font-bold uppercase text-[#64748b]">Total</td>
                    <td className={tdRight + ' font-bold'}>{formatCurrency(totals.current)}</td>
                    <td className={tdRight + ' font-bold text-[#B45309]'}>{formatCurrency(totals.days_1_30)}</td>
                    <td className={tdRight + ' font-bold text-[#C2410C]'}>{formatCurrency(totals.days_31_60)}</td>
                    <td className={tdRight + ' font-bold text-[#991B1B]'}>{formatCurrency(totals.days_61_90)}</td>
                    <td className={tdRight + ' font-bold text-[#991B1B]'}>{formatCurrency(totals.days_over_90)}</td>
                    <td className={tdRight + ' text-[15px] font-extrabold'}>{formatCurrency(totals.total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  )
}
