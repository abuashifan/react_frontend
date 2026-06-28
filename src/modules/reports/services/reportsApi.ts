import axios from 'axios'
import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  ReportParams,
  GeneralLedgerReport,
  TrialBalanceReport,
  TrialBalanceAccount,
  TrialBalanceTotals,
  ProfitLossReport,
  BalanceSheetReport,
  ReportSection,
  ReportAccountLine,
  CashFlowReport,
  CashFlowAccount,
  FinancialSummaryReport,
  AgingReport,
  StockBalanceReportLine,
  StockMovementReportLine,
  StockCardReport,
  ValuationReportLine,
  LowStockReportLine,
  GrniReconciliationReport,
  GrniReconciliationLine,
  DepositReconciliationReport,
  DepositReconciliationLine,
  AccountLedgerReport,
  AccountLedgerLine,
} from '../types/reports.types'
import { adaptApiResponse, adaptApAgingResponse, adaptReconciliationReport } from '@/modules/purchase/services/apAdapters'
import { useAuthStore } from '@/stores/useAuthStore'

// ---------------------------------------------------------------------------
// Adapter boundary (Audit-12 A12-12).
//
// Backend report service mengembalikan { valid, filter, ... } dengan array yang
// kadang kosong/absen. Helper di bawah menormalkan setiap response menjadi
// shape stabil di reports.types.ts, sehingga page tidak pernah membaca
// property `undefined` dan crash.
// ---------------------------------------------------------------------------

type Raw = Record<string, unknown>

function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : {}
}

function asArray(value: unknown): Raw[] {
  return Array.isArray(value) ? (value as unknown[]).map(asRecord) : []
}

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function adaptTrialBalance(raw: Raw): TrialBalanceReport {
  const accounts: TrialBalanceAccount[] = asArray(raw.accounts).map((a) => ({
    account_id: num(a.account_id),
    account_code: str(a.account_code),
    account_name: str(a.account_name),
    account_type: str(a.account_type),
    normal_balance: str(a.normal_balance),
    is_active: Boolean(a.is_active),
    opening_debit: num(a.opening_debit),
    opening_credit: num(a.opening_credit),
    period_debit: num(a.period_debit),
    period_credit: num(a.period_credit),
    ending_debit: num(a.ending_debit),
    ending_credit: num(a.ending_credit),
    ending_balance: num(a.ending_balance),
  }))
  const t = asRecord(raw.totals)
  const totals: TrialBalanceTotals = {
    opening_debit: num(t.opening_debit),
    opening_credit: num(t.opening_credit),
    period_debit: num(t.period_debit),
    period_credit: num(t.period_credit),
    ending_debit: num(t.ending_debit),
    ending_credit: num(t.ending_credit),
    difference: num(t.difference),
    is_balanced: Boolean(t.is_balanced),
  }
  return { accounts, totals }
}

function adaptAccountLine(a: Raw): ReportAccountLine {
  return {
    account_id: a.account_id == null ? null : num(a.account_id),
    account_code: a.account_code == null ? null : str(a.account_code),
    account_name: str(a.account_name),
    account_type: str(a.account_type),
    normal_balance: str(a.normal_balance),
    debit: num(a.debit),
    credit: num(a.credit),
    amount: num(a.amount),
    is_active: Boolean(a.is_active),
    is_system_generated: Boolean(a.is_system_generated),
  }
}

function adaptSections(raw: Raw): ReportSection[] {
  return asArray(raw.sections).map((s) => ({
    key: str(s.key),
    label: str(s.label),
    accounts: asArray(s.accounts).map(adaptAccountLine),
    total: num(s.total),
  }))
}

function adaptProfitLoss(raw: Raw): ProfitLossReport {
  const t = asRecord(raw.totals)
  return {
    sections: adaptSections(raw),
    totals: {
      total_revenue: num(t.total_revenue),
      total_expense: num(t.total_expense),
      net_profit: num(t.net_profit),
      net_loss: num(t.net_loss),
      net_profit_or_loss: num(t.net_profit_or_loss),
    },
  }
}

function adaptBalanceSheet(raw: Raw): BalanceSheetReport {
  const t = asRecord(raw.totals)
  return {
    sections: adaptSections(raw),
    totals: {
      total_assets: num(t.total_assets),
      total_liabilities: num(t.total_liabilities),
      total_equity: num(t.total_equity),
      total_liabilities_and_equity: num(t.total_liabilities_and_equity),
      current_year_profit_or_loss: num(t.current_year_profit_or_loss),
      difference: num(t.difference),
      is_balanced: Boolean(t.is_balanced),
    },
  }
}

function adaptCashFlowSection(raw: unknown): import('../types/reports.types').CashFlowSection | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const r = raw as Raw
  return { cash_in: num(r.cash_in), cash_out: num(r.cash_out), net: num(r.net) }
}

function adaptCashFlow(raw: Raw): CashFlowReport {
  const s = asRecord(raw.summary)
  const accounts: CashFlowAccount[] = asArray(raw.accounts).map((a) => ({
    account_id: num(a.account_id),
    account_code: str(a.account_code),
    account_name: str(a.account_name),
    normal_balance: str(a.normal_balance),
    opening_balance: num(a.opening_balance),
    cash_in: num(a.cash_in),
    cash_out: num(a.cash_out),
    net_cash_flow: num(a.net_cash_flow),
    ending_balance: num(a.ending_balance),
    is_active: Boolean(a.is_active),
  }))
  const rawSections = raw.sections && typeof raw.sections === 'object' && !Array.isArray(raw.sections) ? (raw.sections as Raw) : null
  return {
    summary: {
      opening_cash_balance: num(s.opening_cash_balance),
      cash_in: num(s.cash_in),
      cash_out: num(s.cash_out),
      net_cash_flow: num(s.net_cash_flow),
      ending_cash_balance: num(s.ending_cash_balance),
    },
    accounts,
    no_cash_accounts: Boolean(asRecord(raw.notes).no_cash_accounts),
    sections: rawSections ? {
      operating: adaptCashFlowSection(rawSections.operating),
      investing: adaptCashFlowSection(rawSections.investing),
      financing: adaptCashFlowSection(rawSections.financing),
      unclassified: adaptCashFlowSection(rawSections.unclassified),
    } : undefined,
  }
}

function adaptFinancialSummary(raw: Raw): FinancialSummaryReport {
  const pl = asRecord(raw.profit_loss)
  const bs = asRecord(raw.balance_sheet)
  const cf = asRecord(raw.cash_flow)
  return {
    profit_loss: { net_profit_or_loss: num(pl.net_profit_or_loss) },
    balance_sheet: {
      total_assets: num(bs.total_assets),
      total_liabilities: num(bs.total_liabilities),
      total_equity: num(bs.total_equity),
      is_balanced: Boolean(bs.is_balanced),
      current_year_profit_or_loss: num(bs.current_year_profit_or_loss),
    },
    cash_flow: {
      opening_cash_balance: num(cf.opening_cash_balance),
      cash_in: num(cf.cash_in),
      cash_out: num(cf.cash_out),
      ending_cash_balance: num(cf.ending_cash_balance),
    },
  }
}

// General Ledger — backend: { accounts: [{ account, opening_balance,
// period_totals, ending_balance }] }. Shape lama membaca `accounts[].lines`
// dan crash (A13-232). Di sini diratakan ke ringkasan per akun.
function adaptGeneralLedger(raw: Raw): GeneralLedgerReport {
  return {
    accounts: asArray(raw.accounts).map((row) => {
      const account = asRecord(row.account)
      const period = asRecord(row.period_totals)
      const opening = asRecord(row.opening_balance)
      return {
        account_id: num(account.id),
        account_code: str(account.account_code),
        account_name: str(account.account_name),
        account_type: str(account.account_type),
        normal_balance: str(account.normal_balance),
        opening_balance: num(opening.balance),
        period_debit: num(period.debit),
        period_credit: num(period.credit),
        ending_balance: num(row.ending_balance),
      }
    }),
  }
}

// AR aging — backend: { as_of_date, buckets, customers: [{ customer_id,
// customer_name, buckets, total }] }. UI membaca lines/totals (A13-235).
function adaptAgingBucket(bucket: Raw) {
  return {
    current: num(bucket.current),
    days_1_30: num(bucket['1_30']),
    days_31_60: num(bucket['31_60']),
    days_61_90: num(bucket['61_90']),
    days_over_90: num(bucket.over_90),
    total: num(bucket.current) + num(bucket['1_30']) + num(bucket['31_60']) + num(bucket['61_90']) + num(bucket.over_90),
  }
}

function adaptArAging(raw: Raw): AgingReport {
  return {
    as_of_date: str(raw.as_of_date),
    lines: asArray(raw.customers).map((c) => ({
      contact_id: num(c.customer_id),
      contact_name: str(c.customer_name),
      buckets: adaptAgingBucket(asRecord(c.buckets)),
    })),
    totals: adaptAgingBucket(asRecord(raw.buckets)),
  }
}

// Inventory reports — backend membungkus baris dalam objek { filters, rows,
// totals }. UI lama memanggil `.map()` pada objek dan crash (A13-237/238).
function adaptStockBalances(raw: Raw): StockBalanceReportLine[] {
  return asArray(raw.rows).map((r) => {
    const product = asRecord(r.product)
    const warehouse = asRecord(r.warehouse)
    return {
      product_id: num(product.id),
      product_code: str(product.code),
      product_name: str(product.name),
      warehouse_id: num(warehouse.id),
      warehouse_name: str(warehouse.name),
      unit: str(r.unit),
      qty_on_hand: num(r.quantity_on_hand),
      avg_cost: num(r.average_cost),
      total_value: num(r.total_value),
    }
  })
}

function adaptStockMovements(raw: Raw): StockMovementReportLine[] {
  return asArray(raw.rows).map((r) => {
    const product = asRecord(r.product)
    const warehouse = asRecord(r.warehouse)
    return {
      date: str(r.movement_date),
      movement_number: str(r.movement_number),
      movement_type: str(r.movement_type),
      product_id: num(product.id),
      product_name: str(product.name),
      warehouse_name: str(warehouse.name),
      qty_in: num(r.quantity_in),
      qty_out: num(r.quantity_out),
      unit_cost: num(r.unit_cost),
      total_cost: num(r.total_cost),
    }
  })
}

function adaptValuation(raw: Raw): ValuationReportLine[] {
  return asArray(raw.rows).map((r) => ({
    product_id: num(r.product_id),
    product_code: str(r.product_code),
    product_name: str(r.product_name),
    unit: str(r.unit),
    qty_on_hand: num(r.quantity_on_hand),
    avg_cost: num(r.average_cost),
    total_value: num(r.total_value),
  }))
}

function adaptGrni(raw: Raw): GrniReconciliationReport {
  const summary = asRecord(raw.summary)
  const data: GrniReconciliationLine[] = asArray(raw.data).map((r) => ({
    goods_receipt_id: num(r.goods_receipt_id),
    receipt_number: str(r.receipt_number),
    receipt_date: str(r.receipt_date),
    vendor_id: r.vendor_id == null ? null : num(r.vendor_id),
    vendor_name: r.vendor_name == null ? null : str(r.vendor_name),
    product_id: r.product_id == null ? null : num(r.product_id),
    product_name: r.product_name == null ? null : str(r.product_name),
    received_quantity: num(r.received_quantity),
    billed_quantity: num(r.billed_quantity),
    outstanding_quantity: num(r.outstanding_quantity),
    estimated_outstanding_amount: num(r.estimated_outstanding_amount),
    grni_gl_balance_related: num(r.grni_gl_balance_related),
    difference: num(r.difference),
    status: str(r.status) === 'mismatch' ? 'mismatch' : 'matched',
  }))
  return {
    summary: {
      total_outstanding_quantity: num(summary.total_outstanding_quantity),
      total_estimated_outstanding_amount: num(summary.total_estimated_outstanding_amount),
      total_grni_gl_balance_related: num(summary.total_grni_gl_balance_related),
      mismatch_count: num(summary.mismatch_count),
    },
    data,
  }
}

function adaptDeposits(raw: Raw, contactKey: 'customer' | 'vendor'): DepositReconciliationReport {
  const summary = asRecord(raw.summary)
  const idKey = `${contactKey}_id`
  const numKey = `${contactKey}_number`
  const nameKey = `${contactKey}_name`
  const data: DepositReconciliationLine[] = asArray(raw.data).map((r) => ({
    contact_id: num(r[idKey]),
    contact_number: str(r[numKey]),
    contact_name: r[nameKey] == null ? null : str(r[nameKey]),
    deposit_id: num(r.deposit_id),
    deposit_number: str(r.deposit_number),
    deposit_date: r.deposit_date == null ? null : str(r.deposit_date),
    amount: num(r.amount),
    allocated_amount: num(r.allocated_amount),
    remaining_amount: num(r.remaining_amount),
    status: str(r.status),
  }))
  return {
    summary: {
      total_deposit: num(summary.total_deposit),
      total_allocated: num(summary.total_allocated),
      total_unapplied: num(summary.total_unapplied),
    },
    data,
  }
}

function adaptAccountLedger(raw: Raw): AccountLedgerReport {
  const account = asRecord(raw.account)
  const opening = asRecord(raw.opening_balance)
  const period = asRecord(raw.period_totals)
  const lines: AccountLedgerLine[] = asArray(raw.lines).map((l) => ({
    journal_entry_id: num(l.journal_entry_id),
    journal_entry_line_id: num(l.journal_entry_line_id),
    journal_number: str(l.journal_number),
    journal_date: str(l.journal_date),
    description: l.description == null ? null : str(l.description),
    debit: num(l.debit),
    credit: num(l.credit),
    running_balance: num(l.running_balance),
    source_type: l.source_type == null ? null : str(l.source_type),
    source_number: l.source_number == null ? null : str(l.source_number),
  }))
  return {
    account: {
      id: num(account.id),
      account_code: str(account.account_code),
      account_name: str(account.account_name),
      account_type: str(account.account_type),
      normal_balance: str(account.normal_balance),
      is_active: Boolean(account.is_active),
    },
    opening_balance: { debit: num(opening.debit), credit: num(opening.credit), balance: num(opening.balance) },
    period_totals: { debit: num(period.debit), credit: num(period.credit), movement_balance: num(period.movement_balance) },
    ending_balance: num(raw.ending_balance),
    lines,
    total_lines: raw.total_lines != null ? num(raw.total_lines) : lines.length,
    truncated: Boolean(raw.truncated),
  }
}

function adaptAlertRows(raw: Raw): LowStockReportLine[] {
  return asArray(raw.rows).map((r) => ({
    product_id: num(r.product_id),
    product_code: str(r.product_code),
    product_name: str(r.product_name),
    warehouse_name: str(r.warehouse_name),
    qty_on_hand: num(r.quantity_on_hand),
    min_stock: r.min_stock == null ? null : num(r.min_stock),
    unit: str(r.unit),
  }))
}

function adaptResponse<T>(res: ApiResponse<unknown>, adapt: (raw: Raw) => T): ApiResponse<T> {
  return { ...res, data: adapt(asRecord(res.data)) }
}

async function getRawApiResponse<T>(path: string, params: ReportParams): Promise<ApiResponse<T>> {
  const { token, activeCompanyId } = useAuthStore.getState()
  const response = await axios.get<ApiResponse<T>>(`${import.meta.env.VITE_API_BASE_URL}/api${path}`, {
    params,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeCompanyId ? { 'X-Company-ID': String(activeCompanyId) } : {}),
    },
  })

  return response.data
}

export const reportsApi = {
  generalLedger: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/general-ledger', { params })
      .then((res) => adaptResponse(res, adaptGeneralLedger)),

  trialBalance: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/trial-balance', { params })
      .then((res) => adaptResponse(res, adaptTrialBalance)),

  profitLoss: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/profit-loss', { params })
      .then((res) => adaptResponse(res, adaptProfitLoss)),

  balanceSheet: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/balance-sheet', { params })
      .then((res) => adaptResponse(res, adaptBalanceSheet)),

  cashFlow: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/cash-flow', { params })
      .then((res) => adaptResponse(res, adaptCashFlow)),

  financialSummary: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/financial-summary', { params })
      .then((res) => adaptResponse(res, adaptFinancialSummary)),

  arAging: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/sales/ar/aging', { params })
      .then((res) => adaptResponse(res, adaptArAging)),

  apAging: (params: ReportParams) =>
    http.get<unknown, ApiResponse<unknown>>('/purchase/ap/aging', { params }).then((response) => adaptApiResponse(response, adaptApAgingResponse)),

  reconciliationAr: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/ar', params).then((response) => adaptResponse(response, (raw) => adaptReconciliationReport(asRecord(raw), 'ar'))),

  reconciliationAp: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/ap', params).then((response) => adaptResponse(response, (raw) => adaptReconciliationReport(asRecord(raw), 'ap'))),

  reconciliationInventory: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/inventory', params).then((response) => adaptResponse(response, (raw) => adaptReconciliationReport(asRecord(raw), 'inventory'))),

  stockBalances: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/inventory/reports/stock-balances', { params })
      .then((res) => adaptResponse(res, adaptStockBalances)),

  stockMovements: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/inventory/reports/stock-movements', { params })
      .then((res) => adaptResponse(res, adaptStockMovements)),

  stockCard: (params: ReportParams & { product_id?: number; warehouse_id?: number }) =>
    http.get<unknown, ApiResponse<StockCardReport>>('/inventory/reports/stock-card', { params }),

  valuation: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/inventory/reports/valuation', { params })
      .then((res) => adaptResponse(res, adaptValuation)),

  lowStock: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/inventory/reports/low-stock', { params })
      .then((res) => adaptResponse(res, adaptAlertRows)),

  negativeStock: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/inventory/reports/negative-stock', { params })
      .then((res) => adaptResponse(res, adaptAlertRows)),

  reconciliationGrni: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/grni', params)
      .then((res) => adaptResponse(res, adaptGrni)),

  reconciliationCustomerDeposits: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/customer-deposits', params)
      .then((res) => adaptResponse(res, (raw) => adaptDeposits(raw, 'customer'))),

  reconciliationVendorDeposits: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/vendor-deposits', params)
      .then((res) => adaptResponse(res, (raw) => adaptDeposits(raw, 'vendor'))),

  accountLedger: (accountId: number, params: ReportParams) =>
    getRawApiResponse(`/reports/account-ledger/${accountId}`, params)
      .then((res) => adaptResponse(res, adaptAccountLedger)),
}
