import { useQuery } from '@tanstack/react-query'
import { budgetApi } from '../services/budgetApi'

/** Satu query key untuk seluruh modul — dipakai juga saat invalidasi setelah membuat/menutup pagu. */
export const BUDGET_PERIODS_QUERY_KEY = ['budget', 'periods'] as const

/**
 * Daftar pagu/periode anggaran perusahaan.
 *
 * Sebelumnya enam halaman memanggil `budgetApi.listPeriods` sendiri-sendiri
 * dengan query key yang sama persis. Itu bukan hanya duplikasi kode: setiap
 * halaman juga bebas menuliskan key-nya sendiri, sehingga satu typo saja
 * membuat cache-nya terpisah dan daftar periode berhenti ikut ter-invalidasi
 * setelah pagu baru dibuat. Dikumpulkan di sini supaya key-nya tunggal.
 */
export function useBudgetPeriods(enabled = true) {
  const { data, isLoading, isError } = useQuery({
    queryKey: BUDGET_PERIODS_QUERY_KEY,
    queryFn: budgetApi.listPeriods,
    enabled,
  })

  return { periods: data?.data ?? [], isLoading, isError }
}
