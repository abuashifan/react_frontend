// Sumber dokumen untuk "Ambil dari Dokumen Sebelumnya" di form buat-baru Penjualan.
// Daftar sumber: `/sales/source-documents` (sisa qty dihitung backend) bila alurnya
// tersedia di sana, selain itu daftar dokumen biasa yang disaring status. Pembuatan
// dokumen memakai endpoint konversi `from-...` yang sudah ada.
import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import { documentNumber, toNumber, type SourceConvertOption, type SourcePreviewLine } from '@/components/shared/document/sourceConvert'
import { deliveryOrderApi } from './deliveryOrderApi'
import { proformaApi } from './proformaApi'
import { salesInvoiceApi } from './salesInvoiceApi'
import { salesOrderApi } from './salesOrderApi'
import { salesReturnApi } from './salesReturnApi'

interface RawLine {
  id: number
  description?: string | null
  product_code?: string | null
  product?: { product_name?: string; name?: string } | null
  quantity: number | string
  unit_price?: number | string | null
  [key: string]: unknown
}

interface RawDocument {
  id: number
  status: string
  customer?: { name?: string } | null
  lines?: RawLine[]
  [key: string]: unknown
}

interface PickerDocument {
  id: number
  document_number: string
  document_date: string
  lines: RawLine[]
}

function lineLabel(line: RawLine): string {
  return line.product?.product_name ?? line.product?.name ?? line.description ?? line.product_code ?? 'Item'
}

function pickerSource(targetType: string, sourceType: string) {
  const cache = new Map<number, SourcePreviewLine[]>()
  return {
    search: async (query: string, partnerId: number | null): Promise<SelectOption<number>[]> => {
      const res = await http.get<unknown, ApiResponse<PickerDocument[] | { data: PickerDocument[] }>>('/sales/source-documents', {
        params: { target_type: targetType, source_type: sourceType, search: query || undefined, customer_id: partnerId ?? undefined, per_page: 50 },
      })
      // Endpoint ini mengembalikan paginator Laravel utuh di `data` (bentuk `{ data: [...] }`).
      const documents = Array.isArray(res.data) ? res.data : res.data.data
      return documents.map((doc) => {
        cache.set(doc.id, doc.lines.map((line) => ({ id: line.id, label: lineLabel(line), quantity: toNumber(line.quantity), unitPrice: line.unit_price != null ? toNumber(line.unit_price) : null })))
        return { value: doc.id, label: doc.document_number, sublabel: doc.document_date }
      })
    },
    preview: async (id: number): Promise<SourcePreviewLine[]> => cache.get(id) ?? [],
  }
}

function listSource(endpoint: string, numberField: string, statuses: string[], consumedField?: string) {
  return {
    search: async (query: string): Promise<SelectOption<number>[]> => {
      const res = await http.get<unknown, PaginatedResponse<RawDocument>>(endpoint, { params: { search: query || undefined, per_page: 50, page: 1 } })
      return res.data
        .filter((doc) => statuses.includes(doc.status))
        .map((doc) => ({ value: doc.id, label: String(doc[numberField] ?? `#${doc.id}`), sublabel: doc.customer?.name ?? undefined }))
    },
    preview: async (id: number): Promise<SourcePreviewLine[]> => {
      const res = await http.get<unknown, ApiResponse<RawDocument>>(`${endpoint}/${id}`)
      return (res.data.lines ?? [])
        .map((line) => ({
          id: line.id,
          label: lineLabel(line),
          quantity: toNumber(line.quantity) - (consumedField ? toNumber(line[consumedField]) : 0),
          unitPrice: line.unit_price != null ? toNumber(line.unit_price) : null,
        }))
        .filter((line) => line.quantity > 0)
    },
  }
}

const created = (data: unknown) => ({ id: Number((data as { id: number }).id), number: documentNumber(data) })

// Status SO yang sudah boleh ditindaklanjuti (sama dengan tombol di halaman SO).
const SO_FOLLOW_UP = ['confirmed', 'partially_delivered', 'delivered', 'partially_invoiced']

export const salesOrderSources: SourceConvertOption[] = [
  {
    key: 'sales_quotation',
    label: 'Dari Penawaran',
    placeholder: 'Pilih penawaran...',
    ...pickerSource('sales.orders', 'sales_quotation'),
    convert: async (id) => created((await salesOrderApi.createFromQuotation(id)).data),
  },
]

export const deliveryOrderSources: SourceConvertOption[] = [
  {
    key: 'sales_order',
    label: 'Dari Pesanan Penjualan',
    placeholder: 'Pilih pesanan penjualan...',
    ...pickerSource('sales.delivery-orders', 'sales_order'),
    convert: async (id) => created((await deliveryOrderApi.createFromSalesOrder(id)).data),
  },
]

export const proformaSources: SourceConvertOption[] = [
  {
    key: 'sales_order',
    label: 'Dari Pesanan Penjualan',
    placeholder: 'Pilih pesanan penjualan...',
    ...pickerSource('sales.proformas', 'sales_order'),
    convert: async (id) => created((await proformaApi.createFromSalesOrder(id)).data),
  },
]

export const salesInvoiceSources: SourceConvertOption[] = [
  {
    key: 'sales_order',
    label: 'Dari Pesanan Penjualan',
    placeholder: 'Pilih pesanan penjualan...',
    ...listSource('/sales/orders', 'order_number', SO_FOLLOW_UP, 'invoiced_quantity'),
    convert: async (id) => created((await salesInvoiceApi.createFromSalesOrder(id)).data),
  },
  {
    key: 'delivery_order',
    label: 'Dari Pengiriman',
    placeholder: 'Pilih pengiriman barang...',
    ...pickerSource('sales.invoices', 'delivery_order'),
    convert: async (id) => created((await salesInvoiceApi.createFromDeliveryOrder(id)).data),
  },
  {
    key: 'proforma_invoice',
    label: 'Dari Faktur Sementara',
    placeholder: 'Pilih faktur sementara...',
    ...listSource('/sales/proformas', 'proforma_number', ['issued', 'accepted']),
    convert: async (id) => created((await salesInvoiceApi.createFromProforma(id)).data),
  },
]

export const salesReturnSources: SourceConvertOption[] = [
  {
    key: 'sales_invoice',
    label: 'Dari Faktur Penjualan',
    placeholder: 'Pilih faktur penjualan...',
    ...listSource('/sales/invoices', 'invoice_number', ['posted', 'partially_paid', 'paid']),
    convert: async (id) => created((await salesReturnApi.createFromInvoice(id)).data),
  },
  {
    key: 'delivery_order',
    label: 'Dari Pengiriman',
    placeholder: 'Pilih pengiriman barang...',
    ...listSource('/sales/delivery-orders', 'delivery_number', ['shipped', 'delivered', 'partially_invoiced', 'invoiced']),
    convert: async (id) => created((await salesReturnApi.createFromDeliveryOrder(id)).data),
  },
]

