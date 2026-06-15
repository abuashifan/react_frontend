import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kontakApi } from '../services/kontakApi'
import type { KontakListParams, CreateKontakPayload, UpdateKontakPayload } from '../types/kontak.types'

export function useKontakList(params: KontakListParams) {
  return useQuery({
    queryKey: ['master-data-kontak', params],
    queryFn: () => kontakApi.list(params),
  })
}

export function useKontak(id: number | undefined) {
  return useQuery({
    queryKey: ['master-data-kontak', id],
    queryFn: () => kontakApi.get(id!),
    enabled: !!id,
  })
}

export function useKontakMutations() {
  const qc = useQueryClient()

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-kontak'] })

  const create = useMutation({
    mutationFn: (payload: CreateKontakPayload) => kontakApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateKontakPayload }) =>
      kontakApi.update(id, payload),
    onSuccess: invalidate,
  })

  const activate = useMutation({
    mutationFn: (id: number) => kontakApi.activate(id),
    onSuccess: invalidate,
  })

  const deactivate = useMutation({
    mutationFn: (id: number) => kontakApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}
