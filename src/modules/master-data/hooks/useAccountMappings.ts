import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountMappingApi } from '../services/accountMappingApi'
import type { UpdateAccountMappingPayload } from '../types/accountMapping.types'

export function useAccountMappings() {
  return useQuery({
    queryKey: ['master-data-account-mappings'],
    queryFn: () => accountMappingApi.list(),
  })
}

export function useAccountMappingMutations() {
  const qc = useQueryClient()

  const update = useMutation({
    mutationFn: ({ key, payload }: { key: string; payload: UpdateAccountMappingPayload }) =>
      accountMappingApi.update(key, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data-account-mappings'] }),
  })

  return { update }
}
