import type { SelectOption } from '@/types/common.types'

/**
 * Ingatan label untuk `SearchableSelect` yang memakai `cacheKey`.
 *
 * Form dokumen menyimpan draft hanya berupa ID (mis. `vendor_id`). Saat tab
 * dipindah lalu dibuka lagi, form dipasang ulang dan draft dipulihkan, tetapi
 * label opsi yang dipilih sudah hilang sehingga dropdown menampilkan "#1".
 * Label disimpan per perusahaan + jenis data (`cacheKey`) + ID, jadi ID yang
 * sama di perusahaan lain atau di jenis data lain tidak pernah tertukar.
 */
const STORAGE_KEY = 'finlite:select-labels:v1'
const MAX_ENTRIES = 500

type Entry = { label: string; sublabel?: string }
let memory: Map<string, Entry> | null = null

function load(): Map<string, Entry> {
  if (memory) return memory
  memory = new Map()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (Array.isArray(item) && typeof item[0] === 'string' && item[1] && typeof item[1].label === 'string') {
          memory.set(item[0], item[1] as Entry)
        }
      }
    }
  } catch {
    // Penyimpanan browser tidak tersedia: tetap pakai ingatan di memori.
  }
  return memory
}

function persist(map: Map<string, Entry>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.entries())))
  } catch {
    // Abaikan: penuh atau diblokir.
  }
}

function key(companyId: number | null, cacheKey: string, value: number) {
  return `${companyId ?? 0}:${cacheKey}:${value}`
}

export function rememberSelectLabel(companyId: number | null, cacheKey: string, option: SelectOption<number>) {
  if (!option.label) return
  const map = load()
  const k = key(companyId, cacheKey, option.value)
  const current = map.get(k)
  if (current && current.label === option.label && current.sublabel === option.sublabel) return
  map.delete(k)
  map.set(k, { label: option.label, sublabel: option.sublabel })
  while (map.size > MAX_ENTRIES) {
    const oldest = map.keys().next().value
    if (oldest === undefined) break
    map.delete(oldest)
  }
  persist(map)
}

export function recallSelectLabel(companyId: number | null, cacheKey: string, value: number): SelectOption<number> | null {
  const entry = load().get(key(companyId, cacheKey, value))
  return entry ? { value, label: entry.label, sublabel: entry.sublabel } : null
}
