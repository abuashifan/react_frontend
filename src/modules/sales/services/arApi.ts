import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  ArCustomerSummary,
  ArAgingRow,
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

  aging: (params?: ArAgingParams) =>
    http.get<unknown, ApiResponse<ArAgingRow[]>>('/sales/ar/aging', { params }),

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
