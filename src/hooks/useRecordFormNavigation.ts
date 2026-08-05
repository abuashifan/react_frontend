import { useCallback } from 'react'
import type { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { useRecordSequence } from '@/hooks/useRecordSequence'

interface UseRecordFormNavigationOptions<TValues extends FieldValues, TRecord extends { id: number }> {
  /** Id record dari route; `undefined` saat form create. */
  id?: string
  /** Prefix rute modul, mis. `/master-data/coa` (dipakai untuk `/create` dan `/:id`). */
  basePath: string
  /** Judul tab untuk form kosong, mis. `Akun Baru`. */
  createLabel: string
  /** Judul tab saat membuka record, mis. `(record) => record.account_code`. */
  getRecordLabel: (record: TRecord) => string
  sequenceQueryKey: unknown[]
  /** Ambil seluruh record modul untuk membangun urutan input. */
  fetchAll: () => Promise<TRecord[]>
  handleSubmit: UseFormHandleSubmit<TValues>
  /** Simpan isian. Lempar error agar `onError` yang menanganinya. */
  save: (values: TValues, isCreate: boolean) => Promise<void>
  /** Dipanggil setelah simpan sukses, sebelum berpindah — mis. membuang draft. */
  onSaved?: () => void
  successMessage: (isCreate: boolean) => string
  onError: (error: unknown) => void
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
 */
export function useRecordFormNavigation<TValues extends FieldValues, TRecord extends { id: number }>({
  id,
  basePath,
  createLabel,
  getRecordLabel,
  sequenceQueryKey,
  fetchAll,
  handleSubmit,
  save,
  onSaved,
  successMessage,
  onError,
}: UseRecordFormNavigationOptions<TValues, TRecord>): RecordFormNavigation {
  const { replaceRecordTab, closeRecordTab } = useRecordTab()
  const { toast } = useToast()

  const isCreate = !id
  const currentPath = id ? `${basePath}/${id}` : `${basePath}/create`

  const sequence = useRecordSequence<TRecord>({
    queryKey: sequenceQueryKey,
    fetchAll,
    currentId: id ? Number(id) : undefined,
  })

  const saveThen = useCallback(
    (after: () => void) =>
      handleSubmit(async (values) => {
        try {
          await save(values, isCreate)
          onSaved?.()
          toast.success(successMessage(isCreate))
          after()
        } catch (error) {
          onError(error)
        }
      }),
    [handleSubmit, isCreate, onError, onSaved, save, successMessage, toast],
  )

  const openRecord = useCallback(
    (record: TRecord) =>
      replaceRecordTab(currentPath, { label: getRecordLabel(record), path: `${basePath}/${record.id}` }),
    [basePath, currentPath, getRecordLabel, replaceRecordTab],
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
