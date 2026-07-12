import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { ReportParams } from '../types/reports.types'

const NUMERIC_KEYS = ['account_id', 'department_id', 'project_id', 'warehouse_id', 'customer_id', 'vendor_id', 'product_id', 'category_id', 'page', 'per_page'] as const
const BOOL_KEYS = ['include_zero_balance', 'include_zero', 'only_difference'] as const
const STRING_KEYS = ['start_date', 'end_date', 'as_of_date', 'group_by', 'mode', 'source'] as const

/**
 * Baca ReportParams dari query string URL saat halaman dibuka dari Laporan
 * Tersimpan (Fase 13 T13.4). `restored` = true bila ada minimal satu param
 * tersimpan di URL, sehingga halaman bisa langsung menjalankan laporan.
 */
export function useInitialReportParams(defaults: ReportParams): { initialParams: ReportParams; restored: boolean } {
  const { search } = useLocation()

  return useMemo(() => {
    const usp = new URLSearchParams(search)
    if ([...usp.keys()].length === 0) {
      return { initialParams: defaults, restored: false }
    }

    const parsed: ReportParams = { ...defaults }
    let restored = false

    for (const key of STRING_KEYS) {
      const v = usp.get(key)
      if (v !== null) { (parsed as Record<string, unknown>)[key] = v; restored = true }
    }
    for (const key of NUMERIC_KEYS) {
      const v = usp.get(key)
      if (v !== null && v !== '' && Number.isFinite(Number(v))) { (parsed as Record<string, unknown>)[key] = Number(v); restored = true }
    }
    for (const key of BOOL_KEYS) {
      const v = usp.get(key)
      if (v !== null) { (parsed as Record<string, unknown>)[key] = v === 'true' || v === '1'; restored = true }
    }

    return { initialParams: parsed, restored }
    // Baca sekali saat mount; perubahan search berikutnya ditangani navigasi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
