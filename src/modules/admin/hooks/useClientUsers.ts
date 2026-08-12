import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../services/adminApi'
import type {
  ClientUserListParams,
  CreateClientPayload,
  UpdateClientPayload,
} from '@/types/admin.types'

export const CLIENT_USERS_KEY = ['admin', 'clients']
export const ADMIN_PLANS_KEY = ['admin', 'plans']

export function useClientUsers(params: ClientUserListParams) {
  return useQuery({
    queryKey: [...CLIENT_USERS_KEY, params],
    queryFn: () => adminApi.clients(params),
  })
}

export function useClientUser(id: number | null) {
  return useQuery({
    queryKey: [...CLIENT_USERS_KEY, 'detail', id],
    queryFn: () => adminApi.client(id as number),
    enabled: id !== null,
  })
}

export function useAdminPlans() {
  return useQuery({
    queryKey: ADMIN_PLANS_KEY,
    queryFn: () => adminApi.plans(),
    // Paket nyaris tidak pernah berubah selama satu sesi admin.
    staleTime: 30 * 60 * 1000,
  })
}

/** Client yang akan jatuh tempo ≤14 hari atau sedang tenggang (Fase 3, §4d). */
export function useDueSoonClients() {
  return useQuery({
    queryKey: ['admin', 'clients', 'due-soon'],
    queryFn: () => adminApi.dueSoonClients(),
  })
}

/** Pemakaian penyimpanan tiap perusahaan milik client (Fase 4). */
export function useClientStorage(id: number | null) {
  return useQuery({
    queryKey: [...CLIENT_USERS_KEY, 'detail', id, 'storage'],
    queryFn: () => adminApi.clientStorage(id as number),
    enabled: id !== null,
  })
}

export function useClientUserMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: CLIENT_USERS_KEY })

  const create = useMutation({
    mutationFn: (payload: CreateClientPayload) => adminApi.createClient(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateClientPayload }) =>
      adminApi.updateClient(id, payload),
    onSuccess: invalidate,
  })

  const updatePlan = useMutation({
    mutationFn: ({ id, planId }: { id: number; planId: number | null }) =>
      adminApi.updateClientPlan(id, planId),
    onSuccess: invalidate,
  })

  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      adminApi.resetClientPassword(id, password),
  })

  const subscribe = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { plan_id: number; billing_cycle: 'monthly' | 'yearly' } }) =>
      adminApi.subscribeClient(id, payload),
    onSuccess: invalidate,
  })

  const renew = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: { plan_id?: number | null; billing_cycle?: 'monthly' | 'yearly' | null } }) =>
      adminApi.renewClient(id, payload),
    onSuccess: invalidate,
  })

  const unlock = useMutation({
    mutationFn: (id: number) => adminApi.unlockClient(id),
    onSuccess: invalidate,
  })

  return { create, update, updatePlan, resetPassword, subscribe, renew, unlock }
}
