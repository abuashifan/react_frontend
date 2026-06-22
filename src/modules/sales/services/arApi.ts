import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  ArAgingParams,
  ArAgingView,
  ArReconciliationParams,
  ArReconciliationView,
  ArSummaryParams,
  CustomerLedgerParams,
  CustomerLedgerView,
  InvoiceLedgerParams,
  ArSummaryView,
  InvoiceLedgerView,
} from '../types/ar.types'
import type { SalesInvoice } from '../types/salesInvoice.types'
import {
  adaptArAgingResponse,
  adaptArReconciliationResponse,
  adaptArSummaryResponse,
  adaptCustomerLedgerResponse,
  adaptInvoiceLedgerResponse,
} from './arAdapter'

export const arApi = {
  customerSummary: async (params?: ArSummaryParams): Promise<ApiResponse<ArSummaryView>> => {
    const res = await http.get<unknown, ApiResponse<unknown>>('/sales/ar/customer-summary', { params })
    return adaptArSummaryResponse(res)
  },

  aging: async (params?: ArAgingParams): Promise<ApiResponse<ArAgingView>> => {
    const res = await http.get<unknown, ApiResponse<unknown>>('/sales/ar/aging', { params })
    return adaptArAgingResponse(res)
  },

  reconciliation: async (params?: ArReconciliationParams): Promise<ApiResponse<ArReconciliationView>> => {
    const res = await http.get<unknown, ApiResponse<unknown>>('/sales/ar/reconciliation', { params })
    return adaptArReconciliationResponse(res)
  },

  openInvoices: (customerId?: number) =>
    http.get<unknown, ApiResponse<SalesInvoice[]>>('/sales/ar/open-invoices', {
      params: customerId ? { customer_id: customerId } : undefined,
    }),

  customerLedger: async (customerId: number, params?: CustomerLedgerParams): Promise<ApiResponse<CustomerLedgerView>> => {
    const res = await http.get<unknown, ApiResponse<unknown>>(`/sales/ar/customers/${customerId}/ledger`, { params })
    return adaptCustomerLedgerResponse(res)
  },

  invoiceLedger: async (invoiceId: number, params?: InvoiceLedgerParams): Promise<ApiResponse<InvoiceLedgerView>> => {
    const res = await http.get<unknown, ApiResponse<unknown>>(`/sales/ar/invoices/${invoiceId}/ledger`, { params })
    return adaptInvoiceLedgerResponse(res)
  },
}
