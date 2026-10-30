import type { TransactionPrintData } from '@/components/shared/print/TransactionDocumentPrint'
import { contactParty, lineAmount, lineItem, printDate, printMoney, printQty } from '@/components/shared/print/printHelpers'
import { terbilang } from '@/lib/terbilang'
import type { PurchaseOrder } from '../types/purchaseOrder.types'
import type { PurchaseRequest } from '../types/purchaseRequest.types'
import type { GoodsReceipt } from '../types/goodsReceipt.types'
import type { VendorBill } from '../types/vendorBill.types'
import type { VendorPayment } from '../types/vendorPayment.types'
import type { VendorDeposit } from '../types/vendorDeposit.types'
import type { PurchaseReturn } from '../types/purchaseReturn.types'

export function purchaseOrderPrint(po: PurchaseOrder): TransactionPrintData {
  return {
    title: 'Purchase Order',
    number: po.number,
    status: po.status,
    party: contactParty('Kepada vendor', po.vendor),
    meta: [
      { label: 'Tanggal', value: printDate(po.date) },
      { label: 'Tgl kirim diharapkan', value: printDate(po.expected_delivery_date) },
      { label: 'Syarat bayar', value: po.payment_term?.name ?? '-' },
      ...(po.purchase_request_number ? [{ label: 'No. PR', value: po.purchase_request_number }] : []),
    ],
    columns: [
      { key: 'item', header: 'Barang / Jasa', width: '46%' },
      { key: 'qty', header: 'Qty', align: 'right', width: '10%' },
      { key: 'price', header: 'Harga', align: 'right', width: '16%' },
      { key: 'disc', header: 'Disk.', align: 'right', width: '8%' },
      { key: 'total', header: 'Jumlah', align: 'right', width: '16%' },
    ],
    rows: po.lines.map((l) => ({
      item: lineItem(l.product, l.description),
      qty: printQty(l.quantity),
      price: printMoney(l.unit_price),
      disc: l.discount_percent ? `${printQty(l.discount_percent)}%` : '-',
      total: lineAmount(l),
    })),
    totals: [
      { label: 'Subtotal', value: printMoney(po.subtotal) },
      ...(po.discount_amount ? [{ label: 'Diskon', value: printMoney(po.discount_amount) }] : []),
      ...(po.tax_amount ? [{ label: 'Pajak', value: printMoney(po.tax_amount) }] : []),
      { label: 'Total', value: printMoney(po.grand_total), strong: true },
    ],
    amountInWords: terbilang(po.grand_total),
    notes: po.notes,
    signatures: ['Dibuat oleh', 'Disetujui oleh', 'Vendor'],
  }
}

export function purchaseRequestPrint(r: PurchaseRequest): TransactionPrintData {
  return {
    title: 'Permintaan Pembelian',
    number: r.number,
    status: r.status,
    meta: [
      { label: 'Tanggal', value: printDate(r.date) },
      { label: 'Departemen', value: r.department?.name ?? '-' },
    ],
    columns: [
      { key: 'item', header: 'Barang / Jasa', width: '46%' },
      { key: 'qty', header: 'Qty', align: 'right', width: '10%' },
      { key: 'unit', header: 'Satuan', width: '10%' },
      { key: 'price', header: 'Perkiraan harga', align: 'right', width: '14%' },
      { key: 'total', header: 'Jumlah', align: 'right', width: '16%' },
    ],
    rows: r.lines.map((l) => ({
      item: lineItem(l.product, l.description),
      qty: printQty(l.quantity),
      unit: l.unit?.name ?? '',
      price: printMoney(l.estimated_price),
      total: printMoney(l.subtotal),
    })),
    totals: [{ label: 'Total perkiraan', value: printMoney(r.total_estimated), strong: true }],
    notes: r.notes,
    signatures: ['Diminta oleh', 'Disetujui oleh'],
  }
}

export function goodsReceiptPrint(g: GoodsReceipt): TransactionPrintData {
  return {
    title: 'Bukti Penerimaan Barang',
    number: g.number,
    status: g.status,
    party: contactParty('Dari vendor', g.vendor),
    meta: [
      { label: 'Tanggal', value: printDate(g.date) },
      { label: 'Gudang', value: g.warehouse?.name ?? '-' },
      ...(g.purchase_order_number ? [{ label: 'No. PO', value: g.purchase_order_number }] : []),
    ],
    columns: [
      { key: 'item', header: 'Barang', width: '66%' },
      { key: 'qty', header: 'Qty diterima', align: 'right', width: '14%' },
      { key: 'check', header: 'Kondisi', align: 'center', width: '12%' },
    ],
    rows: g.lines.map((l) => ({ item: lineItem(l.product, l.description), qty: printQty(l.quantity), check: '☐ Baik' })),
    notes: g.notes,
    signatures: ['Pengirim', 'Diterima gudang', 'Diperiksa'],
  }
}

export function vendorBillPrint(b: VendorBill): TransactionPrintData {
  return {
    title: 'Tagihan Vendor',
    number: b.number,
    status: b.status,
    party: contactParty('Vendor', b.vendor),
    meta: [
      { label: 'Tanggal', value: printDate(b.date) },
      { label: 'Jatuh tempo', value: printDate(b.due_date) },
      ...(b.purchase_order_number ? [{ label: 'No. PO', value: b.purchase_order_number }] : []),
      ...(b.goods_receipt_number ? [{ label: 'No. Penerimaan', value: b.goods_receipt_number }] : []),
    ],
    columns: [
      { key: 'item', header: 'Barang / Jasa', width: '40%' },
      { key: 'qty', header: 'Qty', align: 'right', width: '9%' },
      { key: 'price', header: 'Harga', align: 'right', width: '15%' },
      { key: 'disc', header: 'Disk.', align: 'right', width: '8%' },
      { key: 'tax', header: 'Pajak', align: 'right', width: '8%' },
      { key: 'total', header: 'Jumlah', align: 'right', width: '16%' },
    ],
    rows: b.lines.map((l) => ({
      item: l.fixed_asset_category ? lineItem({ name: l.fixed_asset_category.name }, l.description) : lineItem(l.product, l.description),
      qty: printQty(l.quantity),
      price: printMoney(l.unit_price),
      disc: l.discount_percent ? `${printQty(l.discount_percent)}%` : '-',
      tax: l.tax_percent ? `${printQty(l.tax_percent)}%` : '-',
      total: lineAmount(l),
    })),
    totals: [
      { label: 'Subtotal', value: printMoney(b.subtotal) },
      ...(b.discount_amount ? [{ label: 'Diskon', value: printMoney(b.discount_amount) }] : []),
      ...(b.tax_amount ? [{ label: 'Pajak', value: printMoney(b.tax_amount) }] : []),
      { label: 'Total', value: printMoney(b.grand_total), strong: true },
      ...(b.paid_amount ? [{ label: 'Dibayar', value: printMoney(b.paid_amount) }, { label: 'Sisa hutang', value: printMoney(b.balance_due), strong: true }] : []),
    ],
    amountInWords: terbilang(b.grand_total),
    notes: b.notes,
    signatures: ['Diperiksa', 'Disetujui'],
  }
}

export function vendorPaymentPrint(p: VendorPayment): TransactionPrintData {
  return {
    title: 'Bukti Pembayaran',
    number: p.number,
    status: p.status,
    party: contactParty('Dibayarkan kepada', p.vendor),
    meta: [
      { label: 'Tanggal', value: printDate(p.date) },
      { label: 'Dari kas/bank', value: p.cash_bank_account?.name ?? '-' },
    ],
    columns: [
      { key: 'bill', header: 'Untuk pembayaran tagihan', width: '70%' },
      { key: 'amount', header: 'Jumlah', align: 'right', width: '26%' },
    ],
    rows: p.lines.map((l) => ({ bill: l.bill_number ?? `#${l.vendor_bill_id}`, amount: printMoney(l.amount) })),
    totals: [{ label: 'Total dibayar', value: printMoney(p.amount), strong: true }],
    amountInWords: terbilang(p.amount),
    notes: p.notes,
    signatures: ['Penerima', 'Kasir', 'Disetujui'],
  }
}

export function vendorDepositPrint(d: VendorDeposit): TransactionPrintData {
  return {
    title: 'Bukti Uang Muka Vendor',
    number: d.number,
    status: d.status,
    party: contactParty('Dibayarkan kepada', d.vendor),
    meta: [
      { label: 'Tanggal', value: printDate(d.date) },
      { label: 'Dari kas/bank', value: d.cash_bank_account?.name ?? '-' },
    ],
    columns: [
      { key: 'desc', header: 'Keterangan', width: '70%' },
      { key: 'amount', header: 'Jumlah', align: 'right', width: '26%' },
    ],
    rows: [{ desc: 'Uang muka pembelian', amount: printMoney(d.amount) }],
    totals: [{ label: 'Total', value: printMoney(d.amount), strong: true }],
    amountInWords: terbilang(d.amount),
    notes: d.notes,
    signatures: ['Penerima', 'Kasir', 'Disetujui'],
  }
}

export function purchaseReturnPrint(r: PurchaseReturn): TransactionPrintData {
  return {
    title: 'Retur Pembelian',
    number: r.number,
    status: r.status,
    party: contactParty('Kepada vendor', r.vendor),
    meta: [
      { label: 'Tanggal', value: printDate(r.date) },
      ...(r.vendor_bill_number ? [{ label: 'No. Tagihan', value: r.vendor_bill_number }] : []),
      ...(r.goods_receipt_number ? [{ label: 'No. Penerimaan', value: r.goods_receipt_number }] : []),
    ],
    columns: [
      { key: 'item', header: 'Barang', width: '54%' },
      { key: 'qty', header: 'Qty', align: 'right', width: '10%' },
      { key: 'price', header: 'Harga', align: 'right', width: '16%' },
      { key: 'total', header: 'Jumlah', align: 'right', width: '16%' },
    ],
    rows: r.lines.map((l) => ({ item: lineItem(l.product, l.description), qty: printQty(l.quantity), price: printMoney(l.unit_price), total: lineAmount(l) })),
    totals: [{ label: 'Total', value: printMoney(r.total), strong: true }],
    notes: r.notes,
    signatures: ['Dikirim gudang', 'Diterima vendor', 'Disetujui'],
  }
}
