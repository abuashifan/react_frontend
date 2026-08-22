import { useQuery } from '@tanstack/react-query'
import type { AdjacentRecord, AdjacentRecords } from '@/types/common.types'

export type { AdjacentRecord, AdjacentRecords }

interface UseRecordSequenceOptions {
  /** Kunci cache TanStack Query, mis. `['sales', 'invoices', 'adjacent']`. */
  queryKey: unknown[]
  /** Ambil tetangga dari endpoint `/{resource}/adjacent`; `id` kosong = form create. */
  fetchAdjacent: (id?: number) => Promise<AdjacentRecords>
  /** Id record yang sedang dibuka; `undefined` saat form create. */
  currentId?: number
  enabled?: boolean
}

export interface RecordSequence {
  /** Record yang diinput sebelum record ini, `undefined` bila sudah paling awal. */
  prev?: AdjacentRecord
  /** Record yang diinput sesudah record ini, `undefined` bila sudah paling akhir. */
  next?: AdjacentRecord
  /** Sudah di record terbaru (atau sedang membuat baru) — Next berarti simpan lalu form kosong. */
  isAtNewest: boolean
  /** Jawaban dari server sudah diterima. */
  isReady: boolean
}

/**
 * Tetangga record dalam satu modul untuk navigasi Prev/Next di form.
 *
 * Backend menjawabnya dengan dua query ber-index yang masing-masing mengembalikan
 * satu baris, jadi biayanya tetap berapa pun besar tabelnya. Sebelumnya seluruh
 * record modul ditarik ke klien hanya untuk mencari dua tetangga.
 *
 * Urutannya memakai `id` (urutan input), bukan urutan tampil daftar — daftar
 * Produk urut nama dan COA urut kode akun, sehingga "record sebelumnya" di sana
 * bukan record yang diinput sebelumnya.
 */
export function useRecordSequence({
  queryKey,
  fetchAdjacent,
  currentId,
  enabled = true,
}: UseRecordSequenceOptions): RecordSequence {
  const { data, isSuccess } = useQuery({
    // `currentId` bagian dari key: tetangga tiap record berbeda, jadi tidak
    // boleh berbagi entri cache yang sama.
    queryKey: [...queryKey, currentId ?? 'create'],
    queryFn: () => fetchAdjacent(currentId),
    enabled,
    // Tetangga jarang berubah di tengah pengisian form; hindari refetch tiap fokus.
    staleTime: 30_000,
  })

  return {
    prev: data?.prev ?? undefined,
    next: data?.next ?? undefined,
    // Tanpa `next` berarti sudah paling akhir — termasuk saat form create,
    // yang memang selalu berada sesudah record terakhir.
    isAtNewest: !data?.next,
    isReady: isSuccess,
  }
}
