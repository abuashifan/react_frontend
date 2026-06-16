# 12 — API Integration

## Aturan Utama

1. **Semua API call** ada di `src/modules/{module}/services/{resource}Api.ts`
2. **DILARANG** fetch di komponen atau store langsung
3. **WAJIB** cek `frontend-api-contract.md` sebelum buat API call baru
4. **WAJIB** semua parameter dan return value typed
5. **TanStack Query** untuk semua operasi yang melibatkan server state

---

## Axios Instance

```typescript
// src/services/http.ts
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'

export const http: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor — auto-inject auth headers
http.interceptors.request.use((config) => {
  const { token, activeCompanyId } = useAuthStore.getState()

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  if (activeCompanyId) {
    config.headers['X-Company-ID'] = String(activeCompanyId)
  }

  return config
})

// Response interceptor — unwrap envelope + handle auth errors
http.interceptors.response.use(
  (response) => response.data,  // Unwrap: return langsung .data dari ApiResponse
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    // Reject dengan error object yang sudah diformat
    return Promise.reject(error.response?.data as ApiError)
  }
)
```

---

## TypeScript Types

```typescript
// src/types/api.types.ts

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ApiError {
  success: false
  code: string
  message: string
  errors?: Record<string, string[]>   // Validation errors (422)
  meta?: Record<string, unknown>
}

// HTTP Status codes yang mungkin:
// 200 — Success
// 201 — Created
// 422 — Validation error
// 401 — Unauthenticated
// 403 — Forbidden
// 404 — Not found
// 409 — Conflict (status tidak valid untuk aksi)
```

---

## API Service Pattern

```typescript
// src/modules/sales/services/salesInvoiceApi.ts
import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  SalesInvoice,
  SalesInvoiceListParams,
  CreateSalesInvoicePayload,
} from '../types/salesInvoice.types'

export const salesInvoiceApi = {
  // List dengan filter & pagination
  list(params: SalesInvoiceListParams): Promise<PaginatedResponse<SalesInvoice>> {
    return http.get('/sales/invoices', { params })
  },

  // Detail
  get(id: number): Promise<ApiResponse<SalesInvoice>> {
    return http.get(`/sales/invoices/${id}`)
  },

  // Create
  create(payload: CreateSalesInvoicePayload): Promise<ApiResponse<SalesInvoice>> {
    return http.post('/sales/invoices', payload)
  },

  // Create from source document
  createFromSalesOrder(salesOrderId: number, payload?: Partial<CreateSalesInvoicePayload>): Promise<ApiResponse<SalesInvoice>> {
    return http.post(`/sales/invoices/from-sales-order/${salesOrderId}`, payload)
  },

  createFromDeliveryOrder(deliveryOrderId: number): Promise<ApiResponse<SalesInvoice>> {
    return http.post(`/sales/invoices/from-delivery-order/${deliveryOrderId}`)
  },

  // Workflow actions
  approve(id: number): Promise<ApiResponse<SalesInvoice>> {
    return http.patch(`/sales/invoices/${id}/approve`)
  },

  post(id: number): Promise<ApiResponse<SalesInvoice>> {
    return http.patch(`/sales/invoices/${id}/post`)
  },

  void(id: number, payload: { reason: string }): Promise<ApiResponse<SalesInvoice>> {
    return http.patch(`/sales/invoices/${id}/void`, payload)
  },
}
```

---

## TanStack Query Pattern

### Query (Fetch Data)

```typescript
// src/modules/sales/hooks/useSalesInvoiceList.ts
import { useQuery } from '@tanstack/react-query'
import { salesInvoiceApi } from '../services/salesInvoiceApi'
import type { SalesInvoiceListParams } from '../types/salesInvoice.types'

export function useSalesInvoiceList(params: SalesInvoiceListParams) {
  return useQuery({
    queryKey: ['sales-invoices', params],
    queryFn: () => salesInvoiceApi.list(params),
    staleTime: 30_000,        // 30 detik sebelum refetch
    placeholderData: keepPreviousData,  // Tidak flicker saat ganti page
  })
}

export function useSalesInvoice(id: number) {
  return useQuery({
    queryKey: ['sales-invoices', id],
    queryFn: () => salesInvoiceApi.get(id),
    enabled: !!id,
  })
}
```

### Mutation (Create / Update / Actions)

```typescript
// src/modules/sales/hooks/useSalesInvoiceMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { salesInvoiceApi } from '../services/salesInvoiceApi'
import { useToast } from '@/hooks/useToast'

export function usePostSalesInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: number) => salesInvoiceApi.post(id),

    onSuccess: (response, id) => {
      // Invalidate list dan detail
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      toast.success('Invoice berhasil diposting.')
    },

    onError: (error: ApiError) => {
      if (error.errors) {
        const messages = Object.values(error.errors).flat().join('. ')
        toast.error(`Gagal posting. ${messages}`)
      } else if (error.code === 'CONFLICT') {
        toast.error('Invoice tidak dapat diposting dari status saat ini.')
      } else {
        toast.error(error.message || 'Terjadi kesalahan. Coba lagi.')
      }
    },
  })
}

export function useVoidSalesInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      salesInvoiceApi.void(id, { reason }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      toast.success('Invoice berhasil di-void.')
    },

    onError: (error: ApiError) => {
      toast.error(error.message || 'Gagal void invoice.')
    },
  })
}
```

---

## Query Key Conventions

```typescript
// Konsisten di seluruh project
['sales-invoices']                    // List
['sales-invoices', params]            // List dengan filter
['sales-invoices', id]                // Single item
['sales-orders']
['sales-orders', id]
['purchase-bills']
['purchase-bills', id]
['inventory-stock-balances']
['master-data-contacts']
['master-data-products']
// dst.
```

---

## Searchable Select API Pattern

Untuk SearchableSelect yang fetch dari API:

```typescript
// Debounced search untuk customer picker
export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: ['contacts-search', query],
    queryFn: () => http.get('/master-data/contacts', {
      params: { search: query, is_customer: 1, limit: 10 }
    }),
    enabled: query.length >= 2,   // Minimum 2 karakter
    staleTime: 60_000,            // Cache 1 menit untuk search results
  })
}
```

---

## Error Handling Reference

| HTTP Status | Handling |
|---|---|
| `200/201` | Unwrap dan return `data` field |
| `422` | Toast error dengan list validation errors |
| `401` | Auto logout + redirect ke login |
| `403` | Toast "Anda tidak memiliki akses untuk aksi ini." |
| `404` | Toast "Data tidak ditemukan." + navigate back |
| `409` | Toast dengan `error.message` dari backend |
| Network error | Toast "Tidak dapat terhubung ke server. Periksa koneksi Anda." |

```typescript
// Error handler utility
export function handleApiError(error: ApiError, toast: ToastFn): void {
  switch (true) {
    case !!error.errors:
      // 422 Validation errors
      const messages = Object.values(error.errors!).flat().join('. ')
      toast.error(`Gagal menyimpan: ${messages}`)
      break

    case error.code === 'CONFLICT':
      // 409 Status conflict
      toast.error(error.message)
      break

    case error.code === 'FORBIDDEN':
      // 403
      toast.error('Anda tidak memiliki akses untuk aksi ini.')
      break

    case error.code === 'NOT_FOUND':
      // 404
      toast.error('Data tidak ditemukan.')
      break

    default:
      toast.error(error.message || 'Terjadi kesalahan. Coba lagi.')
  }
}
```

---

## Pagination Query Params

```typescript
// Selalu kirim pagination params
interface ListParams {
  page: number          // 1-based
  per_page: 25 | 50 | 100
  search?: string
  // filter-specific params
}

// Contoh untuk sales invoice
interface SalesInvoiceListParams extends ListParams {
  status?: string
  customer_id?: number
  date_from?: string    // YYYY-MM-DD
  date_to?: string      // YYYY-MM-DD
  payment_status?: 'paid' | 'unpaid' | 'partial_paid' | 'nihil'
}
```

---

## QueryClient Config (Global)

```typescript
// src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30 detik
      gcTime: 5 * 60 * 1000,     // 5 menit
      retry: 1,                   // Retry 1x saat error
      refetchOnWindowFocus: false, // Tidak refetch saat tab aktif kembali
    },
    mutations: {
      retry: 0,                   // Jangan retry mutation
    },
  },
})
```
