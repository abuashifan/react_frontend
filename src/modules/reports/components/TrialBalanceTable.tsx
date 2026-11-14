import { formatCurrency, formatNumber } from '@/lib/utils'
import type { TrialBalanceAccount, TrialBalanceTotals } from '../types/reports.types'

interface TrialBalanceTableProps {
  accounts: TrialBalanceAccount[]
  totals?: TrialBalanceTotals
  /** Kolom yang sedang dicentang user (kunci seperti `account_code`, `opening_debit`). */
  visibleColumns: string[]
}

const HEAD = 'px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]'
/** Sel angka: tidak boleh terbungkus, supaya "1.777.500.000" tidak pecah jadi dua baris. */
const NUM = 'whitespace-nowrap px-1.5 text-right tabular-nums'

/** Angka tanpa simbol "Rp" (mata uang dinyatakan di atas tabel); nol ditulis "-". */
const amount = (value: number) => (value ? formatNumber(value) : '-')

/**
 * Tabel Neraca Saldo untuk dokumen cetak.
 *
 * Tabel memakai lebar alaminya (`w-max min-w-full`) supaya kolom angka tidak
 * ditekan dan nama akun tidak terbungkus berlebihan; `ReportPrintDocument`
 * yang mengecilkannya agar muat di kertas. Versi lama memakai `w-full` dengan
 * "Rp 1.777.500.000" di enam kolom, jadi pada A4 portrait kolom terakhir
 * meluap keluar halaman.
 */
export function TrialBalanceTable({ accounts, totals, visibleColumns }: TrialBalanceTableProps) {
  const show = (key: string) => visibleColumns.includes(key)

  return (
    <table className="w-max min-w-full text-[12px]">
      <thead>
        <tr className="report-print-avoid-break border-b border-[#cbd5e1]">
          {show('account_code') && <th className={`${HEAD} text-left`}>Kode</th>}
          {show('account_name') && <th className={`${HEAD} text-left`}>Akun</th>}
          {show('opening_debit') && <th className={`${HEAD} text-right`}>Debit Awal</th>}
          {show('opening_credit') && <th className={`${HEAD} text-right`}>Kredit Awal</th>}
          {show('period_debit') && <th className={`${HEAD} text-right`}>Debit Periode</th>}
          {show('period_credit') && <th className={`${HEAD} text-right`}>Kredit Periode</th>}
          {show('ending_debit') && <th className={`${HEAD} text-right`}>Debit Akhir</th>}
          {show('ending_credit') && <th className={`${HEAD} text-right`}>Kredit Akhir</th>}
        </tr>
      </thead>
      <tbody>
        {accounts.map((l) => (
          <tr key={l.account_id}>
            {show('account_code') && <td className="whitespace-nowrap px-1.5 py-0.5 text-[#64748b]">{l.account_code}</td>}
            {/* Nama panjang boleh turun satu-dua baris, tapi tidak lebih lebar dari ±55 mm. */}
            {show('account_name') && <td className="max-w-[55mm] px-1.5 py-0.5 text-[#1e293b]">{l.account_name}</td>}
            {show('opening_debit') && <td className={`${NUM} py-0.5`}>{amount(l.opening_debit)}</td>}
            {show('opening_credit') && <td className={`${NUM} py-0.5`}>{amount(l.opening_credit)}</td>}
            {show('period_debit') && <td className={`${NUM} py-0.5`}>{amount(l.period_debit)}</td>}
            {show('period_credit') && <td className={`${NUM} py-0.5`}>{amount(l.period_credit)}</td>}
            {show('ending_debit') && <td className={`${NUM} py-0.5 font-medium`}>{amount(l.ending_debit)}</td>}
            {show('ending_credit') && <td className={`${NUM} py-0.5 font-medium`}>{amount(l.ending_credit)}</td>}
          </tr>
        ))}
        {accounts.length === 0 && (
          <tr><td colSpan={visibleColumns.length} className="py-8 text-center text-[#94a3b8]">Tidak ada saldo akun pada periode ini.</td></tr>
        )}
      </tbody>
      {totals && (
        <tfoot>
          <tr className="report-print-avoid-break border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
            {(show('account_code') || show('account_name')) && (
              <td colSpan={['account_code', 'account_name'].filter(show).length} className="px-1.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
            )}
            {show('opening_debit') && <td className={`${NUM} py-1.5 font-bold`}>{formatNumber(totals.opening_debit)}</td>}
            {show('opening_credit') && <td className={`${NUM} py-1.5 font-bold`}>{formatNumber(totals.opening_credit)}</td>}
            {show('period_debit') && <td className={`${NUM} py-1.5 font-bold`}>{formatNumber(totals.period_debit)}</td>}
            {show('period_credit') && <td className={`${NUM} py-1.5 font-bold`}>{formatNumber(totals.period_credit)}</td>}
            {show('ending_debit') && <td className={`${NUM} py-1.5 font-bold`}>{formatNumber(totals.ending_debit)}</td>}
            {show('ending_credit') && <td className={`${NUM} py-1.5 font-bold`}>{formatNumber(totals.ending_credit)}</td>}
          </tr>
          {!totals.is_balanced && (
            <tr>
              <td colSpan={visibleColumns.length} className="px-1.5 py-1.5 text-[12px] font-medium text-red-600">
                ⚠ Tidak seimbang — selisih: {formatCurrency(totals.difference)}
              </td>
            </tr>
          )}
        </tfoot>
      )}
    </table>
  )
}
