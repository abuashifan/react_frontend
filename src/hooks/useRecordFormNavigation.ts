import { useCallback } from 'react'
import type { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { useRecordSequence, type AdjacentRecord, type AdjacentRecords } from '@/hooks/useRecordSequence'

/**
 * Dilempar dari `save` untuk membatalkan simpan **tanpa** memanggil `onError`.
 *
 * Dipakai form yang punya validasi sendiri sebelum request (mis. validasi baris
 * di Vendor Bill / Penyesuaian Stok) dan sudah menampilkan pesannya — tanpa ini
 * user akan melihat toast error kedua yang lebih generik.
 */
export class FormValidationAbort extends Error {}

interface UseRecordFormNavigationOptions<TValues extends FieldValues> {
  /** Id record dari route; `undefined` saat form create. */
  id?: string
  /** Prefix rute modul, mis. `/master-data/coa` (dipakai untuk `/create` dan `/:id`). */
  basePath: string
  /** Judul tab untuk form kosong, mis. `Akun Baru`. */
  createLabel: string
  sequenceQueryKey: unknown[]
  /** Ambil tetangga dari endpoint `/{resource}/adjacent`; labelnya ikut dari server. */
  fetchAdjacent: (id?: number) => Promise<AdjacentRecords>
  handleSubmit: UseFormHandleSubmit<TValues>
  /** Simpan isian. Lempar error agar `onError` yang menanganinya. */
  save: (values: TValues, isCreate: boolean) => Promise<void>
  /** Dipanggil setelah simpan sukses, sebelum berpindah — mis. membuang draft. */
  onSaved?: () => void
  successMessage: (isCreate: boolean) => string
  onError: (error: unknown) => void
  /**
   * Isian masih bisa disimpan. Dokumen transaksi yang sudah diposting bersifat
   * read-only: tidak ada yang perlu disimpan, jadi Prev/Next langsung berpindah.
   * Default `true` (master data selalu bisa disimpan).
   */
  canSave?: boolean
}

export interface RecordFormNavigation {
  /** Simpan lalu tutup tab form. */
  saveAndClose: () => void
  /** Props siap pakai untuk `<RecordNavButtons />`. */
  navProps: {
    onPrev: () => void
    onNext: () => void
    canPrev: boolean
    canNext: boolean
    nextCreatesNew: boolean
  }
}

/**
 * Navigasi Prev/Next antar record dalam satu modul, plus aksi Simpan & Tutup.
 *
 * Ketiga aksi menyimpan isian lebih dulu; kalau validasi atau simpan gagal, form
 * tetap di tempat dengan field yang ditandai dan navigasi dibatalkan. Urutannya
 * memakai `useRecordSequence` (urut id = urutan input), sehingga tidak terpengaruh
 * sort/filter daftar.
 *
 * Untuk dokumen yang sudah diposting (`canSave: false`) tidak ada yang bisa
 * disimpan, jadi Prev/Next berubah jadi navigasi murni — tombolnya tetap ada
 * supaya user bisa menelusuri dokumen tanpa kembali ke daftar.
 */
export function useRecordFormNavigation<TValues extends FieldValues>({
  id,
  basePath,
  createLabel,
  sequenceQueryKey,
  fetchAdjacent,
  handleSubmit,
  save,
  onSaved,
  successMessage,
  onError,
  canSave = true,
}: UseRecordFormNavigationOptions<TValues>): RecordFormNavigation {
  const { replaceRecordTab, closeRecordTab } = useRecordTab()
  const { toast } = useToast()

  const isCreate = !id
  const currentPath = id ? `${basePath}/${id}` : `${basePath}/create`

  const sequence = useRecordSequence({
    queryKey: sequenceQueryKey,
    fetchAdjacent,
    currentId: id ? Number(id) : undefined,
  })

  const saveThen = useCallback(
    (after: () => void): (() => void) => {
      // Read-only: tidak ada isian yang perlu disimpan, dan menjalankan validasi
      // di sini justru memblokir navigasi pada dokumen yang memang tidak diisi user.
      if (!canSave) return after

      return handleSubmit(async (values) => {
        try {
          await save(values, isCreate)
          onSaved?.()
          toast.success(successMessage(isCreate))
          after()
        } catch (error) {
          // Form membatalkan simpannya sendiri dan sudah menampilkan pesan —
          // jangan teruskan ke onError supaya tidak muncul toast kedua.
          if (error instanceof FormValidationAbort) return
          onError(error)
        }
      })
    },
    [canSave, handleSubmit, isCreate, onError, onSaved, save, successMessage, toast],
  )

  const openRecord = useCallback(
    (record: AdjacentRecord) =>
      replaceRecordTab(currentPath, { label: record.label, path: `${basePath}/${record.id}` }),
    [basePath, currentPath, replaceRecordTab],
  )

  return {
    saveAndClose: saveThen(() => closeRecordTab(currentPath, basePath)),
    navProps: {
      onPrev: saveThen(() => {
        if (sequence.prev) openRecord(sequence.prev)
      }),
      onNext: saveThen(() => {
        if (sequence.next) openRecord(sequence.next)
        // Sudah di record terbaru: lanjut ke form kosong.
        else replaceRecordTab(currentPath, { label: createLabel, path: `${basePath}/create` })
      }),
      canPrev: !!sequence.prev,
      canNext: sequence.isReady,
      nextCreatesNew: !sequence.next,
    },
  }
}
