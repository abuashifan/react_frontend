// Adapter Vendor Bill — A13-161 (request) & A13-162 (response).
// Backend memakai nama kolom DB (`bill_number`, `bill_date`, `discount_value`,
// `tax_rate`, `product_name`, dst). UI memakai model canonical. Adapter ini
// menjadi satu-satunya boundary pemetaan antara keduanya.
import type {
  RawVendorBill,
  RawVendorBillLine,
  VendorBill,
  VendorBillLine,
  VendorBillLineInput,
  CreateVendorBillPayload,
  VendorBillLinePayload,
} from '../types/vendorBill.types'

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : 0
}

/** Diskon line backend (type+value) → persen UI. Hanya `percent` yang dipetakan ke persen. */
function toDiscountPercent(line: RawVendorBillLine): number {
  return line.discount_type === 'percent' ? num(line.discount_value) : 0
}

function fromLine(line: RawVendorBillLine): VendorBillLine {
  return {
    id: line.id,
    product_id: line.product_id ?? null,
    product: line.product
      ? { id: line.product.id, code: line.product.product_code, name: line.product.product_name }
      : null,
    line_classification: line.line_classification ?? 'inventory',
    fixed_asset_category_id: line.fixed_asset_category_id ?? null,
    fixed_asset_category: line.fixed_asset_category
      ? { id: line.fixed_asset_category.id, name: line.fixed_asset_category.name, code: line.fixed_asset_category.code }
      : null,
    description: line.description ?? '',
    quantity: num(line.quantity),
    unit_price: num(line.unit_price),
    discount_percent: toDiscountPercent(line),
    tax_percent: num(line.tax_rate),
    subtotal: num(line.line_total ?? line.subtotal_after_discount),
    returned_quantity: num(line.returned_quantity),
  }
}

export function fromVendorBillResponse(raw: RawVendorBill): VendorBill {
  return {
    id: raw.id,
    number: raw.bill_number,
    date: raw.bill_date,
    due_date: raw.due_date ?? null,
    vendor_id: raw.vendor_id,
    vendor: raw.vendor ? { id: raw.vendor.id, code: raw.vendor.contact_code, name: raw.vendor.name } : undefined,
    payment_term_id: raw.payment_term_id ?? null,
    payment_term: raw.payment_term
      ? { id: raw.payment_term.id, name: raw.payment_term.name, days: raw.payment_term.days }
      : null,
    applied_vendor_deposit_amount: raw.applied_vendor_deposit_amount == null ? undefined : num(raw.applied_vendor_deposit_amount),
    notes: raw.notes ?? null,
    status: raw.status,
    subtotal: num(raw.subtotal_after_discount),
    discount_amount: num(raw.header_discount_amount) + num(raw.line_discount_total),
    tax_amount: num(raw.tax_total),
    grand_total: num(raw.grand_total),
    paid_amount: num(raw.paid_amount),
    returned_amount: num(raw.returned_amount),
    balance_due: num(raw.balance_due),
    lines: (raw.lines ?? []).map(fromLine),
    purchase_order_id: raw.purchase_order_id ?? null,
    purchase_order_number: raw.purchase_order?.order_number ?? null,
    goods_receipt_id: raw.goods_receipt_id ?? null,
    goods_receipt_number: raw.goods_receipt?.receipt_number ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function toLinePayload(line: VendorBillLineInput): VendorBillLinePayload {
  const isFixedAsset = line.line_classification === 'fixed_asset'
  return {
    line_classification: line.line_classification,
    product_id: isFixedAsset ? null : line.product_id,
    fixed_asset_category_id: isFixedAsset ? line.fixed_asset_category_id : null,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unit_price,
    discount_type: 'percent',
    discount_value: line.discount_percent,
    tax_rate: line.tax_percent,
  }
}

/** Form UI → payload backend. `date` → `bill_date`, diskon/pajak line → kontrak backend. */
export function toVendorBillPayload(
  values: { vendor_id: number; date: string; due_date?: string; payment_term_id?: number | null; applied_vendor_deposit_amount?: number | null; notes?: string },
  lines: VendorBillLineInput[],
): CreateVendorBillPayload {
  return {
    vendor_id: values.vendor_id,
    bill_date: values.date,
    due_date: values.due_date || null,
    payment_term_id: values.payment_term_id ?? null,
    applied_vendor_deposit_amount: values.applied_vendor_deposit_amount ?? null,
    notes: values.notes || null,
    lines: lines.map(toLinePayload),
  }
}
