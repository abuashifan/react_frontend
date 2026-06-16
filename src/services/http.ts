import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { ApiError } from '@/types/api.types'
import { useAuthStore } from '@/stores/useAuthStore'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback
}

/**
 * FALLBACK SEMENTARA (spec-33 / GAP-08).
 *
 * Alias global ini membentuk `number` canonical dari field nomor dokumen
 * spesifik backend agar workspace list lama tetap menampilkan nomor.
 *
 * Status: documented fallback. JANGAN ditambah sebagai solusi utama.
 * Bila sebuah resource punya >1 field di daftar ini sekaligus (mis. Sales Order
 * punya `order_number` + `quotation_number`), urutan di sini bisa salah pilih —
 * resource seperti itu WAJIB override eksplisit lewat adapter di service-nya
 * (lihat `salesOrderApi.toSalesOrder`).
 */
const DOCUMENT_NUMBER_FIELDS = [
  'journal_number',
  'quotation_number',
  'order_number',
  'invoice_number',
  'delivery_number',
  'proforma_number',
  'receipt_number',
  'payment_number',
  'return_number',
  'request_number',
  'bill_number',
  'deposit_number',
  'transfer_number',
  'reconciliation_number',
  'adjustment_number',
  'movement_number',
  'opname_number',
  'batch_number',
  'asset_number',
] as const

function documentNumberFrom(record: Record<string, unknown>): string | undefined {
  for (const field of DOCUMENT_NUMBER_FIELDS) {
    const value = record[field]
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }
  return undefined
}

function normalizeDocumentNumbers(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDocumentNumbers(item))
  }

  if (!isRecord(value)) {
    return value
  }

  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalizeDocumentNumbers(item)]),
  )
  const existingNumber = normalized.number
  const needsNumberAlias =
    existingNumber === undefined ||
    existingNumber === null ||
    (typeof existingNumber === 'string' && existingNumber.trim() === '')
  const documentNumber = documentNumberFrom(normalized)

  if (!needsNumberAlias || !documentNumber) {
    return normalized
  }

  return {
    ...normalized,
    number: documentNumber,
  }
}

function normalizeApiResponse<T>(payload: T): T {
  const payloadWithAliases = normalizeDocumentNumbers(payload)

  if (!isRecord(payloadWithAliases) || !isRecord(payloadWithAliases.data)) {
    return payloadWithAliases as T
  }

  const pageData = payloadWithAliases.data
  const rows = pageData.data
  if (!Array.isArray(rows)) {
    return payloadWithAliases as T
  }

  const currentPage = asNumber(pageData.current_page, 1)
  const perPage = asNumber(pageData.per_page, rows.length)
  const total = asNumber(pageData.total, rows.length)
  const lastPage = asNumber(pageData.last_page, Math.max(1, Math.ceil(total / Math.max(perPage, 1))))

  return {
    ...payloadWithAliases,
    data: rows,
    meta: {
      current_page: currentPage,
      last_page: lastPage,
      per_page: perPage,
      total,
    },
  } as T
}

export const http: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const { token, activeCompanyId } = useAuthStore.getState()

  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (activeCompanyId) config.headers['X-Company-ID'] = String(activeCompanyId)

  return config
})

http.interceptors.response.use(
  (response) => normalizeApiResponse(response.data),
  (error) => {
    const status = error.response?.status
    const headers = error.response?.headers
    const responseError = {
      ...(error.response?.data ?? {}),
      success: false,
      code: error.response?.data?.code ?? (status ? `HTTP_${status}` : 'UNKNOWN_ERROR'),
      message: error.response?.data?.message ?? error.message ?? 'Terjadi kesalahan.',
      status,
    } as ApiError

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(responseError)
    }

    // Maintenance mode — redirect globally (affects all users)
    if (status === 503 || headers?.['x-maintenance-mode'] === 'true') {
      window.location.href = '/maintenance'
      return Promise.reject(responseError)
    }

    // Network error — no response from server
    if (!error.response) {
      return Promise.reject({
        success: false,
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat terhubung ke server.',
      } as ApiError)
    }

    return Promise.reject(responseError)
  },
)
