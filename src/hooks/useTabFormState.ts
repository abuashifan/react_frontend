import { useCallback, useEffect, useState } from 'react'
import { useTabStore } from '@/stores/useTabStore'

interface TabIdentity {
  primaryTabId: string
  secondaryTabId: string
}

/** Patch sebagian state, langsung atau lewat updater yang menerima state sebelumnya. */
export type TabStatePatch<T> = Partial<T> | ((prev: T) => Partial<T>)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Tab pemilik halaman, dibaca dari store di luar siklus render React.
 * Ditangkap sekali saat mount — lihat catatan di `useTabFormState`.
 */
function readTabIdentity(): TabIdentity | null {
  const { activePrimaryTabId, activeSecondaryTabId } = useTabStore.getState()
  if (!activePrimaryTabId) return null
  const secondaryTabId = activeSecondaryTabId[activePrimaryTabId]
  if (!secondaryTabId) return null
  return { primaryTabId: activePrimaryTabId, secondaryTabId }
}

function readFormState(tab: TabIdentity | null): Record<string, unknown> | null {
  if (!tab) return null
  const formState = (useTabStore.getState().secondaryTabs[tab.primaryTabId] ?? []).find(
    (secondaryTab) => secondaryTab.id === tab.secondaryTabId,
  )?.formState
  return isRecord(formState) ? formState : null
}

/**
 * State halaman yang bertahan saat user berpindah tab.
 *
 * Halaman dirender lewat router outlet, jadi berpindah tab meng-unmount halaman
 * dan menghapus semua `useState` lokalnya. State dititipkan ke slot `formState`
 * milik tab sekunder pemiliknya di `useTabStore` (sessionStorage), sehingga ikut
 * terhapus begitu tab tersebut ditutup.
 *
 * Hanya key yang ada di `defaults` yang dipulihkan — sisa formState dari versi
 * lama diabaikan, jadi perubahan bentuk state tidak merusak tab yang tersimpan.
 */
export function useTabFormState<T extends Record<string, unknown>>(
  defaults: T,
): [T, (patch: TabStatePatch<T>) => void] {
  // Ditangkap sekali saat mount: ketika user berpindah tab, id aktif di store
  // berubah lebih dulu daripada halaman ini di-unmount, jadi membacanya tiap
  // render berisiko menulis state ke formState milik tab lain.
  const [tab] = useState<TabIdentity | null>(() => readTabIdentity())

  const [state, setState] = useState<T>(() => {
    const persisted = readFormState(tab)
    if (!persisted) return defaults
    const restored = { ...defaults }
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = persisted[key as string]
      if (value !== undefined) restored[key] = value as T[keyof T]
    }
    return restored
  })

  useEffect(() => {
    if (!tab) return
    useTabStore.getState().updateFormState(tab.primaryTabId, tab.secondaryTabId, state)
  }, [tab, state])

  const patchState = useCallback((patch: TabStatePatch<T>) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  }, [])

  return [state, patchState]
}
