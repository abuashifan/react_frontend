import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coaApi } from '../services/coaApi'
import type { CoaListParams, CreateCoaPayload, UpdateCoaPayload } from '../types/coa.types'

export function useCoaList(params: CoaListParams) {
  return useQuery({
    queryKey: ['master-data-coa', params],
    queryFn: () => coaApi.list(params),
  })
}

export function useCoa(id: number | undefined) {
  return useQuery({
    queryKey: ['master-data-coa', id],
    queryFn: () => coaApi.get(id!),
    enabled: !!id,
  })
}

export function useCoaMutations() {
  const qc = useQueryClient()

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-coa'] })

  const create = useMutation({
    mutationFn: (payload: CreateCoaPayload) => coaApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCoaPayload }) =>
      coaApi.update(id, payload),
    onSuccess: invalidate,
  })

  const activate = useMutation({
    mutationFn: (id: number) => coaApi.activate(id),
    onSuccess: invalidate,
  })

  const deactivate = useMutation({
    mutationFn: (id: number) => coaApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}
