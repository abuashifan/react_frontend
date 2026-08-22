import { authApi } from '@/modules/auth/services/authApi'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { useTabStore } from '@/stores/useTabStore'
import { useUnsavedFormsStore } from '@/stores/useUnsavedFormsStore'

/**
 * Dua aksi sesi yang harus dibedakan:
 *
 * - **Tutup Database** — menutup perusahaan yang sedang dibuka, sesi login tetap
 *   hidup, user mendarat di halaman pemilih perusahaan. Ganti perusahaan berjalan
 *   lewat sini: perusahaan lama ditutup lebih dulu, baru yang baru dibuka.
 * - **Keluar** — mengakhiri sesi login sekaligus.
 *
 * Keduanya mereset state klien (cache query dan seluruh tab), dan keduanya
 * diblokir bila ada form dengan isian yang belum tersimpan.
 *
 * Reset cache dan tab TIDAK dilakukan di sini: `installCompanyScopeReset()`
 * berlangganan ke perubahan `activeCompanyId`, jadi cukup mengubah id-nya. Itu
 * juga alasan modul ini tidak perlu tahu soal `QueryClient`.
 */

export interface UnsavedFormRef {
  /** Path rute form — dipakai untuk memindahkan fokus ke tab-nya. */
  path: string
  /** Label tab form, mis. "INV-0001" atau "Akun Baru". */
  label: string
}

/**
 * Form yang isinya belum tersimpan DAN tabnya masih terbuka.
 *
 * Tab terbuka adalah otoritasnya, bukan registry: entri di registry bertahan
 * melewati unmount (user pindah tab, form ikut unmount, tapi tabnya masih ada),
 * jadi entri yang tabnya sudah tidak ada harus diabaikan. Tanpa filter ini, form
 * yang ditutup lewat jalur tak terduga bisa memblokir Tutup Database selamanya
 * tanpa ada form yang bisa dibuka user.
 */
export function getUnsavedForms(): UnsavedFormRef[] {
  const { paths } = useUnsavedFormsStore.getState()
  if (paths.length === 0) return []

  const labelByPath = new Map<string, string>()
  Object.values(useTabStore.getState().secondaryTabs).forEach((tabs) => {
    tabs.forEach((tab) => {
      if (tab.type === 'form') labelByPath.set(tab.path, tab.label)
    })
  })

  return paths
    .filter((path) => labelByPath.has(path))
    .map((path) => ({ path, label: labelByPath.get(path)! }))
}

/**
 * Pindahkan fokus ke tab form tertentu supaya user bisa menyimpan atau menutupnya.
 *
 * Memakai store tab, bukan `navigate(path)`: `AppShell` menyetir router dari state
 * tab, jadi navigasi langsung akan langsung ditimpa kembali ke tab yang aktif.
 *
 * @returns false bila tabnya tidak ditemukan.
 */
export function focusFormTab(path: string): boolean {
  const { secondaryTabs, setActivePrimaryTab, setActiveSecondaryTab } = useTabStore.getState()

  for (const [primaryTabId, tabs] of Object.entries(secondaryTabs)) {
    const tab = tabs.find((secondaryTab) => secondaryTab.path === path)
    if (!tab) continue

    setActivePrimaryTab(primaryTabId)
    setActiveSecondaryTab(primaryTabId, tab.id)
    return true
  }

  return false
}

/** Tutup perusahaan aktif; sesi login tetap hidup. Panggil hanya setelah lolos penjaga form. */
export function closeDatabase(): void {
  useUnsavedFormsStore.getState().clearAll()
  useCompanyStore.getState().clearCompany()
  // Perubahan id inilah yang memicu pengosongan cache query dan penutupan tab.
  useAuthStore.getState().closeCompany()
}

/** Akhiri sesi login. Galat jaringan diabaikan — state klien tetap harus bersih. */
export async function logoutFromApp(): Promise<void> {
  try {
    await authApi.logout()
  } catch {
    // Token di server mungkin sudah kedaluwarsa; pembersihan klien tetap jalan.
  }

  useUnsavedFormsStore.getState().clearAll()
  useCompanyStore.getState().clearCompany()
  useAuthStore.getState().logout()
}
