import { create } from 'zustand'

interface UnsavedFormsState {
  /** Path rute form yang isinya sudah diubah tapi belum disimpan. */
  paths: string[]

  markUnsaved: (path: string) => void
  markSaved: (path: string) => void
  clearAll: () => void
}

/**
 * Daftar form yang punya perubahan belum tersimpan, dikunci per path rute.
 *
 * Dipakai untuk memblokir "Tutup Database" dan "Keluar" — dua aksi yang menutup
 * semua tab, sehingga form yang sedang diisi akan hilang dari layar.
 *
 * SENGAJA tidak dipersist: status "belum tersimpan" hanya berlaku selama form
 * benar-benar terbuka di layar. Kalau ikut dipersist, entri basi dari sesi lama
 * akan memblokir logout tanpa ada form yang bisa dibuka user.
 *
 * Pengisinya satu: `useUnsavedFormTracker` — jangan tulis ke store ini dari
 * halaman form secara langsung, supaya tidak ada dua sumber kebenaran.
 */
export const useUnsavedFormsStore = create<UnsavedFormsState>()((set) => ({
  paths: [],

  markUnsaved: (path) =>
    set((state) => (state.paths.includes(path) ? state : { paths: [...state.paths, path] })),

  markSaved: (path) =>
    set((state) =>
      state.paths.includes(path) ? { paths: state.paths.filter((p) => p !== path) } : state,
    ),

  clearAll: () => set({ paths: [] }),
}))
