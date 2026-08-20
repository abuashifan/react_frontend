import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../services/adminApi'

export const DELETED_COMPANIES_KEY = ['admin', 'companies', 'deleted']

export function useDeletedCompanies() {
  return useQuery({
    queryKey: DELETED_COMPANIES_KEY,
    queryFn: () => adminApi.deletedCompanies(),
  })
}

/**
 * Memulihkan dan menghapus permanen sama-sama mengubah kuota client, jadi
 * daftar client ikut disegarkan — bukan hanya daftar perusahaan terhapus.
 */
function useInvalidateAfterChange() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: DELETED_COMPANIES_KEY })
    queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] })
  }
}

export function useRestoreCompany() {
  const invalidate = useInvalidateAfterChange()

  return useMutation({
    mutationFn: (id: number) => adminApi.restoreCompany(id),
    onSuccess: invalidate,
  })
}

export function usePurgeCompany() {
  const invalidate = useInvalidateAfterChange()

  return useMutation({
    mutationFn: ({ id, confirmName }: { id: number; confirmName: string }) =>
      adminApi.purgeCompany(id, confirmName),
    onSuccess: invalidate,
  })
}
