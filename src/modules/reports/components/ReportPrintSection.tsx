import { formatCurrency } from '@/lib/utils'
import type { ReportSection } from '../types/reports.types'

interface ReportPrintSectionProps {
  section: ReportSection
  /** Style total row lebih tebal untuk grand total per grup (mis. "TOTAL ASET"). */
  emphasizeTotal?: boolean
}

/** Baris satu seksi laporan (label + akun + total) dalam layout satu kolom untuk print-preview. */
export function ReportPrintSection({ section, emphasizeTotal }: ReportPrintSectionProps) {
  return (
    <>
      <tr className="report-print-avoid-break bg-[#f8fafc]">
        <td colSpan={2} className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{section.label}</td>
      </tr>
      {section.accounts.map((item, i) => (
        <tr key={item.account_id ?? `sys-${i}`}>
          <td className="px-2 py-0.5 pl-6 text-[12px] text-[#334155]">{item.account_code ? `${item.account_code} — ` : ''}{item.account_name}</td>
          <td className="px-2 py-0.5 text-right tabular-nums text-[12px] text-[#334155]">{formatCurrency(item.amount)}</td>
        </tr>
      ))}
      {section.accounts.length === 0 && (
        <tr><td colSpan={2} className="px-2 py-0.5 pl-6 text-[12px] text-[#94a3b8]">Tidak ada akun.</td></tr>
      )}
      <tr className={`report-print-avoid-break border-t border-[#e2e8f0] ${emphasizeTotal ? 'bg-[#f1f5f9]' : ''}`}>
        <td className={`px-2 py-1 pl-6 text-[12px] font-semibold text-[#1e293b] ${emphasizeTotal ? 'uppercase' : ''}`}>Total {section.label}</td>
        <td className={`px-2 py-1 text-right tabular-nums text-[12px] font-semibold text-[#1e293b] ${emphasizeTotal ? 'uppercase' : ''}`}>{formatCurrency(section.total)}</td>
      </tr>
    </>
  )
}
