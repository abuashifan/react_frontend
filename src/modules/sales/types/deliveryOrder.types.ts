export type DeliveryOrderStatus = 'draft' | 'ready' | 'shipped' | 'delivered' | 'void' | 'cancelled'

export interface DeliveryOrderLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  invoiced_quantity: number
  returned_quantity: number
  warehouse_id?: number | null
  warehouse?: { id: number; name: string } | null
}

export interface DeliveryOrder {
  id: number
  number: string
  date: string
  customer_id: number
  customer?: { id: number; code: string; name: string }
  sales_order_id?: number | null
  sales_order_number?: string | null
  warehouse_id?: number | null
  warehouse?: { id: number; name: string } | null
  status: DeliveryOrderStatus
  notes?: string | null
  delivery_address?: string | null
  lines: DeliveryOrderLine[]
  created_at: string
  updated_at: string
}

export interface DeliveryOrderListParams {
  page: number
  per_page: number
  search?: string
  status?: DeliveryOrderStatus
  customer_id?: number
  warehouse_id?: number
  date_from?: string
  date_to?: string
}

export interface DeliveryOrderLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  warehouse_id?: number | null
}

export interface CreateDeliveryOrderPayload {
  customer_id: number
  date: string
  sales_order_id?: number | null
  warehouse_id?: number | null
  delivery_address?: string | null
  notes?: string | null
  lines: DeliveryOrderLinePayload[]
}

export type UpdateDeliveryOrderPayload = Partial<CreateDeliveryOrderPayload>
