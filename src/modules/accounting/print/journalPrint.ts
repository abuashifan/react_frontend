import type { TransactionPrintData } from '@/components/shared/print/TransactionDocumentPrint'
import { printDate, printMoney } from '@/components/shared/print/printHelpers'
import type { JournalEntry } from '../types/journalEntry.types'

export function journalEntryPrint(j: JournalEntry): TransactionPrintData {
  const debit = j.total_debit ?? j.lines.reduce((s, l) => s + Number(l.debit || 0), 0)
  const credit = j.total_credit ?? j.lines.reduce((s, l) => s + Number(l.credit || 0), 0)
  return {
    title: 'Bukti Jurnal',
    number: j.journal_number,
    status: j.status,
    meta: [
      { label: 'Tanggal', value: printDate(j.journal_date) },
      ...(j.source_number ? [{ label: 'Sumber', value: j.source_number }] : []),
      ...(j.created_by_name ? [{ label: 'Dibuat oleh', value: j.created_by_name }] : []),
    ],
    columns: [
      { key: 'account', header: 'Akun', width: '30%' },
      { key: 'desc', header: 'Keterangan', width: '34%' },
      { key: 'debit', header: 'Debit', align: 'right', width: '16%' },
      { key: 'credit', header: 'Kredit', align: 'right', width: '16%' },
    ],
    rows: [...j.lines].sort((a, b) => a.line_order - b.line_order).map((l) => ({
      account: l.account ? `${l.account.account_code} ${l.account.account_name}` : `#${l.account_id}`,
      desc: [l.description, l.department?.name, l.project?.name].filter(Boolean).join(' · '),
      debit: Number(l.debit) ? printMoney(l.debit) : '',
      credit: Number(l.credit) ? printMoney(l.credit) : '',
    })),
    totals: [
      { label: 'Total debit', value: printMoney(debit), strong: true },
      { label: 'Total kredit', value: printMoney(credit), strong: true },
    ],
    notes: j.description,
    signatures: ['Dibuat oleh', 'Diperiksa', 'Disetujui'],
  }
}
