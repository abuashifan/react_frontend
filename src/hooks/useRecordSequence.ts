import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

interface UseRecordSequenceOptions<T extends { id: number }> {
  /** Kunci cache TanStack Query, mis. `['master-data-produk', 'sequence']`. */
  queryKey: unknown[]
  /** Ambil seluruh record modul (endpoint list tanpa page/per_page mengembalikan semuanya). */
  fetchAll: () => Promise<T[]>
  /** Id record yang sedang dibuka; `undefined` saat form create. */
  currentId?: number
  enabled?: boolean
}

export interface RecordSequence<T> {
  /** Record yang diinput sebelum record ini, `undefined` bila sudah paling awal. */
  prev?: T
  /** Record yang diinput sesudah record ini, `undefined` bila sudah paling akhir. */
  next?: T
  /** Sudah di record terbaru (atau sedang membuat baru) — Next berarti simpan lalu form kosong. */
  isAtNewest: boolean
  /** Urutan sudah termuat dan record ini ada di dalamnya. */
  isReady: boolean
}

/**
 * Urutan record dalam satu modul untuk navigasi Prev/Next di form.
 *
 * Diurutkan berdasarkan `id` (urutan input), bukan urutan tampil di daftar —
 * daftar Produk urut nama dan COA urut kode akun, sehingga "record sebelumnya"
 * di sana bukan record yang diinput sebelumnya.
 */
export function useRecordSequence<T extends { id: number }>({
  queryKey,
  fetchAll,
  currentId,
  enabled = true,
}: UseRecordSequenceOptions<T>): RecordSequence<T> {
  const { data } = useQuery({
    queryKey,
    queryFn: fetchAll,
    enabled,
    // Urutan jarang berubah di tengah pengisian form; hindari refetch tiap fokus.
    staleTime: 30_000,
  })

  return useMemo(() => {
    const records = [...(data ?? [])].sort((a, b) => a.id - b.id)

    if (records.length === 0) {
      return { isAtNewest: true, isReady: false }
    }

    // Form create belum punya id: posisinya dianggap sesudah record terakhir.
    if (currentId === undefined) {
      return { prev: records[records.length - 1], isAtNewest: true, isReady: true }
    }

    const index = records.findIndex((record) => record.id === currentId)
    if (index === -1) {
      return { isAtNewest: false, isReady: false }
    }

    return {
      prev: index > 0 ? records[index - 1] : undefined,
      next: index < records.length - 1 ? records[index + 1] : undefined,
      isAtNewest: index === records.length - 1,
      isReady: true,
    }
  }, [currentId, data])
}
