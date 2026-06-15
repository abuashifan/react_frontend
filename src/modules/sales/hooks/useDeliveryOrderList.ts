import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryOrderApi } from '../services/deliveryOrderApi'
import type { DeliveryOrderListParams, CreateDeliveryOrderPayload, UpdateDeliveryOrderPayload } from '../types/deliveryOrder.types'

const QK = {
  list: (p: DeliveryOrderListParams) => ['sales', 'delivery-orders', p] as const,
  detail: (id: number) => ['sales', 'delivery-orders', id] as const,
}

export function useDeliveryOrderList(params: DeliveryOrderListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => deliveryOrderApi.list(params) })
}

export function useDeliveryOrder(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => deliveryOrderApi.get(id!),
    enabled: !!id,
  })
}

export function useDeliveryOrderMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sales', 'delivery-orders'] })

  return {
    create: useMutation({ mutationFn: (p: CreateDeliveryOrderPayload) => deliveryOrderApi.create(p), onSuccess: invalidate }),
    createFromSalesOrder: useMutation({ mutationFn: (soId: number) => deliveryOrderApi.createFromSalesOrder(soId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateDeliveryOrderPayload }) => deliveryOrderApi.update(id, payload), onSuccess: invalidate }),
    ready: useMutation({ mutationFn: (id: number) => deliveryOrderApi.ready(id), onSuccess: invalidate }),
    ship: useMutation({ mutationFn: (id: number) => deliveryOrderApi.ship(id), onSuccess: invalidate }),
    deliver: useMutation({ mutationFn: (id: number) => deliveryOrderApi.deliver(id), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: number) => deliveryOrderApi.cancel(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => deliveryOrderApi.void(id, reason), onSuccess: invalidate }),
  }
}
