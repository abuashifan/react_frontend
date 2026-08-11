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

  return { create, update, updatePlan, resetPassword }
}
