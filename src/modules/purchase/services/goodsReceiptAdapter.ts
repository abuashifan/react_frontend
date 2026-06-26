import type {
  CreateGoodsReceiptPayload,
  GoodsReceipt,
  GoodsReceiptLine,
  GoodsReceiptLinePayload,
  RawGoodsReceipt,
  RawGoodsReceiptLine,
} from '../types/goodsReceipt.types'

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(parsed) ? parsed : 0
}

function fromLine(line: RawGoodsReceiptLine): GoodsReceiptLine {
  return {
    id: line.id,
    product_id: line.product_id ?? null,
    product: line.product ? { id: line.product.id, code: line.product.product_code, name: line.product.product_name } : null,
    description: line.description ?? '',
    quantity: num(line.quantity),
    billed_quantity: num(line.billed_quantity),
    returned_quantity: num(line.returned_quantity),
  }
}

export function fromGoodsReceiptResponse(raw: RawGoodsReceipt): GoodsReceipt {
  return {
    id: raw.id,
    number: raw.receipt_number,
    date: raw.receipt_date,
    vendor_id: raw.vendor_id,
    vendor: raw.vendor ? { id: raw.vendor.id, code: raw.vendor.contact_code, name: raw.vendor.name } : undefined,
    warehouse_id: raw.warehouse_id ?? null,
    warehouse: raw.warehouse ? { id: raw.warehouse.id, name: raw.warehouse.name } : null,
    notes: raw.notes ?? null,
    status: raw.status,
    lines: (raw.lines ?? []).map(fromLine),
    purchase_order_id: raw.purchase_order_id ?? null,
    purchase_order_number: raw.purchase_order_number ?? raw.purchase_order?.order_number ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function toLinePayload(line: { product_id: number | null; description: string; quantity: number }): GoodsReceiptLinePayload {
  return {
    product_id: line.product_id,
    description: line.description,
    quantity: line.quantity,
  }
}

export function toGoodsReceiptPayload(
  values: { vendor_id: number; date: string; warehouse_id?: number | null; notes?: string | null },
  lines: Array<{ product_id: number | null; description: string; quantity: number }>,
): CreateGoodsReceiptPayload {
  return {
    vendor_id: values.vendor_id,
    receipt_date: values.date,
    warehouse_id: values.warehouse_id ?? null,
    notes: values.notes || null,
    lines: lines.map(toLinePayload),
  }
}