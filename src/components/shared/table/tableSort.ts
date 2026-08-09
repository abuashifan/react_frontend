/**
 * Kontrak sorting daftar — dipakai bersama oleh `DataTable` (UI header) dan
 * `useListSort` (state + parameter API).
 *
 * Nama parameter mengikuti kontrak backend `AppliesListQuery` di Laravel:
 * `sort_by` + `sort_direction`, dengan allowlist kolom di service. Kolom yang
 * tidak ada di allowlist backend akan diabaikan (jatuh ke default sort), jadi
 * `sortKey` di kolom tabel wajib memakai nama field backend, bukan `id` kolom
 * UI bila keduanya berbeda.
 */
import type { SortDirection } from '@/types/common.types'

export type { SortDirection }

export interface SortState {
  /** Nama field backend, mis. `journal_date` atau `total_debit`. */
  key: string
  direction: SortDirection
}

export interface SortQueryParams {
  sort_by?: string
  sort_direction?: SortDirection
}

/** Ubah state sort menjadi query param API (kosong bila tidak ada sort aktif). */
export function toSortParams(sort: SortState | null): SortQueryParams {
  if (!sort) return {}
  return { sort_by: sort.key, sort_direction: sort.direction }
}

/**
 * Siklus tiga langkah saat header kolom diklik: asc → desc → tanpa sort
 * (kembali ke urutan default backend). Kolom lain yang diklik selalu mulai asc.
 */
export function nextSortState(current: SortState | null, key: string): SortState | null {
  if (!current || current.key !== key) return { key, direction: 'asc' }
  if (current.direction === 'asc') return { key, direction: 'desc' }
  return null
}
