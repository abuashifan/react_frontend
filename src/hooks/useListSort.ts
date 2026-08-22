import { useCallback, useMemo, useState } from 'react'
import { nextSortState, toSortParams } from '@/components/shared/table/tableSort'
import type { SortQueryParams, SortState } from '@/components/shared/table/tableSort'

interface UseListSortResult {
  /** Sort aktif, `null` berarti mengikuti urutan default backend. */
  sort: SortState | null
  /** Handler untuk `DataTable.onSortChange` — siklus asc → desc → default. */
  toggleSort: (key: string) => void
  /** Set/reset sort secara eksplisit (mis. dari preset atau tombol reset filter). */
  setSort: (sort: SortState | null) => void
  /** `{ sort_by, sort_direction }` siap disebar ke params TanStack Query. */
  sortParams: SortQueryParams
}

/**
 * State sorting untuk halaman daftar. Dipakai berpasangan dengan `DataTable`:
 *
 * ```tsx
 * const { sort, toggleSort, sortParams } = useListSort({ key: 'journal_date', direction: 'desc' })
 * const { data } = useJournalEntryList({ page, per_page: 25, ...sortParams })
 * <DataTable sort={sort} onSortChange={toggleSort} columns={columns} ... />
 * ```
 *
 * Sorting selalu dilakukan server-side supaya urutannya benar untuk seluruh
 * data, bukan hanya baris yang kebetulan ada di halaman aktif.
 */
export function useListSort(initial: SortState | null = null): UseListSortResult {
  const [sort, setSort] = useState<SortState | null>(initial)

  const toggleSort = useCallback((key: string) => {
    setSort((current) => nextSortState(current, key))
  }, [])

  const sortParams = useMemo(() => toSortParams(sort), [sort])

  return { sort, toggleSort, setSort, sortParams }
}
