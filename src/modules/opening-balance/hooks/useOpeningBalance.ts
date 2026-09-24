import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openingBalanceApi } from '../services/openingBalanceApi'
import type { OBClosePayload } from '../types/openingBalance.types'

const OB_KEY = ['opening-balance']

export function useOBStatus() {
  return useQuery({ queryKey: [...OB_KEY, 'status'], queryFn: openingBalanceApi.status, staleTime: 0 })
}

export function useOBMutations() {
  const qc = useQueryClient()
  // Impor menulis jurnal pembuka, jadi papan pemantau harus ikut disegarkan
  // setiap kali salah satunya berubah — dan sebaliknya.
  const inv = () => {
    void qc.invalidateQueries({ queryKey: OB_KEY })
    void qc.invalidateQueries({ queryKey: ['imports'] })
  }

  return {
    setOpeningDate: useMutation({
      mutationFn: (openingDate: string) => openingBalanceApi.setOpeningDate(openingDate),
      onSuccess: inv,
    }),
    closeClearing: useMutation({
      mutationFn: (payload: OBClosePayload = {}) => openingBalanceApi.closeClearing(payload),
      onSuccess: inv,
    }),
    voidJournal: useMutation({
      mutationFn: ({ journalId, reason }: { journalId: number; reason: string }) =>
        openingBalanceApi.voidJournal(journalId, reason),
      onSuccess: inv,
    }),
  }
}
