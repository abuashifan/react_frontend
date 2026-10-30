import type { TransactionPrintData } from '@/components/shared/print/TransactionDocumentPrint'
import { lineItem, printDate, printMoney, printQty } from '@/components/shared/print/printHelpers'
import type { StockMovement } from '../types/stockMovement.types'
import type { StockAdjustment } from '../types/stockAdjustment.types'
import type { StockOpname } from '../types/stockOpname.types'

export function stockMovementPrint(m: StockMovement): TransactionPrintData {
  return {
    title: 'Mutasi Stok',
    number: m.number,
    status: m.status,
    meta: [
      { label: 'Tanggal', value: printDate(m.movement_date) },
      { label: 'Jenis', value: m.movement_type },
      ...(m.warehouse?.name ? [{ label: 'Gudang', value: m.warehouse.name }] : []),
      ...(m.source_number ? [{ label: 'Sumber', value: m.source_number }] : []),
    ],
    columns: [
      { key: 'item', header: 'Barang', width: '36%' },
      { key: 'wh', header: 'Gudang', width: '18%' },
      { key: 'qty', header: 'Qty', align: 'right', width: '10%' },
      { key: 'unit', header: 'Satuan', width: '8%' },
      { key: 'cost', header: 'Nilai', align: 'right', width: '18%' },
    ],
    rows: m.lines.map((l) => ({
      item: lineItem(l.product, null),
      wh: l.warehouse?.name ?? '',
      qty: printQty(l.quantity),
      unit: l.unit?.code ?? '',
      cost: printMoney(l.total_cost),
    })),
    totals: [{ label: 'Total nilai', value: printMoney(m.total_value), strong: true }],
    notes: [m.description, m.notes].filter(Boolean).join('\n') || null,
    signatures: ['Dibuat oleh', 'Gudang', 'Disetujui'],
  }
}

export function stockAdjustmentPrint(a: StockAdjustment): TransactionPrintData {
  const total = a.lines.reduce((s, l) => s + (l.adjustment_type === 'decrease' ? -1 : 1) * Number(l.total_cost || 0), 0)
  return {
    title: 'Penyesuaian Stok',
    number: a.number,
    status: a.status,
    meta: [
      { label: 'Tanggal', value: printDate(a.adjustment_date) },
      { label: 'Gudang', value: a.warehouse?.name ?? '-' },
      ...(a.reason ? [{ label: 'Alasan', value: a.reason }] : []),
    ],
    columns: [
      { key: 'item', header: 'Barang', width: '34%' },
      { key: 'type', header: 'Tipe', width: '10%' },
      { key: 'qty', header: 'Qty', align: 'right', width: '10%' },
      { key: 'unit', header: 'Satuan', width: '8%' },
      { key: 'cost', header: 'Nilai', align: 'right', width: '16%' },
      { key: 'reason', header: 'Alasan', width: '18%' },
    ],
    rows: a.lines.map((l) => ({
      item: lineItem(l.product, null),
      type: l.adjustment_type === 'decrease' ? 'Kurang' : 'Tambah',
      qty: printQty(l.quantity),
      unit: l.unit?.code ?? '',
      cost: printMoney(l.total_cost),
      reason: l.reason ?? '',
    })),
    totals: [{ label: 'Nilai bersih', value: printMoney(total), strong: true }],
    notes: a.notes,
    signatures: ['Dibuat oleh', 'Gudang', 'Disetujui'],
  }
}

/**
 * Lembar hitung opname. Qty sistem tidak dicetak (hitung buta) supaya
 * penghitung tidak menyalin angka sistem; kolom qty fisik kosong bila belum
 * dihitung, selisih tampil setelah ada hitungan.
 */
export function stockOpnamePrint(o: StockOpname): TransactionPrintData {
  const counted = o.lines.some((l) => l.physical_quantity !== null)
  return {
    title: counted ? 'Hasil Stock Opname' : 'Lembar Hitung Opname',
    number: o.number,
    status: o.status,
    meta: [
      { label: 'Tanggal', value: printDate(o.opname_date) },
      { label: 'Gudang', value: o.warehouse?.name ?? '-' },
    ],
    columns: [
      { key: 'item', header: 'Barang', width: '48%' },
      { key: 'unit', header: 'Satuan', width: '10%' },
      { key: 'physical', header: 'Qty fisik', align: 'right', width: '16%' },
      ...(counted ? [{ key: 'diff', header: 'Selisih', align: 'right' as const, width: '16%' }] : []),
    ],
    rows: o.lines.map((l) => ({
      item: lineItem({ name: l.product?.product_name ?? l.product?.name }, null),
      unit: l.unit?.code ?? '',
      physical: l.physical_quantity === null ? '' : printQty(l.physical_quantity),
      diff: l.difference_quantity === null ? '' : printQty(l.difference_quantity),
    })),
    notes: o.notes,
    signatures: ['Penghitung', 'Pemeriksa', 'Kepala gudang'],
  }
}
