import type { ApiResponse } from '@/types/api.types'
import type { AgingReport } from '@/modules/reports/types/reports.types'
import type { ApLedgerEntry, ApLedgerResponse, ApReconciliationSummary, ApVendorSummary, BillLedgerEntry, BillLedgerResponse } from '../types/ap.types'

type RawRecord = Record<string, unknown>

type RawMovement = {
  date?: string | null
  vendor_id?: number | null
  vendor_name?: string | null
  document_type?: string | null
  document_id?: number | null
  document_number?: string | null
  description?: string | null
  debit?: number | string | null
  credit?: number | string | null
  balance?: number | string | null
}

type RawLedgerResponse = {
  vendor_id?: number | null
  bill_id?: number | null
  movements?: RawMovement[]
}

type RawVendorSummary = {
  vendor_id?: number | null
  vendor_name?: string | null
  debit?: number | string | null
  credit?: number | string | null
  balance?: number | string | null
  gross_ap_outstanding?: number | string | null
  official_ap_balance?: number | string | null
  unapplied_deposit_total?: number | string | null
  net_vendor_exposure?: number | string | null
  ap_accounts?: Array<{ account_id?: number | null; account_code?: string | null; account_name?: string | null }> | null
}

type RawAgingBucket = {
  current?: number | string | null
  '1_30'?: number | string | null
  '31_60'?: number | string | null
  '61_90'?: number | string | null
  over_90?: number | string | null
}

type RawAgingVendorRow = {
  vendor_id?: number | null
  vendor_name?: string | null
  buckets?: RawAgingBucket | null
  total?: number | string | null
}

type RawAgingResponse = {
  as_of_date?: string | null
  buckets?: RawAgingBucket | null
  total?: number | string | null
  vendors?: RawAgingVendorRow[] | null
}

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function adaptAgingBucket(bucket: RawAgingBucket | null | undefined) {
  return {
    current: num(bucket?.current),
    days_1_30: num(bucket?.['1_30']),
    days_31_60: num(bucket?.['31_60']),
    days_61_90: num(bucket?.['61_90']),
    days_over_90: num(bucket?.over_90),
    total: num(bucket?.current) + num(bucket?.['1_30']) + num(bucket?.['31_60']) + num(bucket?.['61_90']) + num(bucket?.over_90),
  }
}

function adaptVendorSummaryRow(row: RawVendorSummary): ApVendorSummary {
  return {
    vendor_id: num(row.vendor_id),
    vendor_name: str(row.vendor_name),
    debit: num(row.debit),
    credit: num(row.credit),
    balance: num(row.balance),
    gross_ap_outstanding: num(row.gross_ap_outstanding),
    official_ap_balance: num(row.official_ap_balance),
    unapplied_deposit_total: num(row.unapplied_deposit_total),
    net_vendor_exposure: num(row.net_vendor_exposure),
    ap_accounts: (row.ap_accounts ?? []).map((account) => ({
      account_id: num(account.account_id),
      account_code: str(account.account_code),
      account_name: str(account.account_name),
    })),
  }
}

function adaptLedgerMovement(movement: RawMovement): ApLedgerEntry {
  return {
    date: str(movement.date),
    type: str(movement.document_type),
    number: str(movement.document_number),
    description: str(movement.description),
    debit: num(movement.debit),
    credit: num(movement.credit),
    running_balance: num(movement.balance),
  }
}

function adaptBillLedgerMovement(movement: RawMovement): BillLedgerEntry {
  return {
    date: str(movement.date),
    type: str(movement.document_type),
    number: str(movement.document_number),
    description: str(movement.description),
    amount: num(movement.credit) - num(movement.debit),
    running_balance: num(movement.balance),
  }
}

export function adaptApAgingResponse(raw: unknown): AgingReport {
  const r = raw as RawAgingResponse
  return {
    as_of_date: str(r.as_of_date),
    lines: (r.vendors ?? []).map((vendor) => ({
      contact_id: num(vendor.vendor_id),
      contact_name: str(vendor.vendor_name),
      buckets: adaptAgingBucket(vendor.buckets),
    })),
    totals: adaptAgingBucket(r.buckets),
  }
}

export function adaptApVendorSummaryResponse(raw: unknown): ApVendorSummary[] {
  return Array.isArray(raw) ? raw.map((row) => adaptVendorSummaryRow(row as RawVendorSummary)) : []
}

export function adaptVendorLedgerResponse(raw: unknown): ApLedgerResponse {
  const r = raw as RawLedgerResponse
  const entries = (r.movements ?? []).map(adaptLedgerMovement)
  return {
    vendor_id: num(r.vendor_id),
    vendor_name: str(r.movements?.[0]?.vendor_name),
    entries,
    ending_balance: entries.at(-1)?.running_balance ?? 0,
  }
}

export function adaptBillLedgerResponse(raw: unknown): BillLedgerResponse {
  const r = raw as RawLedgerResponse
  const entries = (r.movements ?? []).map(adaptBillLedgerMovement)
  return {
    bill_id: num(r.bill_id),
    bill_number: str(r.movements?.[0]?.document_number),
    entries,
    ending_balance: entries.at(-1)?.running_balance ?? 0,
  }
}

export function adaptApReconciliationSummary(raw: unknown): ApReconciliationSummary {
  const r = raw as RawRecord
  return {
    subsidiary_balance: num(r.subsidiary_balance),
    gl_ap_balance: num(r.gl_ap_balance),
    difference: num(r.difference),
    is_reconciled: Boolean(r.is_reconciled),
  }
}

export function adaptReconciliationReport(raw: RawRecord, type: 'ar' | 'ap' | 'inventory') {
  const filters = raw.filters && typeof raw.filters === 'object' && !Array.isArray(raw.filters) ? (raw.filters as RawRecord) : {}
  const summary = raw.summary && typeof raw.summary === 'object' && !Array.isArray(raw.summary) ? (raw.summary as RawRecord) : {}
  const rows = Array.isArray(raw.data) ? raw.data.filter((row): row is RawRecord => !!row && typeof row === 'object' && !Array.isArray(row)) : []

  const lines = rows.map((row) => {
    if (type === 'ap') {
      return {
        account_id: num(row.vendor_id),
        account_code: str(row.vendor_id),
        account_name: str(row.vendor_name),
        gl_balance: num(row.gl_ap_balance),
        subledger_balance: num(row.subledger_ap_balance),
        difference: num(row.difference),
      }
    }

    if (type === 'inventory') {
      return {
        account_id: num(row.inventory_account_id),
        account_code: str(row.inventory_account_code),
        account_name: str(row.inventory_account_name),
        gl_balance: num(row.gl_inventory_balance),
        subledger_balance: num(row.valuation_amount),
        difference: num(row.difference),
      }
    }

    return {
      account_id: num(row.customer_id),
      account_code: str(row.customer_id),
      account_name: str(row.customer_name),
      gl_balance: num(row.gl_ar_balance),
      subledger_balance: num(row.subledger_ar_balance),
      difference: num(row.difference),
    }
  })

  return {
    as_of_date: str(filters.as_of_date ?? filters.end_date ?? filters.date_to ?? filters.start_date),
    type,
    lines,
    total_gl: num(summary.total_gl ?? summary.total_gl_inventory ?? summary.total_gl_ar_balance),
    total_subledger: num(summary.total_subledger ?? summary.total_valuation ?? summary.total_subledger_ar_balance),
    total_difference: num(summary.total_difference),
  }
}

export function adaptApiResponse<T>(response: ApiResponse<unknown>, adapter: (raw: unknown) => T): ApiResponse<T> {
  return { ...response, data: adapter(response.data) }
}