import type { TransactionPrintData } from '@/components/shared/print/TransactionDocumentPrint'
import { contactParty, lineAmount, lineItem, printDate, printMoney, printQty } from '@/components/shared/print/printHelpers'
import { terbilang } from '@/lib/terbilang'
import type { SalesInvoice } from '../types/salesInvoice.types'
import type { DeliveryOrder } from '../types/deliveryOrder.types'
import type { SalesReceipt } from '../types/salesReceipt.types'
import type { SalesQuotation } from '../types/quotation.types'
import type { SalesOrder } from '../types/salesOrder.types'
import type { ProformaInvoice } from '../types/proforma.types'
import type { SalesReturn } from '../types/salesReturn.types'
import type { CustomerDeposit } from '../types/customerDeposit.types'

export function salesInvoicePrint(inv: SalesInvoice): TransactionPrintData {
  return {
    title: 'Invoice',
    number: inv.number,
    status: inv.status,
    party: contactParty('Kepada', inv.customer),
    meta: [
      { label: 'Tanggal', value: printDate(inv.date) },
      { label: 'Jatuh tempo', value: printDate(inv.due_date) },
      { label: 'Syarat bayar', value: inv.payment_term?.name ?? '-' },
      ...(inv.sales_order_number ? [{ label: 'No. SO', value: inv.sales_order_number }] : []),
      ...(inv.delivery_order_number ? [{ label: 'No. Surat Jalan', value: inv.delivery_order_number }] : []),
    ],
    columns: [
      { key: 'item', header: 'Barang / Jasa', width: '40%' },
      { key: 'qty', header: 'Qty', align: 'right', width: '9%' },
      { key: 'price', header: 'Harga', align: 'right', width: '15%' },
      { key: 'disc', header: 'Disk.', align: 'right', width: '8%' },
      { key: 'tax', header: 'Pajak', align: 'right', width: '8%' },
      { key: 'total', header: 'Jumlah', align: 'right', width: '16%' },
    ],
    rows: inv.lines.map((l) => ({
      item: lineItem(l.product, l.description),
      qty: printQty(l.quantity),
      price: printMoney(l.unit_price),
      disc: l.discount_percent ? `${printQty(l.discount_percent)}%` : '-',
      tax: l.tax_percent ? `${printQty(l.tax_percent)}%` : '-',
      total: lineAmount(l),
    })),
    totals: [
      { label: 'Subtotal', value: printMoney(inv.subtotal) },
      ...(inv.discount_amount ? [{ label: 'Diskon', value: printMoney(inv.discount_amount) }] : []),
      ...(inv.tax_amount ? [{ label: 'Pajak', value: printMoney(inv.tax_amount) }] : []),
      { label: 'Total', value: printMoney(inv.grand_total), strong: true },
      ...(inv.paid_amount ? [{ label: 'Dibayar', value: printMoney(inv.paid_amount) }, { label: 'Sisa tagihan', value: printMoney(inv.balance_due), strong: true }] : []),
    ],
    amountInWords: terbilang(inv.grand_total),
    notes: inv.notes,
    signatures: ['Penerima', 'Hormat kami'],
  }
}

export function deliveryOrderPrint(d: DeliveryOrder): TransactionPrintData {
  return {
    title: 'Surat Jalan',
    number: d.number,
    status: d.status,
    party: contactParty('Dikirim kepada', d.customer, [d.delivery_address]),
    meta: [
      { label: 'Tanggal', value: printDate(d.date) },
      ...(d.sales_order_number ? [{ label: 'No. SO', value: d.sales_order_number }] : []),
      { label: 'Gudang', value: d.warehouse?.name ?? '-' },
    ],
    columns: [
      { key: 'item', header: 'Barang', width: '66%' },
      { key: 'qty', header: 'Qty', align: 'right', width: '12%' },
      { key: 'check', header: 'Cek', align: 'center', width: '12%' },
    ],
    rows: d.lines.map((l) => ({ item: lineItem(l.product, l.description), qty: printQty(l.quantity), check: '☐' })),
    notes: d.notes,
    signatures: ['Penerima', 'Pengirim', 'Gudang'],
  }
}

export function salesReceiptPrint(r: SalesReceipt): TransactionPrintData {
  return {
    title: 'Kwitansi',
    number: r.number,
    status: r.status,
    party: contactParty('Diterima dari', r.customer),
    meta: [
      { label: 'Tanggal', value: printDate(r.date ?? r.receipt_date) },
      { label: 'Kas/Bank', value: r.cash_bank_account?.name ?? '-' },
    ],
    columns: [
      { key: 'invoice', header: 'Untuk pembayaran invoice', width: '70%' },
      { key: 'amount', header: 'Jumlah', align: 'right', width: '26%' },
    ],
    rows: r.lines.map((l) => ({ invoice: l.invoice?.number ?? `#${l.sales_invoice_id}`, amount: printMoney(l.amount) })),
    totals: [{ label: 'Total diterima', value: printMoney(r.amount), strong: true }],
    amountInWords: terbilang(r.amount),
    notes: r.notes,
    signatures: ['Penyetor', 'Penerima'],
  }
}

type PricedLine = { product?: { name?: string | null } | null; description: string; quantity: number; unit_price: number; discount_percent?: number; subtotal: number }
type PricedDoc = { number: string; status: string; customer?: unknown; notes?: string | null; subtotal: number; discount_amount?: number; tax_amount: number; grand_total: number; lines: PricedLine[] }

function pricedLines(lines: PricedLine[], withDiscount: boolean) {
  return {
    columns: [
      { key: 'item', header: 'Barang / Jasa', width: withDiscount ? '46%' : '54%' },
      { key: 'qty', header: 'Qty', align: 'right' as const, width: '10%' },
      { key: 'price', header: 'Harga', align: 'right' as const, width: '16%' },
      ...(withDiscount ? [{ key: 'disc', header: 'Disk.', align: 'right' as const, width: '8%' }] : []),
      { key: 'total', header: 'Jumlah', align: 'right' as const, width: '16%' },
    ],
    rows: lines.map((l) => ({
      item: lineItem(l.product, l.description),
      qty: printQty(l.quantity),
      price: printMoney(l.unit_price),
      disc: l.discount_percent ? `${printQty(l.discount_percent)}%` : '-',
      total: lineAmount(l),
    })),
  }
}

function pricedTotals(d: PricedDoc) {
  return [
    { label: 'Subtotal', value: printMoney(d.subtotal) },
    ...(d.discount_amount ? [{ label: 'Diskon', value: printMoney(d.discount_amount) }] : []),
    ...(d.tax_amount ? [{ label: 'Pajak', value: printMoney(d.tax_amount) }] : []),
    { label: 'Total', value: printMoney(d.grand_total), strong: true },
  ]
}

export function quotationPrint(q: SalesQuotation): TransactionPrintData {
  return {
    title: 'Penawaran Harga', number: q.number, status: q.status,
    party: contactParty('Kepada', q.customer),
    meta: [
      { label: 'Tanggal', value: printDate(q.date) },
      { label: 'Berlaku sampai', value: printDate(q.expiry_date) },
      ...(q.sales_person?.name ? [{ label: 'Sales', value: q.sales_person.name }] : []),
    ],
    ...pricedLines(q.lines, true),
    totals: pricedTotals(q), amountInWords: terbilang(q.grand_total), notes: q.notes,
    signatures: ['Hormat kami', 'Disetujui pelanggan'],
  }
}

export function salesOrderPrint(o: SalesOrder): TransactionPrintData {
  return {
    title: 'Sales Order', number: o.number, status: o.status,
    party: contactParty('Pelanggan', o.customer, [o.delivery_address ? `Kirim ke: ${o.delivery_address}` : null]),
    meta: [
      { label: 'Tanggal', value: printDate(o.date) },
      { label: 'Syarat bayar', value: o.payment_term?.name ?? '-' },
      ...(o.quotation_number ? [{ label: 'No. Penawaran', value: o.quotation_number }] : []),
    ],
    ...pricedLines(o.lines, true),
    totals: pricedTotals(o), amountInWords: terbilang(o.grand_total), notes: o.notes,
    signatures: ['Pelanggan', 'Hormat kami'],
  }
}

export function proformaPrint(p: ProformaInvoice): TransactionPrintData {
  return {
    title: 'Proforma Invoice', number: p.number, status: p.status,
    party: contactParty('Kepada', p.customer),
    meta: [
      { label: 'Tanggal', value: printDate(p.date) },
      ...(p.sales_order_number ? [{ label: 'No. SO', value: p.sales_order_number }] : []),
    ],
    ...pricedLines(p.lines, true),
    totals: pricedTotals(p), amountInWords: terbilang(p.grand_total), notes: p.notes,
    signatures: ['Hormat kami'],
  }
}

export function salesReturnPrint(r: SalesReturn): TransactionPrintData {
  return {
    title: 'Retur Penjualan', number: r.number, status: r.status,
    party: contactParty('Pelanggan', r.customer),
    meta: [
      { label: 'Tanggal', value: printDate(r.date) },
      ...(r.sales_invoice_number ? [{ label: 'No. Invoice', value: r.sales_invoice_number }] : []),
      ...(r.delivery_order_number ? [{ label: 'No. Surat Jalan', value: r.delivery_order_number }] : []),
    ],
    ...pricedLines(r.lines, false),
    totals: pricedTotals(r), notes: r.notes,
    signatures: ['Pelanggan', 'Diterima gudang', 'Disetujui'],
  }
}

export function customerDepositPrint(d: CustomerDeposit): TransactionPrintData {
  return {
    title: 'Kwitansi Uang Muka', number: d.number, status: d.status,
    party: contactParty('Diterima dari', d.customer),
    meta: [
      { label: 'Tanggal', value: printDate(d.date) },
      { label: 'Kas/Bank', value: d.cash_bank_account?.name ?? '-' },
    ],
    columns: [{ key: 'desc', header: 'Keterangan', width: '70%' }, { key: 'amount', header: 'Jumlah', align: 'right', width: '26%' }],
    rows: [{ desc: 'Uang muka pembelian', amount: printMoney(d.amount) }],
    totals: [{ label: 'Total diterima', value: printMoney(d.amount), strong: true }],
    amountInWords: terbilang(d.amount), notes: d.notes,
    signatures: ['Penyetor', 'Penerima'],
  }
}
