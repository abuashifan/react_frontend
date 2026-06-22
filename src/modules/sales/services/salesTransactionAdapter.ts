type SalesRecord = Record<string, unknown>

function isRecord(value: unknown): value is SalesRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function firstDefined(record: SalesRecord, fields: string[]): unknown {
  for (const field of fields) {
    const value = record[field]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

function normalizeRelation(value: unknown): unknown {
  if (!isRecord(value)) return value

  return {
    ...value,
    name: firstDefined(value, ['name', 'contact_name', 'product_name', 'account_name', 'warehouse_name']),
    code: firstDefined(value, ['code', 'contact_code', 'product_code', 'account_code', 'warehouse_code']),
    number: firstDefined(value, [
      'number',
      'quotation_number',
      'order_number',
      'delivery_number',
      'proforma_number',
      'invoice_number',
      'deposit_number',
      'receipt_number',
      'return_number',
    ]),
  }
}

function normalizeLine(value: unknown): unknown {
  if (!isRecord(value)) return value
  const product = normalizeRelation(value.product)
  const unitPrice = Number(firstDefined(value, ['unit_price']) ?? 0)
  const quantity = Number(firstDefined(value, ['quantity']) ?? 0)
  const discountValue = Number(firstDefined(value, ['discount_value', 'discount_amount']) ?? 0)
  const discountType = firstDefined(value, ['discount_type'])
  const discountPercent = discountType === 'percent'
    ? discountValue
    : Number(firstDefined(value, ['discount_percent']) ?? 0)

  return {
    ...value,
    product,
    description: String(firstDefined(value, ['description', 'product_name']) ?? ''),
    discount_percent: discountPercent,
    tax_percent: Number(firstDefined(value, ['tax_rate', 'tax_percent']) ?? 0),
    subtotal: Number(firstDefined(value, ['line_total', 'subtotal']) ?? (quantity * unitPrice)),
    line_total: Number(firstDefined(value, ['line_total', 'subtotal']) ?? (quantity * unitPrice)),
    invoice: normalizeRelation(firstDefined(value, ['invoice', 'sales_invoice'])),
  }
}

export function adaptSalesDocument<T>(
  value: unknown,
  options: {
    dateFields: string[]
    expiryFields?: string[]
  },
): T {
  if (!isRecord(value)) return value as T

  const salesInvoice = normalizeRelation(value.sales_invoice)
  const deliveryOrder = normalizeRelation(value.delivery_order)
  const cashBankAccount = normalizeRelation(firstDefined(value, ['cash_bank_account', 'cashBankAccount']))

  return {
    ...value,
    date: firstDefined(value, ['date', ...options.dateFields]),
    expiry_date: firstDefined(value, ['expiry_date', ...(options.expiryFields ?? [])]),
    customer: normalizeRelation(value.customer),
    payment_term: normalizeRelation(value.payment_term),
    warehouse: normalizeRelation(value.warehouse),
    cash_bank_account: cashBankAccount,
    sales_invoice: salesInvoice,
    delivery_order: deliveryOrder,
    sales_invoice_number: firstDefined(value, ['sales_invoice_number'])
      ?? (isRecord(salesInvoice) ? salesInvoice.number : undefined),
    delivery_order_number: firstDefined(value, ['delivery_order_number'])
      ?? (isRecord(deliveryOrder) ? deliveryOrder.number : undefined),
    sales_order_number: firstDefined(value, ['sales_order_number', 'order_number'])
      ?? (isRecord(value.sales_order) ? firstDefined(value.sales_order, ['number', 'order_number']) : undefined),
    proforma_number: firstDefined(value, ['proforma_number'])
      ?? (isRecord(value.proforma_invoice) ? firstDefined(value.proforma_invoice, ['number', 'proforma_number']) : undefined),
    subtotal: Number(firstDefined(value, ['subtotal', 'subtotal_before_discount']) ?? 0),
    discount_amount: Number(firstDefined(value, ['discount_amount', 'discount_total', 'header_discount_amount']) ?? 0),
    tax_amount: Number(firstDefined(value, ['tax_amount', 'tax_total']) ?? 0),
    grand_total: Number(firstDefined(value, ['grand_total', 'amount']) ?? 0),
    lines: Array.isArray(value.lines) ? value.lines.map(normalizeLine) : [],
  } as T
}

function adaptLinePayload(value: unknown): unknown {
  if (!isRecord(value)) return value

  const discountPercent = Number(firstDefined(value, ['discount_percent']) ?? 0)
  const taxPercent = Number(firstDefined(value, ['tax_percent']) ?? 0)
  const quantity = Number(firstDefined(value, ['quantity']) ?? 0)
  const unitPrice = Number(firstDefined(value, ['unit_price']) ?? 0)
  const lineTotal = quantity * unitPrice * (1 - discountPercent / 100) * (1 + taxPercent / 100)
  const payload: SalesRecord = { ...value }

  delete payload.discount_percent
  delete payload.tax_percent
  delete payload.subtotal
  delete payload.product
  delete payload.invoice

  return {
    ...payload,
    discount_type: discountPercent > 0 ? 'percent' : undefined,
    discount_value: discountPercent,
    tax_rate: taxPercent,
    line_total: Number(firstDefined(value, ['line_total']) ?? lineTotal),
  }
}

export function adaptSalesPayload(
  value: unknown,
  options: {
    dateField: string
    expiryField?: string
    sourceType?: string
    sourceIdField?: string
  },
): SalesRecord {
  if (!isRecord(value)) return {}

  const payload: SalesRecord = { ...value }
  payload[options.dateField] = value.date
  delete payload.date

  if (options.expiryField) {
    payload[options.expiryField] = firstDefined(value, ['expiry_date', 'valid_until'])
    delete payload.expiry_date
    delete payload.valid_until
  }

  if (options.sourceType && options.sourceIdField) {
    const sourceId = firstDefined(value, [options.sourceIdField])
    if (sourceId !== undefined) {
      payload.source_type = options.sourceType
      payload.source_id = sourceId
    }
  }

  if (value.proforma_id !== undefined && value.proforma_invoice_id === undefined) {
    payload.proforma_invoice_id = value.proforma_id
    delete payload.proforma_id
  }

  if (Array.isArray(value.lines)) {
    payload.lines = value.lines.map(adaptLinePayload)
  }

  return payload
}
