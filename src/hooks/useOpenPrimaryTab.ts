import { useCallback } from 'react'
import { useTabStore, type PrimaryTab } from '@/stores/useTabStore'
import { useToast } from '@/hooks/useToast'

/**
 * Buka tab primer sekaligus menangani batas MAX_PRIMARY_TABS.
 *
 * Dipakai bersama oleh `RibbonPanel` (modul ber-ribbon) dan `Topbar` (modul yang
 * membuka halaman daftar langsung), supaya pesan batas tab tidak terduplikasi.
 */
export function useOpenPrimaryTab(): (tab: PrimaryTab) => boolean {
  const openPrimaryTab = useTabStore((state) => state.openPrimaryTab)
  const { toast } = useToast()

  return useCallback(
    (tab: PrimaryTab) => {
      const didOpen = openPrimaryTab(tab)
      if (!didOpen) {
        toast.warning('Maksimal 10 tab dapat dibuka sekaligus. Tutup tab yang tidak diperlukan.')
      }
      return didOpen
    },
    [openPrimaryTab, toast],
  )
}
