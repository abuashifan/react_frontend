import { useMemo, useState } from 'react'
import { useBudgetPeriods } from './useBudgetPeriods'
import { useProjectFinancials } from './useProjectFinancials'

/**
 * Ringkasan anggaran satu proyek untuk konteks di luar modul Budget (mis. tab
 * "Anggaran" di form Proyek), lengkap dengan pemilihan periode.
 *
 * `/budget/projects/{id}/summary` **mewajibkan** `budget_period_id`, sementara
 * halaman proyek tidak tahu periode mana yang dimaksud. Hook ini memilih
 * periode `open` yang mencakup hari ini sebagai default, dan membiarkan
 * pemanggil menggantinya.
 */
export function useProjectBudgetForProject(projectId: number | null, enabled = true) {
  const [overridePeriodId, setOverridePeriodId] = useState<number | null>(null)

  const { periods, isLoading: isPeriodsLoading } = useBudgetPeriods(enabled)

  const defaultPeriodId = useMemo(() => {
    if (periods.length === 0) return null
    const today = new Date().toISOString().slice(0, 10)

    // Prioritas: periode terbuka yang mencakup hari ini → periode terbuka mana pun
    // → periode terbaru. Tanpa urutan ini, proyek lama akan default ke periode
    // berjalan dan tampak tidak punya anggaran padahal punya di periode lampau.
    const current = periods.find(
      (p) => p.status === 'open' && p.period_from <= today && p.period_to >= today,
    )
    if (current) return current.id

    const open = periods.find((p) => p.status === 'open')
    if (open) return open.id

    return periods.reduce((latest, p) => (p.fiscal_year > latest.fiscal_year ? p : latest)).id
  }, [periods])

  const periodId = overridePeriodId ?? defaultPeriodId

  const summaryQuery = useProjectFinancials(
    enabled && periodId ? projectId : null,
    periodId ? { budget_period_id: periodId } : {},
  )

  return {
    periods,
    periodId,
    setPeriodId: setOverridePeriodId,
    /** Tidak ada periode anggaran sama sekali — beda dari "proyek belum dianggarkan". */
    hasNoPeriods: !isPeriodsLoading && periods.length === 0,
    summary: summaryQuery.data?.data,
    isLoading: isPeriodsLoading || summaryQuery.isLoading,
    isError: summaryQuery.isError,
  }
}
