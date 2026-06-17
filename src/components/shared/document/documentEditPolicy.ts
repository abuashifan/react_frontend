import type { DocumentStatus } from '@/types/common.types'

/**
 * Policy edit/read-only dokumen (Audit-12 A12-10).
 *
 * Aturan UX konsisten antar modul:
 * - Create form selalu edit mode.
 * - Status `draft` editable (form tetap cek permission update sebelum render aksi).
 * - Status posted/approved/void/sistem read-only → tampilkan alasan yang jelas.
 *
 * Helper ini HANYA menghasilkan teks alasan read-only untuk banner; keputusan
 * `isEditable` tetap di masing-masing form (umumnya `isCreate || status==='draft'`)
 * karena tergantung aturan backend per dokumen.
 */
const READ_ONLY_REASONS: Partial<Record<DocumentStatus, string>> = {
  posted: 'Dokumen sudah diposting sehingga tidak dapat diubah. Void dokumen untuk membatalkannya.',
  approved: 'Dokumen sudah disetujui sehingga tidak dapat diubah.',
  finalized: 'Dokumen sudah difinalisasi sehingga tidak dapat diubah.',
  paid: 'Dokumen sudah lunas sehingga tidak dapat diubah.',
  partially_paid: 'Dokumen sudah memiliki pembayaran sehingga tidak dapat diubah.',
  void: 'Dokumen sudah di-void dan hanya dapat dilihat.',
  cancelled: 'Dokumen sudah dibatalkan dan hanya dapat dilihat.',
  closed: 'Dokumen sudah ditutup sehingga tidak dapat diubah.',
}

const DEFAULT_REASON = 'Dokumen tidak berada pada status draft sehingga hanya dapat dilihat.'

/** Alasan read-only untuk ditampilkan saat dokumen tidak editable. */
export function documentReadOnlyReason(status?: DocumentStatus): string {
  if (!status) return DEFAULT_REASON
  return READ_ONLY_REASONS[status] ?? DEFAULT_REASON
}
