import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openingBalanceApi } from '../services/openingBalanceApi'
import type { CreateOBBatchPayload, OBLinePayload } from '../types/openingBalance.types'

const OB_KEY = ['opening-balance']

export function useOBStatus() {
  return useQuery({ queryKey: [...OB_KEY, 'status'], queryFn: openingBalanceApi.status, staleTime: 0 })
}

export function useOBBatch(batchId?: number) {
  return useQuery({
    queryKey: [...OB_KEY, 'batch', batchId],
    queryFn: () => openingBalanceApi.get(batchId!),
    enabled: !!batchId,
  })
}

export function useOBMutations() {
  const qc = useQueryClient()
  const inv = (batchId?: number) => {
    void qc.invalidateQueries({ queryKey: OB_KEY })
    if (batchId) void qc.invalidateQueries({ queryKey: [...OB_KEY, 'batch', batchId] })
  }
  return {
    createBatch: useMutation({ mutationFn: (p: CreateOBBatchPayload) => openingBalanceApi.store(p), onSuccess: () => inv() }),
    replaceLines: useMutation({ mutationFn: ({ batchId, lines }: { batchId: number; lines: OBLinePayload[] }) => openingBalanceApi.replaceLines(batchId, lines), onSuccess: (_, { batchId }) => inv(batchId) }),
    validate: useMutation({ mutationFn: (batchId: number) => openingBalanceApi.validate(batchId), onSuccess: (_, batchId) => inv(batchId) }),
    post: useMutation({ mutationFn: (batchId: number) => openingBalanceApi.post(batchId), onSuccess: (_, batchId) => inv(batchId) }),
    lock: useMutation({ mutationFn: (batchId: number) => openingBalanceApi.lock(batchId), onSuccess: (_, batchId) => inv(batchId) }),
    reopen: useMutation({ mutationFn: ({ batchId, reason }: { batchId: number; reason: string }) => openingBalanceApi.reopen(batchId, reason), onSuccess: (_, { batchId }) => inv(batchId) }),
  }
}
