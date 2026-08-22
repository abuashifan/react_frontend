import { cn, formatCurrency } from '@/lib/utils'
import type { ProjectFinancialBlock } from '../types/budget.types'

/**
 * Blok Pendapatan / Biaya / Laba / Margin untuk satu sisi (anggaran atau
 * realisasi). Dipakai `ProjectFinancialSummaryPage` dan tab Anggaran di
 * `ProyekFormPage` — bentuknya sengaja identik supaya kedua sisi bisa
 * dibandingkan sekilas.
 */
export function FinancialBlock({ title, block }: { title: string; block: ProjectFinancialBlock }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">{title}</p>
      <dl className="space-y-1.5 text-[12px]">
        <div className="flex justify-between">
          <dt className="text-[#64748b]">Pendapatan</dt>
          <dd className="tabular-nums">{formatCurrency(parseFloat(block.revenue))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[#64748b]">Biaya</dt>
          <dd className="tabular-nums">{formatCurrency(parseFloat(block.cost))}</dd>
        </div>
        <div className="flex justify-between border-t border-[#e2e8f0] pt-1.5">
          <dt className="font-semibold text-[#334155]">Laba</dt>
          <dd
            className={cn(
              'font-bold tabular-nums',
              parseFloat(block.profit) < 0 ? 'text-red-600' : 'text-green-700',
            )}
          >
            {formatCurrency(parseFloat(block.profit))}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[#64748b]">Margin</dt>
          {/* null = tidak ada pendapatan sama sekali, bukan margin 0%. */}
          <dd className="tabular-nums text-[#334155]">
            {block.margin_pct !== null ? `${block.margin_pct.toFixed(1)}%` : '—'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

export function VarianceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[#64748b]">{label}</dt>
      <dd
        className={cn(
          'tabular-nums font-semibold',
          parseFloat(value) < 0 ? 'text-red-600' : 'text-green-700',
        )}
      >
        {formatCurrency(parseFloat(value))}
      </dd>
    </div>
  )
}
