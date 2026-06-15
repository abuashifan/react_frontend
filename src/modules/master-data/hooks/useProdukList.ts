import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { produkApi } from '../services/produkApi'
import type { ProdukListParams, CreateProdukPayload, UpdateProdukPayload } from '../types/produk.types'

export function useProdukList(params: ProdukListParams) {
  return useQuery({
    queryKey: ['master-data-produk', params],
    queryFn: () => produkApi.list(params),
  })
}

export function useProduk(id: number | undefined) {
  return useQuery({
    queryKey: ['master-data-produk', id],
    queryFn: () => produkApi.get(id!),
    enabled: !!id,
  })
}

export function useProdukMutations() {
  const qc = useQueryClient()

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-produk'] })

  const create = useMutation({
    mutationFn: (payload: CreateProdukPayload) => produkApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProdukPayload }) =>
      produkApi.update(id, payload),
    onSuccess: invalidate,
  })

  const activate = useMutation({
    mutationFn: (id: number) => produkApi.activate(id),
    onSuccess: invalidate,
  })

  const deactivate = useMutation({
    mutationFn: (id: number) => produkApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}
