import { useCallback, useMemo, useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage, getBulkFailureDetail } from '@/lib/apiError'

interface UseBulkVoidOptions<T extends { id: number | string }> {
  /** Baris halaman aktif — sumber kebenaran untuk memetakan id terpilih ke record. */
  rows: T[]
  /** Panggil endpoint void satu dokumen. */
  voidRecord: (row: T, reason: string) => Promise<unknown>
  /** Dokumen yang boleh di-void (mis. status bukan `void`). Default: semua. */
  isEligible?: (row: T) => boolean
  /** Nomor dokumen untuk teks konfirmasi saat hanya satu baris terpilih. */
  getDocumentNumber: (row: T) => string
  /** Kata benda dokumen untuk pesan toast, mis. `'jurnal'`. */
  entityLabel: string
  /** Status pending mutation — dipakai untuk disable tombol dialog. */
  isPending?: boolean
  /** Dipanggil setelah proses selesai (sukses maupun gagal) — biasanya clear selection. */
  onFinished?: () => void
}

interface UseBulkVoidResult {
  /** Sambungkan ke `BulkAction.onClick` — memvalidasi lalu membuka dialog. */
  requestBulkVoid: (selectedIds: string[]) => void
  /** Sebar ke `<VoidConfirmDialog {...dialogProps} />`. */
  dialogProps: {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    documentNumber: string
    isLoading: boolean
  }
}

/**
 * Alur void massal yang sama untuk semua halaman daftar: saring dokumen yang
 * memang bisa di-void, konfirmasi dengan satu alasan, jalankan per dokumen,
 * lalu rangkum hasil sukses/gagal dalam satu toast.
 *
 * Backend tidak punya endpoint void batch — setiap dokumen punya guard
 * period/status masing-masing dan harus tetap dievaluasi satu per satu. Karena
 * itu request dikirim paralel dengan `allSettled`: satu dokumen yang ditolak
 * tidak boleh membatalkan sisanya, dan jumlah gagalnya tetap dilaporkan.
 *
 * ```tsx
 * const { requestBulkVoid, dialogProps } = useBulkVoid({
 *   rows,
 *   voidRecord: (row, reason) => voidJournal.mutateAsync({ id: Number(row.id), reason }),
 *   isEligible: (row) => row.status !== 'void',
 *   getDocumentNumber: (row) => row.journal_number,
 *   entityLabel: 'jurnal',
 *   isPending: voidJournal.isPending,
 *   onFinished: () => setSelectedRows([]),
 * })
 * ```
 */
export function useBulkVoid<T extends { id: number | string }>({
  rows,
  voidRecord,
  isEligible,
  getDocumentNumber,
  entityLabel,
  isPending = false,
  onFinished,
}: UseBulkVoidOptions<T>): UseBulkVoidResult {
  const { toast } = useToast()
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [isOpen, setOpen] = useState(false)

  const targets = useMemo(
    () => rows.filter((row) => targetIds.includes(String(row.id))),
    [rows, targetIds],
  )

  const close = useCallback(() => {
    setOpen(false)
    setTargetIds([])
  }, [])

  const requestBulkVoid = useCallback(
    (selectedIds: string[]) => {
      const eligible = rows.filter(
        (row) => selectedIds.includes(String(row.id)) && (isEligible ? isEligible(row) : true),
      )

      if (eligible.length === 0) {
        toast.warning(`Tidak ada ${entityLabel} terpilih yang bisa di-void.`)
        return
      }

      if (eligible.length < selectedIds.length) {
        toast.info(`${selectedIds.length - eligible.length} dokumen dilewati karena tidak bisa di-void.`)
      }

      setTargetIds(eligible.map((row) => String(row.id)))
      setOpen(true)
    },
    [entityLabel, isEligible, rows, toast],
  )

  const handleConfirm = useCallback(
    async (reason: string) => {
      if (targets.length === 0) {
        close()
        return
      }

      try {
        const results = await Promise.allSettled(targets.map((row) => voidRecord(row, reason)))
        const successCount = results.filter((result) => result.status === 'fulfilled').length
        const failureCount = results.length - successCount
        const detail = getBulkFailureDetail(results)
        const suffix = detail ? ` ${detail}` : ''

        if (failureCount === 0) {
          toast.success(`${successCount} ${entityLabel} berhasil di-void.`)
        } else if (successCount === 0) {
          toast.error(`Gagal void ${failureCount} ${entityLabel}.${suffix}`)
        } else {
          toast.warning(`${successCount} ${entityLabel} berhasil di-void, ${failureCount} gagal.${suffix}`)
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, `Gagal memproses void massal ${entityLabel}.`))
      } finally {
        close()
        onFinished?.()
      }
    },
    [close, entityLabel, onFinished, targets, toast, voidRecord],
  )

  const documentNumber =
    targets.length === 1 ? getDocumentNumber(targets[0]) : `${targets.length} dokumen terpilih`

  return {
    requestBulkVoid,
    dialogProps: {
      isOpen,
      onClose: () => {
        close()
        onFinished?.()
      },
      onConfirm: (reason: string) => void handleConfirm(reason),
      documentNumber,
      isLoading: isPending,
    },
  }
}
