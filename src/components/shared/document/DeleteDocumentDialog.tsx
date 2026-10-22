import { ConfirmDialog } from './ConfirmDialog'
import { VoidConfirmDialog } from './VoidConfirmDialog'

interface DeleteDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Alasan hanya terisi untuk dokumen yang sudah berefek; draft dihapus tanpa alasan. */
  onConfirm: (reason?: string) => void
  documentNumber: string
  /** true = dokumen sudah punya efek (posted dsb.): efeknya dibatalkan lalu dokumen disembunyikan. */
  hasEffects: boolean
  isLoading?: boolean
}

/**
 * Konfirmasi hapus dokumen (mode lock/open). Draft dihapus permanen tanpa
 * alasan; dokumen yang sudah berefek meminta alasan karena efek buku besarnya
 * dibatalkan dulu (jurnal lama tetap tersimpan sebagai jejak audit).
 */
export function DeleteDocumentDialog({ isOpen, onClose, onConfirm, documentNumber, hasEffects, isLoading }: DeleteDocumentDialogProps) {
  if (!hasEffects) {
    return (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => onConfirm()}
        title="Hapus Dokumen"
        description={`${documentNumber || 'Dokumen ini'} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loadingLabel="Menghapus..."
        variant="destructive"
        isLoading={isLoading}
      />
    )
  }

  return (
    <VoidConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={(reason) => onConfirm(reason)}
      documentNumber={documentNumber}
      isLoading={isLoading}
      title="Hapus Dokumen"
      description={`Anda akan menghapus ${documentNumber}. Efeknya (jurnal, stok, saldo) dibatalkan, dan dokumen disembunyikan dari daftar.`}
      warning="Jurnal lama tetap tersimpan sebagai jejak audit. Tindakan ini tidak dapat dibatalkan."
      reasonLabel="Alasan hapus"
      reasonPlaceholder="Masukkan alasan hapus..."
      confirmLabel="Hapus Dokumen"
      loadingLabel="Menghapus..."
    />
  )
}
