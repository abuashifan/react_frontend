import { useState, type ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'
import { SourceDocumentDialog, SourceNotification } from './SourceDocumentDialogs'
import { countText, joinNatural, sourceName } from './sourceDocumentText'
import type { SourceConvertOption } from './sourceConvert'

interface UseSourceDocumentsOptions {
  /** Hanya aktif di form buat-baru. */
  enabled: boolean
  sources: SourceConvertOption[]
  /** Nama dokumen yang dibuat, mis. "Faktur Penjualan". */
  targetLabel: string
  /** Rute tab buat-baru yang diganti dengan dokumen hasil konversi. */
  createPath: string
  targetPath: (id: number) => string
  /** Sumber yang langsung dipilih, mis. dari tombol "Buat Pesanan Pembelian" di halaman Permintaan. */
  initial?: { key: string; id: number } | null
  /** Catatan tambahan di notifikasi, mis. cara penilaian bila dibuat tanpa dokumen sumber. */
  note?: string
}

/**
 * Ambil data dari dokumen sebelumnya untuk form buat-baru.
 *
 * Menggantikan panel "Ambil dari Dokumen Sebelumnya" yang selalu tampil di form.
 * Saat form buat-baru dibuka dan ada dokumen sumber yang masih bisa dipakai, muncul
 * notifikasi melayang. "Ya" membuka modal pemilih dokumen (lengkap dengan pratinjau
 * baris); "Tidak" menutup notifikasi dan form diisi manual. Pemilih bisa dibuka lagi
 * lewat `open` (tombol "Ambil dari Dokumen" di header form).
 *
 * Dokumen baru dibuat backend sebagai draft dari sumber yang dipilih, lalu tab
 * buat-baru diganti dengan dokumen itu untuk diperiksa dan diedit.
 */
export function useSourceDocuments({ enabled, sources, targetLabel, createPath, targetPath, initial, note }: UseSourceDocumentsOptions) {
  const [phase, setPhase] = useState<'prompt' | 'dialog' | 'closed'>(initial ? 'dialog' : 'prompt')

  const open = enabled && sources.length > 0
  const counts = useQueries({
    queries: sources.map((source) => ({
      queryKey: ['source-docs', 'open', targetLabel, source.key],
      queryFn: () => source.search('', null),
      enabled: open,
      staleTime: 15_000,
    })),
  })
  const sizes = counts.map((query) => query.data?.length ?? 0)
  const total = sizes.reduce((sum, size) => sum + size, 0)
  const available = open && total > 0

  let element: ReactNode = null
  if (open && phase === 'prompt' && available) {
    const summary = joinNatural(
      sources.flatMap((source, index) => (sizes[index] > 0 ? [`${countText(sizes[index])} ${sourceName(source)}`] : [])),
    )
    element = (
      <SourceNotification
        summary={summary}
        targetLabel={targetLabel}
        note={note}
        onAccept={() => setPhase('dialog')}
        onDecline={() => setPhase('closed')}
      />
    )
  } else if (open && phase === 'dialog') {
    element = (
      <SourceDocumentDialog
        sources={sources}
        sizes={sizes}
        targetLabel={targetLabel}
        createPath={createPath}
        targetPath={targetPath}
        initial={initial ?? null}
        onClose={() => setPhase('closed')}
      />
    )
  }

  return { element, available, open: () => setPhase('dialog') }
}
