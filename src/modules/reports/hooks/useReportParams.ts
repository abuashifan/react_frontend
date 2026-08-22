import { useCallback, useState } from 'react'
import { useTabFormState } from '@/hooks/useTabFormState'
import { useInitialReportParams } from './useInitialReportParams'
import type { ReportParams } from '../types/reports.types'

interface ReportTabState extends Record<string, unknown> {
  params: ReportParams
  activeParams: ReportParams | null
}

interface UseReportParamsOptions {
  /** Jalankan laporan langsung saat halaman dibuka tanpa menunggu user submit modal. */
  autoRun?: boolean
}

interface UseReportParamsResult {
  params: ReportParams
  setParams: React.Dispatch<React.SetStateAction<ReportParams>>
  activeParams: ReportParams | null
  setActiveParams: React.Dispatch<React.SetStateAction<ReportParams | null>>
  showFilter: boolean
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * State parameter laporan yang bertahan saat user pindah tab.
 *
 * Halaman laporan dirender lewat router outlet, jadi berpindah tab meng-unmount
 * halaman dan menghapus semua `useState` lokalnya — dulu ini membuat parameter
 * (mis. tanggal akhir periode) kembali ke default dan modal parameter terbuka
 * lagi tiap kali user kembali ke tab laporan.
 *
 * Penyimpanannya ditangani `useTabFormState`: params dititipkan ke tab laporan
 * pemiliknya, sehingga ikut terhapus begitu tab tersebut ditutup.
 */
export function useReportParams(
  defaults: ReportParams,
  options: UseReportParamsOptions = {},
): UseReportParamsResult {
  const { autoRun = false } = options
  const { initialParams, restored } = useInitialReportParams(defaults)

  const [initialTabState] = useState<ReportTabState>(() => ({
    params: initialParams,
    activeParams: restored || autoRun ? initialParams : null,
  }))

  const [tabState, patchTabState] = useTabFormState<ReportTabState>(initialTabState)

  // Modal parameter terbuka selama laporan belum pernah dijalankan di tab ini.
  const [showFilter, setShowFilter] = useState(!tabState.activeParams)

  const setParams = useCallback<React.Dispatch<React.SetStateAction<ReportParams>>>(
    (action) => {
      patchTabState((prev) => ({
        params: typeof action === 'function' ? action(prev.params) : action,
      }))
    },
    [patchTabState],
  )

  const setActiveParams = useCallback<React.Dispatch<React.SetStateAction<ReportParams | null>>>(
    (action) => {
      patchTabState((prev) => ({
        activeParams: typeof action === 'function' ? action(prev.activeParams) : action,
      }))
    },
    [patchTabState],
  )

  return {
    params: tabState.params,
    setParams,
    activeParams: tabState.activeParams,
    setActiveParams,
    showFilter,
    setShowFilter,
  }
}
