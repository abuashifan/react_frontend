import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/modules/auth/services/authApi'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Spanduk peringatan H-14/tenggang (Fase 3, skema tier §4f). `null` (dari
 * backend maupun karena belum login) berarti tidak ada apa pun untuk
 * ditampilkan — staf yang bukan pemilik langganan selalu dapat `null` di
 * sini, sama seperti penguncian login hanya berlaku ke pemilik langganan.
 *
 * Poll santai (bukan realtime): peringatan kedaluwarsa tidak berubah dalam
 * hitungan menit, jadi tidak ada alasan menembak `/auth/me` sesering query
 * data bisnis.
 */
export function useSubscriptionStatus() {
  const token = useAuthStore((s) => s.token)

  const { data } = useQuery({
    queryKey: ['auth', 'subscription-status'],
    queryFn: () => authApi.me(),
    enabled: !!token,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  })

  return data?.data.subscription ?? null
}
