import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import { budgetApi } from '../services/budgetApi'
import { useCashBudget } from '../hooks/useCashBudget'
import type { BudgetParams } from '../types/budget.types'

const SECTION_LABELS: Record<string, string> = {
  operating: 'Operasi',
  investing: 'Investasi',
  financing: 'Pendanaan',
}

/**
 * Cash Budget — lahir dari baris anggaran yang sama dengan Revenue/Expense
 * Budget, bukan angka terpisah. Tidak ada cash ledger baru di belakangnya.
 */
export default function CashBudgetPage() {
  const [periodIdStr, setPeriodIdStr] = useState('')
  const [params, setParams] = useState<BudgetParams>({})

  const { data: periodsData } = useQuery({
    queryKey: ['budget', 'periods'],
    queryFn: budgetApi.listPeriods,
  })
  const periods = periodsData?.data ?? []

  const { data, isLoading, isError } = useCashBudget(params)
  const cash = data?.data

  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2.5 lg:px-6">
      <div>
        <Label htmlFor="cash-period" className="text-[11px] text-[#64748b]">
          Periode Anggaran <span className="text-red-500">*</span>
        </Label>
        <Select value={periodIdStr} onValueChange={setPeriodIdStr}>
          <SelectTrigger id="cash-period" className="h-8 w-52 text-[12px]">
            <SelectValue placeholder="Pilih periode..." />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.id} value={String(period.id)}>{period.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="sm"
        onClick={() => periodIdStr && setParams({ budget_period_id: Number(periodIdStr) })}
        disabled={!periodIdStr || isLoading}
      >
        {isLoading ? 'Memuat...' : 'Tampilkan'}
      </Button>
    </div>
  )

  return (
    <WorkspaceLayout hideHeader toolbar={toolbar}>
      <div className="space-y-4">
        {!params.budget_period_id && !isError && (
          <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
            Pilih periode anggaran lalu klik Tampilkan.
          </p>
        )}

        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            Gagal memuat cash budget.
          </div>
        )}

        {cash && (
          <>
            {/* Asumsi akrual wajib terlihat di UI, bukan hanya tertulis di dokumen —
                tanpa ini angka di bawah mudah disalahpahami sebagai proyeksi kas. */}
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{cash.meta.assumption}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(['budgeted', 'actual'] as const).map((bucket) => (
                <div key={bucket} className="rounded-lg border border-[#e2e8f0] bg-white p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                    {bucket === 'budgeted' ? 'Anggaran' : 'Realisasi'}
                  </p>
                  <dl className="space-y-1.5 text-[12px]">
                    <Row label="Saldo Awal Kas" value={cash.beginning_cash} />
                    <Row label="Kas Masuk" value={cash[bucket].inflow} />
                    <Row label="Kas Keluar" value={cash[bucket].outflow} negative />
                    <div className="flex justify-between border-t border-[#e2e8f0] pt-1.5">
                      <dt className="font-semibold text-[#334155]">Saldo Akhir Kas</dt>
                      <dd
                        className={cn(
                          'font-bold tabular-nums',
                          parseFloat(cash[bucket].ending_cash) < 0 ? 'text-red-600' : 'text-[#1e293b]',
                        )}
                      >
                        {formatCurrency(parseFloat(cash[bucket].ending_cash))}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#64748b]">
              Saldo awal{' '}
              {cash.beginning_cash_source === 'override'
                ? 'diambil dari nilai override periode ini.'
                : 'dihitung dari saldo akun kas/bank di buku besar sehari sebelum periode dimulai.'}
            </p>

            {cash.sections.length > 0 && (
              <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#1e293b]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Klasifikasi</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Masuk (Anggaran)</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Keluar (Anggaran)</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Net (Anggaran)</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Net (Realisasi)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {cash.sections.map((section) => (
                      <tr key={section.section} className="hover:bg-[#f8fafc]">
                        <td className="px-3 py-1.5 text-[#334155]">
                          {SECTION_LABELS[section.section] ?? section.section}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(section.budgeted_inflow))}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(section.budgeted_outflow))}</td>
                        <td className="px-3 py-1.5 text-right font-medium tabular-nums">{formatCurrency(parseFloat(section.budgeted_net))}</td>
                        <td className="px-3 py-1.5 text-right font-medium tabular-nums">{formatCurrency(parseFloat(section.actual_net))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[#64748b]">{label}</dt>
      <dd className={cn('tabular-nums', negative && 'text-[#334155]')}>
        {negative ? '(' : ''}
        {formatCurrency(parseFloat(value))}
        {negative ? ')' : ''}
      </dd>
    </div>
  )
}
