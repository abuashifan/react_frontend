import type {
  CreatePurchaseRequestPayload,
  PurchaseRequest,
  PurchaseRequestLine,
  PurchaseRequestLinePayload,
  RawPurchaseRequest,
  RawPurchaseRequestLine,
} from '../types/purchaseRequest.types'

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(parsed) ? parsed : 0
}

function fromLine(line: RawPurchaseRequestLine): PurchaseRequestLine {
  return {
    id: line.id,
    product_id: line.product_id ?? null,
    product: line.product ? { id: line.product.id, code: line.product.product_code, name: line.product.product_name } : null,
    description: line.description ?? '',
    quantity: num(line.quantity),
    unit_id: line.unit_id ?? null,
    unit: line.unit ? { id: line.unit.id, name: line.unit.name } : null,
    estimated_price: num(line.estimated_unit_price),
    subtotal: num(line.subtotal),
  }
}

export function fromPurchaseRequestResponse(raw: RawPurchaseRequest): PurchaseRequest {
  return {
    id: raw.id,
    number: raw.request_number,
    date: raw.request_date,
    department_id: raw.department_id ?? null,
    department: raw.department ? { id: raw.department.id, name: raw.department.name } : null,
    requester_id: raw.requester_id ?? null,
    notes: raw.notes ?? null,
    status: raw.status,
    total_estimated: num(raw.estimated_total),
    lines: (raw.lines ?? []).map(fromLine),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function toLinePayload(line: { product_id: number | null; description: string; quantity: number; estimated_price: number }): PurchaseRequestLinePayload {
  return {
    product_id: line.product_id,
    description: line.description,
    quantity: line.quantity,
    estimated_unit_price: line.estimated_price,
  }
}

export function toPurchaseRequestPayload(
  values: { date: string; department_id?: number | null; notes?: string | null },
  lines: Array<{ product_id: number | null; description: string; quantity: number; estimated_price: number }>,
): CreatePurchaseRequestPayload {
  return {
    request_date: values.date,
    department_id: values.department_id ?? null,
    notes: values.notes || null,
    lines: lines.map(toLinePayload),
  }
}