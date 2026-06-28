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

  reconciliation: () =>
    http.get<unknown, ApiResponse<ArReconciliationRow[]>>('/sales/ar/reconciliation'),

  openInvoices: (customerId?: number) =>
    http.get<unknown, ApiResponse<SalesInvoice[]>>('/sales/ar/open-invoices', {
      params: customerId ? { customer_id: customerId } : undefined,
    }),

  customerLedger: (customerId: number, params?: CustomerLedgerParams) =>
    http.get<unknown, ApiResponse<CustomerLedgerEntry[]>>(
      `/sales/ar/customers/${customerId}/ledger`,
      { params },
    ),

  invoiceLedger: (invoiceId: number, params?: InvoiceLedgerParams) =>
    http.get<unknown, ApiResponse<InvoiceLedgerEntry[]>>(
      `/sales/ar/invoices/${invoiceId}/ledger`,
      { params },
    ),
}
