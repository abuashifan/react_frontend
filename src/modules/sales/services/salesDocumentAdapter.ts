// Adapter bersama dokumen penjualan (penawaran, SO, proforma, invoice).
// Backend memakai nama kolom DB untuk baris (`discount_type` + `discount_value`,
// `tax_rate`, `line_total`, produk `product_name`/`product_code`) dan header
// (`subtotal_after_discount`, `tax_total`, desimal sebagai teks). UI memakai
// model canonical (`discount_percent`, `tax_percent`, `subtotal`, `product.name`).
// Tanpa pemetaan ini diskon/pajak yang diisi di form diabaikan backend, produk
// tampil "#id", dan total tampil "-". Polanya sama dengan vendorBillAdapter.
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'

type RawRecord = Record<string, unknown>

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : 0
}

function firstDefined(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null)
}

function fromProduct(raw: unknown) {
  if (!isRecord(raw)) return raw ?? null
  return {
    ...raw,
    id: raw.id,
    code: firstDefined(raw.code, raw.product_code) ?? '',
    name: firstDefined(raw.name, raw.product_name) ?? '',
  }
}

function fromContact(raw: unknown) {
  if (!isRecord(raw)) return raw
  return { ...raw, code: firstDefined(raw.code, raw.contact_code) ?? '' }
}

function fromLine(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  // Diskon nominal tidak punya padanan persen di form; hanya `percent` yang dipetakan.
  const discountPercent = raw.discount_percent !== undefined
    ? num(raw.discount_percent)
    : raw.discount_type === 'percent' ? num(raw.discount_value) : 0
  return {
    ...raw,
    product: fromProduct(raw.product),
    discount_percent: discountPercent,
    tax_percent: num(firstDefined(raw.tax_percent, raw.tax_rate)),
    subtotal: num(firstDefined(raw.line_total, raw.subtotal_after_discount, raw.subtotal)),
    tax_amount: num(raw.tax_amount),
  }
}

/** Satu dokumen penjualan mentah → model canonical UI. */
export function fromSalesDocument<T>(raw: T): T {
  if (!isRecord(raw)) return raw
  return {
    ...raw,
    customer: fromContact(raw.customer),
    subtotal: num(firstDefined(raw.subtotal_after_discount, raw.subtotal)),
    discount_amount: num(raw.header_discount_amount) + num(raw.line_discount_total),
    tax_amount: num(firstDefined(raw.tax_total, raw.tax_amount)),
    grand_total: num(raw.grand_total),
    paid_amount: num(raw.paid_amount),
    returned_amount: num(raw.returned_amount),
    balance_due: num(raw.balance_due),
    lines: Array.isArray(raw.lines) ? raw.lines.map(fromLine) : raw.lines,
  } as T
}

export function mapSalesResponse<T>(res: ApiResponse<T>): ApiResponse<T> {
  return { ...res, data: fromSalesDocument(res.data) }
}

export function mapSalesPage<T>(res: PaginatedResponse<T>): PaginatedResponse<T> {
  return { ...res, data: res.data.map((row) => fromSalesDocument(row)) }
}

/** Baris form → kontrak backend: persen diskon/pajak → `discount_type`/`discount_value`/`tax_rate`. */
function toLinePayload(line: unknown): unknown {
  if (!isRecord(line)) return line
  const { discount_percent, tax_percent, ...rest } = line
  return {
    ...rest,
    ...(discount_percent !== undefined ? { discount_type: 'percent', discount_value: num(discount_percent) } : {}),
    ...(tax_percent !== undefined ? { tax_rate: num(tax_percent) } : {}),
  }
}

export function toSalesPayload<T extends { lines?: unknown }>(payload: T): T {
  return Array.isArray(payload.lines) ? { ...payload, lines: payload.lines.map(toLinePayload) } : payload
}
