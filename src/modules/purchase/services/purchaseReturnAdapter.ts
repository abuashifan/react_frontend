import type { CreatePurchaseReturnPayload, PurchaseReturn, RawPurchaseReturn } from '../types/purchaseReturn.types'

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(parsed) ? parsed : 0
}

export function fromPurchaseReturnResponse(raw: RawPurchaseReturn): PurchaseReturn {
  return {
    id: raw.id,
    number: raw.return_number,
    date: raw.return_date,
    vendor_id: raw.vendor_id,
    vendor: raw.vendor ? { id: raw.vendor.id, code: raw.vendor.contact_code ?? raw.vendor.contact_number ?? raw.vendor.code ?? '', name: raw.vendor.name } : undefined,
    notes: raw.notes ?? null,
    status: raw.status,
    total: num(raw.grand_total),
    lines: (raw.lines ?? []).map((line) => ({
      id: line.id,
      product_id: line.product_id,
      product: line.product ? { id: line.product.id, code: line.product.product_code, name: line.product.product_name } : null,
      description: line.description,
      quantity: num(line.quantity),
      unit_price: num(line.unit_price),
      subtotal: num(line.line_total ?? line.subtotal),
    })),
    vendor_bill_id: raw.vendor_bill_id ?? null,
    vendor_bill_number: raw.vendor_bill_number ?? raw.vendor_bill?.bill_number ?? null,
    goods_receipt_id: raw.goods_receipt_id ?? null,
    goods_receipt_number: raw.goods_receipt_number ?? raw.goods_receipt?.receipt_number ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

export function toPurchaseReturnPayload(values: { vendor_id: number; date: string; notes?: string | null }, lines: Array<{ product_id: number | null; description: string; quantity: number; unit_price: number }>): CreatePurchaseReturnPayload {
  return {
    vendor_id: values.vendor_id,
    return_date: values.date,
    notes: values.notes || null,
    lines,
  }
}