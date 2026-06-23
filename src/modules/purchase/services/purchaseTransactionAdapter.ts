/**
 * Adapter request/response transaksi Purchase (A13-161/162).
 *
 * Tujuan:
 * - Response detail (`adaptPurchaseDocument`): memetakan tanggal resource-specific
 *   backend (request_date/order_date/receipt_date/bill_date/deposit_date/
 *   payment_date/return_date) ke field `date` yang dibaca form, menormalisasi
 *   relasi (vendor, purchase order, goods receipt, vendor bill, dst) sehingga
 *   label name/code/number stabil, dan menjaga total numerik.
 * - Request payload (`adaptPurchasePayload`): memetakan `date` dari UI ke field
 *   tanggal resource-specific yang diwajibkan backend, plus tanggal sekunder
 *   (needed/expected/due) dan source linkage.
 *
 * Lines diteruskan apa adanya pada slice ini; normalisasi field line (estimated
 * unit price, discount/tax, source line) menjadi scope slice berikutnya.
 */

type PurchaseRecord = Record<string, unknown>

function isRecord(value: unknown): value is PurchaseRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function firstDefined(record: PurchaseRecord, fields: string[]): unknown {
  for (const field of fields) {
    const value = record[field]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

const RELATION_NUMBER_FIELDS = [
  'number',
  'request_number',
  'order_number',
  'receipt_number',
  'bill_number',
  'deposit_number',
  'payment_number',
  'return_number',
]

function normalizeRelation(value: unknown): unknown {
  if (!isRecord(value)) return value

  return {
    ...value,
    name: firstDefined(value, ['name', 'contact_name', 'vendor_name', 'product_name', 'account_name', 'warehouse_name']),
    code: firstDefined(value, ['code', 'contact_code', 'vendor_code', 'product_code', 'account_code', 'warehouse_code']),
    number: firstDefined(value, RELATION_NUMBER_FIELDS),
  }
}

function normalizeLine(value: unknown): unknown {
  if (!isRecord(value)) return value
  return {
    ...value,
    product: normalizeRelation(value.product),
  }
}

export interface PurchaseDocumentOptions {
  /** Field tanggal utama backend, mis. `request_date`. */
  dateField: string
  /** Field tanggal sekunder opsional, mis. `needed_date`/`expected_date`/`due_date`. */
  secondaryDateField?: string
  /** Field UI yang menerima nilai `secondaryDateField` jika namanya berbeda (mis. `expected_delivery_date`). */
  secondaryDateUiField?: string
}

export function adaptPurchaseDocument<T>(value: unknown, options: PurchaseDocumentOptions): T {
  if (!isRecord(value)) return value as T

  const purchaseOrder = normalizeRelation(firstDefined(value, ['purchase_order', 'purchaseOrder']))
  const goodsReceipt = normalizeRelation(firstDefined(value, ['goods_receipt', 'goodsReceipt']))
  const vendorBill = normalizeRelation(firstDefined(value, ['vendor_bill', 'vendorBill']))
  const purchaseRequest = normalizeRelation(firstDefined(value, ['purchase_request', 'purchaseRequest']))

  const out: PurchaseRecord = {
    ...value,
    date: firstDefined(value, ['date', options.dateField]),
    vendor: normalizeRelation(firstDefined(value, ['vendor', 'contact'])),
    payment_term: normalizeRelation(value.payment_term),
    warehouse: normalizeRelation(value.warehouse),
    cash_bank_account: normalizeRelation(firstDefined(value, ['cash_bank_account', 'cashBankAccount'])),
    ap_account: normalizeRelation(firstDefined(value, ['ap_account', 'apAccount'])),
    purchase_order: purchaseOrder,
    goods_receipt: goodsReceipt,
    vendor_bill: vendorBill,
    purchase_request: purchaseRequest,
    purchase_order_number: firstDefined(value, ['purchase_order_number', 'order_number'])
      ?? (isRecord(purchaseOrder) ? purchaseOrder.number : undefined),
    goods_receipt_number: firstDefined(value, ['goods_receipt_number', 'receipt_number'])
      ?? (isRecord(goodsReceipt) ? goodsReceipt.number : undefined),
    vendor_bill_number: firstDefined(value, ['vendor_bill_number', 'bill_number'])
      ?? (isRecord(vendorBill) ? vendorBill.number : undefined),
    purchase_request_number: firstDefined(value, ['purchase_request_number', 'request_number'])
      ?? (isRecord(purchaseRequest) ? purchaseRequest.number : undefined),
    subtotal: Number(firstDefined(value, ['subtotal', 'subtotal_before_discount']) ?? 0),
    discount_amount: Number(firstDefined(value, ['discount_amount', 'discount_total', 'header_discount_amount']) ?? 0),
    tax_amount: Number(firstDefined(value, ['tax_amount', 'tax_total']) ?? 0),
    grand_total: Number(firstDefined(value, ['grand_total', 'amount']) ?? 0),
    lines: Array.isArray(value.lines) ? value.lines.map(normalizeLine) : [],
  }

  if (options.secondaryDateField) {
    const secondary = firstDefined(value, [options.secondaryDateField, options.secondaryDateUiField ?? options.secondaryDateField])
    out[options.secondaryDateField] = secondary
    if (options.secondaryDateUiField) {
      out[options.secondaryDateUiField] = secondary
    }
  }

  return out as T
}

export interface PurchasePayloadOptions {
  /** Field tanggal utama backend yang menerima nilai `date` dari UI. */
  dateField: string
  /** Field tanggal sekunder opsional (needed/expected/due) jika dipakai form. */
  secondaryDateField?: string
  /** Field UI sumber yang dipetakan ke `secondaryDateField` (mis. `expected_delivery_date` → `expected_date`). */
  secondaryDateSourceField?: string
  /** Source linkage opsional untuk dokumen turunan. */
  sourceType?: string
  sourceIdField?: string
}

export function adaptPurchasePayload(value: unknown, options: PurchasePayloadOptions): PurchaseRecord {
  if (!isRecord(value)) return {}

  const payload: PurchaseRecord = { ...value }

  if (value.date !== undefined && payload[options.dateField] === undefined) {
    payload[options.dateField] = value.date
  }
  if (options.dateField !== 'date') {
    delete payload.date
  }

  if (options.secondaryDateField && options.secondaryDateSourceField && options.secondaryDateSourceField !== options.secondaryDateField) {
    const secondary = value[options.secondaryDateSourceField]
    if (secondary !== undefined && payload[options.secondaryDateField] === undefined) {
      payload[options.secondaryDateField] = secondary
    }
    delete payload[options.secondaryDateSourceField]
  }

  if (options.sourceType && options.sourceIdField) {
    const sourceId = firstDefined(value, [options.sourceIdField])
    if (sourceId !== undefined) {
      payload.source_type = options.sourceType
      payload.source_id = sourceId
    }
  }

  return payload
}
