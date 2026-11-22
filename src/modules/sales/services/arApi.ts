import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  ArCustomerSummary,
  ArAgingRow,
  ArAgingApiResponse,
  ArReconciliationRow,
  CustomerLedgerEntry,
  InvoiceLedgerEntry,
  ArSummaryParams,
  ArAgingParams,
  CustomerLedgerParams,
  InvoiceLedgerParams,
} from '../types/ar.types'
import type { SalesInvoice } from '../types/salesInvoice.types'

type ArMovement = {
  date: string
  document_type: 'sales_invoice' | 'sales_receipt' | 'sales_return' | 'customer_deposit' | 'customer_deposit_allocation'
  document_id: number
  invoice_id?: number | null
  document_number: string
  description: string
  debit: number
  credit: number
  balance: number
}

const customerMovementTypes: Record<ArMovement['document_type'], CustomerLedgerEntry['type']> = {
  sales_invoice: 'invoice',
  sales_receipt: 'receipt',
  sales_return: 'return',
  customer_deposit: 'deposit',
  customer_deposit_allocation: 'deposit_allocation',
}

const invoiceMovementTypes: Record<ArMovement['document_type'], InvoiceLedgerEntry['type']> = {
  sales_invoice: 'post',
  sales_receipt: 'payment',
  sales_return: 'return',
  customer_deposit: 'deposit_allocation',
  customer_deposit_allocation: 'deposit_allocation',
}

function ledgerFields(row: ArMovement) {
  return {
    id: [row.document_type, row.document_id, row.invoice_id ?? ''].join(':'),
    date: row.date,
    number: row.document_number,
    description: row.description,
    running_balance: row.balance,
  }
}

export const arApi = {
  customerSummary: (params?: ArSummaryParams) =>
    http.get<unknown, ApiResponse<ArCustomerSummary[]>>('/sales/ar/customer-summary', { params }),

  aging: async (params?: ArAgingParams): Promise<ApiResponse<ArAgingRow[]>> => {
    const query = { as_of_date: params?.as_of, customer_id: params?.customer_id }
    const res = await http.get<unknown, ApiResponse<ArAgingApiResponse>>('/sales/ar/aging', { params: query })
    const rows: ArAgingRow[] = (res.data?.customers ?? []).map((c) => ({
      customer_id: c.customer_id,
      customer_name: c.customer_name,
      customer_code: c.customer_code ?? '',
      current: c.buckets.current,
      days_1_30: c.buckets['1_30'],
      days_31_60: c.buckets['31_60'],
      days_61_90: c.buckets['61_90'],
      days_over_90: c.buckets.over_90,
      total: c.total,
    }))
    return { ...res, data: rows }
  },

  reconciliation: async (): Promise<ApiResponse<ArReconciliationRow[]>> => {
    const response = await http.get<unknown, ApiResponse<{
      gl_ar_balance: number
      subsidiary_balance: number
      difference: number
    }>>('/sales/ar/reconciliation')
    return { ...response, data: [{
      account_code: '',
      account_name: 'Total akun piutang',
      gl_balance: response.data.gl_ar_balance,
      ar_balance: response.data.subsidiary_balance,
      difference: response.data.difference,
    }] }
  },

  openInvoices: (customerId?: number) =>
    http.get<unknown, ApiResponse<SalesInvoice[]>>('/sales/ar/open-invoices', {
      params: customerId ? { customer_id: customerId } : undefined,
    }),

  customerLedger: async (customerId: number, params?: CustomerLedgerParams): Promise<ApiResponse<CustomerLedgerEntry[]>> => {
    const response = await http.get<unknown, ApiResponse<{ movements: ArMovement[] }>>(
      `/sales/ar/customers/${customerId}/ledger`,
      { params: { start_date: params?.date_from, end_date: params?.date_to } },
    )
    return { ...response, data: response.data.movements.map((row) => ({
      ...ledgerFields(row), type: customerMovementTypes[row.document_type], debit: row.debit, credit: row.credit,
    })) }
  },

  invoiceLedger: async (invoiceId: number, params?: InvoiceLedgerParams): Promise<ApiResponse<InvoiceLedgerEntry[]>> => {
    const response = await http.get<unknown, ApiResponse<{ movements: ArMovement[] }>>(
      `/sales/ar/invoices/${invoiceId}/ledger`,
      { params: { start_date: params?.date_from, end_date: params?.date_to } },
    )
    return { ...response, data: response.data.movements.map((row) => ({
      ...ledgerFields(row), type: invoiceMovementTypes[row.document_type], amount: row.debit - row.credit,
    })) }
  },
}
