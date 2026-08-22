import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTabStore } from '@/stores/useTabStore'

export interface RecordTabInput {
  /** Judul tab — untuk dokumen tersimpan pakai nomornya, mis. "FJ-0012". */
  label: string
  /** Rute halaman record; sekaligus dipakai sebagai id tab. */
  path: string
}

export interface RecordTabApi {
  /** Buka record sebagai tab sekunder di tab primer aktif. */
  openRecordTab: (record: RecordTabInput) => void
  /** Ubah tab `fromPath` menjadi tab `record` di tempat — mis. setelah dokumen baru tersimpan. */
  replaceRecordTab: (fromPath: string, record: RecordTabInput) => void
  /**
   * Tutup tab record di `path` — mis. tombol Batal. Menutup tab otomatis
   * mengaktifkan tab sebelumnya (biasanya Daftar), jadi tidak perlu navigasi
   * manual yang justru membuat URL menyimpang dari tab aktif.
   */
  closeRecordTab: (path: string, fallbackPath: string) => void
}

function toSecondaryTab({ label, path }: RecordTabInput) {
  // Path dipakai sebagai id supaya tiap record punya tab sendiri tanpa perlu
  // konvensi penamaan per modul, dan id-nya konsisten dengan rute yang dibuka.
  return { id: path, label, type: 'form' as const, path, pinned: false }
}

/**
 * Membuka halaman record sebagai tab sekunder, bukan menimpa daftar di tempat.
 *
 * Navigasi tidak dipanggil langsung: store adalah sumber kebenaran, dan AppShell
 * yang menavigasi mengikuti tab aktif. `navigate` di sini hanya jaring pengaman
 * untuk konteks tanpa tab primer (mis. Dashboard).
 */
export function useRecordTab(): RecordTabApi {
  const navigate = useNavigate()

  const openRecordTab = useCallback(
    (record: RecordTabInput) => {
      const { activePrimaryTabId, openSecondaryTab } = useTabStore.getState()
      if (!activePrimaryTabId || activePrimaryTabId === 'dashboard') {
        navigate(record.path)
        return
      }
      openSecondaryTab(activePrimaryTabId, toSecondaryTab(record))
    },
    [navigate],
  )

  const replaceRecordTab = useCallback(
    (fromPath: string, record: RecordTabInput) => {
      const { activePrimaryTabId, replaceSecondaryTab } = useTabStore.getState()
      const replaced =
        !!activePrimaryTabId && replaceSecondaryTab(activePrimaryTabId, fromPath, toSecondaryTab(record))
      if (!replaced) navigate(record.path)
    },
    [navigate],
  )

  const closeRecordTab = useCallback(
    (path: string, fallbackPath: string) => {
      const { activePrimaryTabId, secondaryTabs, closeSecondaryTab } = useTabStore.getState()
      const isOpen =
        !!activePrimaryTabId && (secondaryTabs[activePrimaryTabId] ?? []).some((tab) => tab.id === path)
      if (!isOpen || !activePrimaryTabId) {
        navigate(fallbackPath)
        return
      }
      closeSecondaryTab(activePrimaryTabId, path)
    },
    [navigate],
  )

  return { openRecordTab, replaceRecordTab, closeRecordTab }
}
