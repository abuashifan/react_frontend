import { useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { useArReconciliation } from '../hooks/useArData'

export default function ArReconciliationPage() {
  const [asOf, setAsOf] = useState('')
  const query = useArReconciliation({
    as_of_date: asOf || undefined,
  })
  const report = query.data?.data

  return (
    <WorkspaceLayout
      title="AR Rekonsiliasi"
      breadcrumb={[{ label: 'Sales' }, { label: 'AR' }, { label: 'Rekonsiliasi' }]}
    >
      <p className="mb-3 text-[13px] text-[#64748b]">
        Rekonsiliasi antara saldo AR di buku besar vs saldo subledger pada cutoff yang sama.
      </p>

      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div>
          <Label className="mb-1 block text-[11px] font-semibold uppercase text-[#64748b]">Per Tanggal</Label>
          <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="h-9 w-36 text-[13px]" />
        </div>
      </div>

      {query.isError ? (
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="AR Rekonsiliasi gagal dimuat" />
      ) : !report ? (
        <div className="rounded-lg border border-dashed border-[#d9e2e5] bg-white px-4 py-10 text-center text-[13px] text-[#94a3b8]">
          Memuat data rekonsiliasi...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[#d9e2e5] bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase text-[#64748b]">Saldo Subledger</div>
              <div className="mt-2 text-[22px] font-semibold tabular-nums text-[#24323a]">{formatCurrency(report.subsidiary_balance)}</div>
            </div>
            <div className="rounded-lg border border-[#d9e2e5] bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase text-[#64748b]">Saldo GL</div>
              <div className="mt-2 text-[22px] font-semibold tabular-nums text-[#24323a]">{formatCurrency(report.gl_ar_balance)}</div>
            </div>
            <div className="rounded-lg border border-[#d9e2e5] bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase text-[#64748b]">Selisih</div>
              <div className={report.is_reconciled ? 'mt-2 text-[22px] font-semibold tabular-nums text-[#065F46]' : 'mt-2 text-[22px] font-semibold tabular-nums text-[#991B1B]'}>
                {formatCurrency(report.difference)}
              </div>
            </div>
          </div>

          <div className={report.is_reconciled ? 'rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[13px] text-[#065F46]' : 'rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#991B1B]'}>
            {report.is_reconciled ? 'AR subledger cocok dengan GL pada cutoff ini.' : 'Ada selisih antara AR subledger dan GL pada cutoff ini.'}
          </div>
        </div>
      )}
    </WorkspaceLayout>
  )
}
