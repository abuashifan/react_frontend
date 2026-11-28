// Sumber dokumen untuk "Ambil dari Dokumen Sebelumnya" di form buat-baru Pembelian.
// Daftar sumber: `/purchase/source-documents` (sisa qty dihitung backend) bila alurnya
// tersedia di sana, selain itu daftar dokumen biasa yang disaring status. Pembuatan
// dokumen memakai endpoint konversi `from-...` yang sudah ada.
import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import { documentNumber, toNumber, type SourceConvertOption, type SourcePreviewLine } from '@/components/shared/document/sourceConvert'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { goodsReceiptApi } from './goodsReceiptApi'
import { purchaseOrderApi } from './purchaseOrderApi'
import { purchaseReturnApi } from './purchaseReturnApi'
import { vendorBillApi } from './vendorBillApi'
import { vendorBillSourceApi, type BillSourceType } from './vendorBillSourceApi'

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
  vendor?: { name?: string } | null
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

/** Dokumen dari `/purchase/source-documents`; barisnya disimpan untuk pratinjau. */
function pickerSource(targetType: string, sourceType: string) {
  const cache = new Map<number, SourcePreviewLine[]>()
  return {
    search: async (query: string, partnerId: number | null): Promise<SelectOption<number>[]> => {
      const res = await http.get<unknown, ApiResponse<PickerDocument[] | { data: PickerDocument[] }>>('/purchase/source-documents', {
        params: { target_type: targetType, source_type: sourceType, search: query || undefined, vendor_id: partnerId ?? undefined, per_page: 50 },
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

/** Dokumen dari daftar biasa yang disaring status; pratinjau dari detailnya. */
function listSource(endpoint: string, numberField: string, statuses: string[], consumedField?: string) {
  return {
    search: async (query: string): Promise<SelectOption<number>[]> => {
      const res = await http.get<unknown, PaginatedResponse<RawDocument>>(endpoint, { params: { search: query || undefined, per_page: 50, page: 1 } })
      return res.data
        .filter((doc) => statuses.includes(doc.status))
        .map((doc) => ({ value: doc.id, label: String(doc[numberField] ?? `#${doc.id}`), sublabel: doc.vendor?.name ?? undefined }))
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

const vendorPartner = (required: boolean, filterBy: boolean) => ({
  label: 'Pemasok',
  cacheKey: 'contact',
  required,
  filterBy,
  search: (q: string) => kontakApi.search(q, 'supplier'),
})

const created = (data: unknown) => ({ id: Number((data as { id: number }).id), number: documentNumber(data) })

/** PO dibuat dari Permintaan Pembelian; vendor wajib karena Permintaan tidak punya vendor. */
export const purchaseOrderSources: SourceConvertOption[] = [
  {
    key: 'purchase_request',
    label: 'Dari Permintaan Pembelian',
    placeholder: 'Pilih permintaan pembelian...',
    ...pickerSource('purchase.orders', 'purchase_request'),
    partner: vendorPartner(true, false),
    convert: async (id, vendorId) => created((await purchaseOrderApi.createFromRequest(id, { vendor_id: vendorId })).data),
  },
]

export const purchaseReturnSources: SourceConvertOption[] = [
  {
    key: 'vendor_bill',
    label: 'Dari Faktur Pembelian',
    placeholder: 'Pilih faktur pembelian...',
    ...listSource('/purchase/bills', 'bill_number', ['posted', 'partially_paid']),
    convert: async (id) => created((await purchaseReturnApi.createFromBill(id)).data),
  },
  {
    key: 'goods_receipt',
    label: 'Dari Penerimaan Barang',
    placeholder: 'Pilih penerimaan barang...',
    ...listSource('/purchase/goods-receipts', 'receipt_number', ['received', 'partially_billed']),
    convert: async (id) => created((await purchaseReturnApi.createFromGoodsReceipt(id)).data),
  },
]

/** Pratinjau sisa qty yang belum ditagih dari PO/Penerimaan Barang. */
const billSource = (type: BillSourceType) => ({
  search: (query: string) => vendorBillSourceApi.search(type, query),
  preview: async (id: number): Promise<SourcePreviewLine[]> =>
    (await vendorBillSourceApi.preview(type, id)).lines.map((line) => ({ id: line.id, label: line.label, quantity: line.remaining, unitPrice: line.unitPrice })),
})

/** Faktur Pembelian dibuat dari PO atau Penerimaan Barang yang masih punya sisa untuk ditagih. */
export const vendorBillSources: SourceConvertOption[] = [
  {
    key: 'purchase_order',
    label: 'Dari Pesanan Pembelian',
    placeholder: 'Pilih pesanan pembelian...',
    ...billSource('purchase_order'),
    convert: async (id) => created((await vendorBillApi.createFromPurchaseOrder(id)).data),
  },
  {
    key: 'goods_receipt',
    label: 'Dari Penerimaan Barang',
    placeholder: 'Pilih penerimaan barang...',
    ...billSource('goods_receipt'),
    convert: async (id) => created((await vendorBillApi.createFromGoodsReceipt(id)).data),
  },
]

/** Penerimaan Barang dibuat dari PO; sisa qty, harga, dan gudang dihitung backend. */
export const goodsReceiptSources: SourceConvertOption[] = [
  {
    key: 'purchase_order',
    label: 'Dari Pesanan Pembelian',
    placeholder: 'Pilih pesanan pembelian...',
    search: (query: string) => goodsReceiptApi.searchReceivableOrders(query),
    convert: async (id) => created((await goodsReceiptApi.createFromPurchaseOrder(id)).data),
  },
]
