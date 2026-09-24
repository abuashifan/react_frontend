import { create } from 'zustand'

/**
 * Profil impor yang diminta halaman lain sebelum berpindah ke Impor Data.
 *
 * Kenapa store, bukan query param `?profile=`: shell ini **state-only**.
 * `AppShell` memaksa router ke `getActiveContentPath()` setiap kali tab aktif
 * berubah, dan path itu diambil dari tab store — jadi query string apa pun yang
 * ditulis lewat `navigate()` langsung tertimpa, dan `useSearchParams()` tidak
 * pernah melihatnya. Menaruhnya di `path` tab pun tidak cukup:
 * `openPrimaryTab()` memakai ulang tab yang sudah ada dan mengabaikan `path`
 * baru, sehingga klik kedua dengan profil berbeda tidak akan berpengaruh.
 *
 * Ini niat UI sekali-pakai, bukan data API — jadi tidak melanggar aturan
 * "dilarang simpan data API di Zustand".
 */
interface ImportPresetState {
  /** Diisi pemanggil, dikosongkan `ImportPage` begitu dipakai. */
  requestedProfile: string | null
  requestProfile: (profile: string) => void
  consumeRequestedProfile: () => void
}

export const useImportPresetStore = create<ImportPresetState>((set) => ({
  requestedProfile: null,
  requestProfile: (profile) => set({ requestedProfile: profile }),
  consumeRequestedProfile: () => set({ requestedProfile: null }),
}))
