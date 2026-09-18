import { useState } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { useClientUserMutations } from '../hooks/useClientUsers'
import type { ClientUser } from '@/types/admin.types'

interface DeleteClientDialogProps {
  client: ClientUser | null
  onClose: () => void
  onDeleted: () => void
}

/**
 * Konfirmasi hapus client — ketik ulang email persis sama, pola yang sama
 * dengan hapus perusahaan oleh owner (`DeleteCompanyDialog`). Beda dari itu:
 * ini penghapusan LANGSUNG permanen, tanpa masa pemulihan 30 hari — seluruh
 * perusahaan milik client ini ikut terhapus sekaligus (lihat backend
 * `ClientUserController::destroy`). Dipakai membersihkan akun test/rusak,
 * bukan alur normal — nonaktifkan lewat status kalau cuma perlu menahan akses.
 */
export function DeleteClientDialog({ client, onClose, onDeleted }: DeleteClientDialogProps) {
  const { toast } = useToast()
  const { deleteClient } = useClientUserMutations()
  const [confirmEmail, setConfirmEmail] = useState('')

  const isValid = client !== null && confirmEmail.trim() === client.email
  const isDeleting = deleteClient.isPending

  const handleClose = () => {
    if (isDeleting) return
    setConfirmEmail('')
    onClose()
  }

  const handleConfirm = async () => {
    if (!client || !isValid || isDeleting) return

    try {
      await deleteClient.mutateAsync({ id: client.id, confirmEmail: confirmEmail.trim() })
      setConfirmEmail('')
      toast.success(`Client ${client.name} berhasil dihapus permanen.`)
      onDeleted()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menghapus client.'))
    }
  }

  return (
    <AlertDialog open={client !== null}>
      <AlertDialogContent className="max-h-[calc(100dvh-48px)] max-w-[420px] overflow-y-auto rounded-xl p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-2.5">
            <TriangleAlert className="h-5 w-5 text-[#dc2626]" />
            <AlertDialogTitle className="text-[16px] font-semibold text-[#24323a]">
              Hapus Client Permanen
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-1 text-left">
            <span className="block text-[14px] text-[#64748b]">
              Anda akan menghapus <span className="font-medium text-[#24323a]">{client?.name}</span>{' '}
              ({client?.email}) beserta <span className="font-medium text-[#24323a]">seluruh perusahaan
              miliknya</span> dan database tenant-nya.
            </span>
            <span className="mt-1 block text-[13px] text-[#dc2626]">
              Tidak ada masa pemulihan — tindakan ini langsung permanen dan tidak bisa dibatalkan.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>
          <label htmlFor="delete-client-confirm-email" className="mb-1.5 block text-[11px] font-semibold uppercase text-[#64748b]">
            Ketik <span className="font-semibold text-[#24323a]">{client?.email}</span> untuk konfirmasi
          </label>
          <Input
            id="delete-client-confirm-email"
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
            placeholder={client?.email}
            disabled={isDeleting}
            autoFocus
            className={cn(
              'h-9 border-[#d9e2e5] text-[13px] focus-visible:ring-[#5c9ead]/30',
              confirmEmail.length > 0 && !isValid && 'border-[#ef4444] focus-visible:ring-[#ef4444]/20',
            )}
          />
        </div>

        <AlertDialogFooter className="mt-1 gap-2 sm:space-x-0">
          <AlertDialogCancel
            disabled={isDeleting}
            onClick={handleClose}
            className="h-8 border-[#d9e2e5] text-[13px] text-[#64748b] hover:bg-[#f8fbfc]"
          >
            Batal
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!isValid || isDeleting}
            className="h-8 bg-[#dc2626] px-4 text-[13px] text-white hover:bg-[#b91c1c]"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
