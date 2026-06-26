import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { StockBalance, StockBalanceListParams, StockBalancePolicy } from '../types/stockBalance.types'

interface StockBalanceApiProduct {
  id: number
  product_code?: string | null
  product_name?: string | null
  description?: string | null
}

interface StockBalanceApiWarehouse {
  id: number
  code?: string | null
  name?: string | null
}

interface StockBalanceApiItem {
  id: number
  product_id: number
  product?: StockBalanceApiProduct | null
  warehouse_id: number
  warehouse?: StockBalanceApiWarehouse | null
  quantity_on_hand?: number | string | null
  quantity_reserved?: number | string | null
  quantity_available?: number | string | null
  average_cost?: number | string | null
  total_value?: number | string | null
  last_movement_id?: number | string | null
  last_movement_at?: string | null
  updated_at?: string | null
}

interface StockBalanceReportResponse {
  rows?: unknown
  policy?: Partial<StockBalancePolicy> | null
}

function defaultPolicy(): StockBalancePolicy {
  return {
    allow_negative_stock: false,
    stock_precision: 4,
    cost_precision: 6,
    amount_precision: 2,
  }
}

function toNumber(value: unknown, fallback = 0): number {
  const next = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(next) ? next : fallback
}

function extractRows(payload: unknown): StockBalanceApiItem[] {
  if (Array.isArray(payload)) return payload as StockBalanceApiItem[]
  if (!payload || typeof payload !== 'object') return []

  const root = payload as { data?: unknown }
  if (Array.isArray(root.data)) return root.data as StockBalanceApiItem[]
  if (!root.data || typeof root.data !== 'object') return []

  const reportLike = root.data as StockBalanceReportResponse
  if (Array.isArray(reportLike.rows)) return reportLike.rows as StockBalanceApiItem[]

  const nested = root.data as { data?: unknown }
  return Array.isArray(nested.data) ? (nested.data as StockBalanceApiItem[]) : []
}

function extractPolicy(payload: unknown): StockBalancePolicy {
  if (!payload || typeof payload !== 'object') {
    return defaultPolicy()
  }

  const root = payload as { data?: unknown }
  const source = root.data && typeof root.data === 'object' ? (root.data as StockBalanceReportResponse) : (payload as StockBalanceReportResponse)
  const policy = source.policy ?? {}

  return {
    allow_negative_stock: Boolean(policy.allow_negative_stock ?? false),
    stock_precision: Number.isFinite(Number(policy.stock_precision)) ? Number(policy.stock_precision) : defaultPolicy().stock_precision,
    cost_precision: Number.isFinite(Number(policy.cost_precision)) ? Number(policy.cost_precision) : defaultPolicy().cost_precision,
    amount_precision: Number.isFinite(Number(policy.amount_precision)) ? Number(policy.amount_precision) : defaultPolicy().amount_precision,
  }
}

function normalizeStockBalance(item: StockBalanceApiItem): StockBalance {
  return {
    id: item.id,
    product_id: item.product_id,
    product: item.product
      ? {
          id: item.product.id,
          code: item.product.product_code ?? null,
          name: item.product.product_name ?? null,
          description: item.product.description ?? null,
        }
      : undefined,
    warehouse_id: item.warehouse_id,
    warehouse: item.warehouse
      ? {
          id: item.warehouse.id,
          code: item.warehouse.code ?? null,
          name: item.warehouse.name ?? null,
        }
      : undefined,
    quantity_on_hand: toNumber(item.quantity_on_hand),
    quantity_reserved: toNumber(item.quantity_reserved),
    quantity_available: toNumber(item.quantity_available),
    average_cost: toNumber(item.average_cost),
    total_value: toNumber(item.total_value),
    last_movement_id:
      item.last_movement_id === undefined || item.last_movement_id === null
        ? null
        : toNumber(item.last_movement_id),
    last_movement_at: item.last_movement_at ?? null,
    updated_at: item.updated_at ?? undefined,
  }
}

function paginate<T>(items: T[], page: number, perPage: 25 | 50 | 100): PaginatedResponse<T> {
  const safePage = Math.max(1, page || 1)
  const safePerPage = perPage || 25
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / safePerPage))
  const start = (safePage - 1) * safePerPage

  return {
    success: true,
    data: items.slice(start, start + safePerPage),
    meta: {
      current_page: Math.min(safePage, lastPage),
      last_page: lastPage,
      per_page: safePerPage,
      total,
    },
  }
}

export const stockBalanceApi = {
  list: async (params: StockBalanceListParams): Promise<PaginatedResponse<StockBalance> & { policy: StockBalancePolicy }> => {
    const response = await http.get<unknown, ApiResponse<unknown>>('/inventory/reports/stock-balances', {
      params: {
        product_id: params.product_id,
        warehouse_id: params.warehouse_id,
        include_zero: params.has_stock ? 0 : 1,
      },
    })

    const rows = extractRows(response.data).map(normalizeStockBalance)
    return {
      ...paginate(rows, params.page, params.per_page),
      policy: extractPolicy(response.data),
    }
  },

  get: async (productId: number, warehouseId: number): Promise<ApiResponse<StockBalance | null> & { policy: StockBalancePolicy }> => {
    const response = await http.get<unknown, ApiResponse<unknown>>('/inventory/reports/stock-balances', {
      params: {
        product_id: productId,
        warehouse_id: warehouseId,
      },
    })

    const found = extractRows(response.data).find(
      (item) => item.product_id === productId && item.warehouse_id === warehouseId,
    )

    return {
      success: true,
      message: 'Stock balance retrieved successfully',
      data: found ? normalizeStockBalance(found) : null,
      policy: extractPolicy(response.data),
    }
  },
}
