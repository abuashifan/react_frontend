/**
 * Indeks rute → kunci draft form di localStorage.
 *
 * `usePersistentFormDraft` menyimpan isian yang belum tersimpan supaya tidak hilang
 * saat tab berpindah (form di-remount, lihat `key` di wrapper tiap FormPage). Tapi
 * saat tab-nya ditutup, isian itu memang sudah dibuang user — kalau drafnya dibiarkan,
 * form create berikutnya akan terisi data lama.
 *
 * Store tab hanya tahu path tab yang ditutup, bukan `draftKey` milik form. Indeks
 * kecil ini menjembatani keduanya: hook mencatat `path → storageKey`, dan
 * `closeSecondaryTab` memakainya untuk membuang draft yang bersangkutan.
 */
const INDEX_PREFIX = 'seaside-erp:form-draft-path'

function indexKeyFor(path: string): string {
  return `${INDEX_PREFIX}:${path}`
}

/** Catat draft milik `path` supaya bisa dibuang saat tabnya ditutup. */
export function rememberFormDraftPath(path: string, storageKey: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(indexKeyFor(path), storageKey)
  } catch {
    // Kuota penuh / storage diblokir — indeks bersifat opsional, abaikan.
  }
}

/** Lupakan entri indeks tanpa menyentuh draftnya (dipakai saat draft sudah dibuang). */
export function forgetFormDraftPath(path: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(indexKeyFor(path))
  } catch {
    // noop
  }
}

/** Buang draft milik `path` beserta entri indeksnya. Dipanggil saat tab form ditutup. */
export function clearFormDraftForPath(path: string): void {
  if (typeof window === 'undefined') return
  try {
    const storageKey = window.localStorage.getItem(indexKeyFor(path))
    if (storageKey) window.localStorage.removeItem(storageKey)
    window.localStorage.removeItem(indexKeyFor(path))
  } catch {
    // noop
  }
}
