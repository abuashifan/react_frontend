import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { importsApi } from '../services/importsApi'

export function useImportProfiles() {
  return useQuery({
    queryKey: ['imports', 'profiles'],
    queryFn: () => importsApi.profiles(),
    staleTime: 30 * 60_000,
  })
}

export function useImportBatch(uuid: string | null) {
  return useQuery({
    queryKey: ['imports', 'batch', uuid],
    queryFn: () => importsApi.show(uuid as string),
    enabled: uuid !== null,
    // Polling tiap 3 detik saat status committing (async profile) — supaya
    // UI otomatis berubah ke completed/failed begitu job selesai, tanpa
    // user harus refresh manual.
    refetchInterval: (query) => {
      const batch = query.state.data?.data
      return batch?.status === 'committing' ? 3_000 : false
    },
  })
}

export function useImportRows(uuid: string | null, page: number) {
  return useQuery({
    queryKey: ['imports', 'batch', uuid, 'rows', page],
    queryFn: () => importsApi.rows(uuid as string, page),
    enabled: uuid !== null,
  })
}

export function useImportMutations() {
  const queryClient = useQueryClient()
  const invalidateBatch = (uuid?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['imports', 'batch', uuid] })
  }

  return {
    upload: useMutation({
      mutationFn: ({ profile, file, confirmDuplicateFile }: { profile: string; file: File; confirmDuplicateFile?: boolean }) =>
        importsApi.upload(profile, file, confirmDuplicateFile),
    }),
    mapping: useMutation({
      mutationFn: ({ uuid, columnMap }: { uuid: string; columnMap: Record<string, string> }) =>
        importsApi.mapping(uuid, columnMap),
      onSuccess: (_, { uuid }) => invalidateBatch(uuid),
    }),
    commit: useMutation({
      mutationFn: (uuid: string) => importsApi.commit(uuid),
      onSuccess: (_, uuid) => invalidateBatch(uuid),
    }),
    cancel: useMutation({
      mutationFn: (uuid: string) => importsApi.cancel(uuid),
    }),
  }
}
