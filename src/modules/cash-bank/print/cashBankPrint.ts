import type { TransactionPrintData } from '@/components/shared/print/TransactionDocumentPrint'
import { contactParty, printDate, printMoney } from '@/components/shared/print/printHelpers'
import { terbilang } from '@/lib/terbilang'
import type { BankTransfer, CashPayment, CashReceipt } from '../types/cashBank.types'

function cashVoucher(
  doc: CashReceipt | CashPayment,
  kind: { title: string; partyLabel: string; accountLabel: string; signatures: string[] },
  date: string,
): TransactionPrintData {
  return {
    title: kind.title,
    number: doc.number,
    status: doc.status,
    party: doc.contact ? contactParty(kind.partyLabel, doc.contact) : undefined,
    meta: [
      { label: 'Tanggal', value: printDate(date) },
      { label: kind.accountLabel, value: doc.cash_bank_account?.name ?? '-' },
      ...(doc.created_by_name ? [{ label: 'Dibuat oleh', value: doc.created_by_name }] : []),
    ],
    columns: [
      { key: 'account', header: 'Akun', width: '30%' },
      { key: 'desc', header: 'Keterangan', width: '44%' },
      { key: 'amount', header: 'Jumlah', align: 'right', width: '22%' },
    ],
    rows: doc.lines.map((l) => ({
      account: l.account ? `${l.account.code} ${l.account.name}` : `#${l.account_id}`,
      desc: l.description ?? '',
      amount: printMoney(l.amount),
    })),
    totals: [{ label: 'Total', value: printMoney(doc.amount), strong: true }],
    amountInWords: terbilang(doc.amount),
    notes: doc.notes,
    signatures: kind.signatures,
  }
}

export function bankTransferPrint(t: BankTransfer): TransactionPrintData {
  return {
    title: 'Bukti Transfer Kas/Bank',
    number: t.number,
    status: t.status,
    meta: [
      { label: 'Tanggal', value: printDate(t.transfer_date) },
      ...(t.created_by_name ? [{ label: 'Dibuat oleh', value: t.created_by_name }] : []),
    ],
    columns: [
      { key: 'from', header: 'Dari', width: '37%' },
      { key: 'to', header: 'Ke', width: '37%' },
      { key: 'amount', header: 'Jumlah', align: 'right', width: '22%' },
    ],
    rows: [{
      from: t.from_cash_bank_account ? `${t.from_cash_bank_account.code} ${t.from_cash_bank_account.name}` : `#${t.from_cash_bank_account_id}`,
      to: t.to_cash_bank_account ? `${t.to_cash_bank_account.code} ${t.to_cash_bank_account.name}` : `#${t.to_cash_bank_account_id}`,
      amount: printMoney(t.amount),
    }],
    totals: [{ label: 'Total', value: printMoney(t.amount), strong: true }],
    amountInWords: terbilang(t.amount),
    notes: t.notes,
    signatures: ['Dibuat oleh', 'Disetujui'],
  }
}

export const cashReceiptPrint = (r: CashReceipt) =>
  cashVoucher(r, { title: 'Bukti Kas Masuk', partyLabel: 'Diterima dari', accountLabel: 'Masuk ke', signatures: ['Penyetor', 'Kasir', 'Disetujui'] }, r.receipt_date)

export const cashPaymentPrint = (p: CashPayment) =>
  cashVoucher(p, { title: 'Bukti Kas Keluar', partyLabel: 'Dibayarkan kepada', accountLabel: 'Keluar dari', signatures: ['Penerima', 'Kasir', 'Disetujui'] }, p.payment_date)
