import type {
  CreatePurchaseOrderPayload,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderLinePayload,
  RawPurchaseOrder,
  RawPurchaseOrderLine,
} from '../types/purchaseOrder.types'

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(parsed) ? parsed : 0
}

function fromLine(line: RawPurchaseOrderLine): PurchaseOrderLine {
  return {
    id: line.id,
    product_id: line.product_id ?? null,
    product: line.product ? { id: line.product.id, code: line.product.product_code, name: line.product.product_name } : null,
    description: line.description ?? '',
    quantity: num(line.quantity),
    unit_price: num(line.unit_price),
    discount_percent: num(line.discount_percent),
    subtotal: num(line.subtotal),
    received_quantity: num(line.received_quantity),
    billed_quantity: num(line.billed_quantity),
    returned_quantity: num(line.returned_quantity),
  }
}

export function fromPurchaseOrderResponse(raw: RawPurchaseOrder): PurchaseOrder {
  return {
    id: raw.id,
    number: raw.order_number,
    date: raw.order_date,
    vendor_id: raw.vendor_id,
    vendor: raw.vendor ? { id: raw.vendor.id, code: raw.vendor.contact_code, name: raw.vendor.name } : undefined,
    payment_term_id: raw.payment_term_id ?? null,
    payment_term: raw.payment_term ? { id: raw.payment_term.id, name: raw.payment_term.name, days: raw.payment_term.days } : null,
    expected_delivery_date: raw.expected_date ?? null,
    notes: raw.notes ?? null,
    status: raw.status,
    subtotal: num(raw.subtotal),
    discount_amount: num(raw.discount_amount),
    tax_amount: num(raw.tax_amount),
    grand_total: num(raw.grand_total),
    lines: (raw.lines ?? []).map(fromLine),
    purchase_request_id: raw.purchase_request_id ?? null,
    purchase_request_number: raw.purchase_request?.request_number ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function toLinePayload(line: { product_id: number | null; description: string; quantity: number; unit_price: number; discount_percent: number }): PurchaseOrderLinePayload {
  return {
    product_id: line.product_id,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unit_price,
    discount_percent: line.discount_percent,
  }
}

export function toPurchaseOrderPayload(
  values: { vendor_id: number; date: string; payment_term_id?: number | null; expected_delivery_date?: string | null; notes?: string | null },
  lines: Array<{ product_id: number | null; description: string; quantity: number; unit_price: number; discount_percent: number }>,
): CreatePurchaseOrderPayload {
  return {
    vendor_id: values.vendor_id,
    order_date: values.date,
    payment_term_id: values.payment_term_id ?? null,
    expected_date: values.expected_delivery_date || null,
    notes: values.notes || null,
    lines: lines.map(toLinePayload),
  }
}