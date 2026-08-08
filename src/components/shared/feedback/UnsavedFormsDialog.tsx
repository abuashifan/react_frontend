import { FileWarning } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { SessionAction } from '@/hooks/useCompanySession'
import type { UnsavedFormRef } from '@/lib/companySession'

interface UnsavedFormsDialogProps {
  action: SessionAction | null
  forms: UnsavedFormRef[]
  onClose: () => void
  onGoToForm: (path: string) => void
}

const ACTION_LABEL: Record<SessionAction, string> = {
  'close-database': 'Tutup Database',
  logout: 'Keluar',
}

/**
 * Menahan Tutup Database / Keluar selama masih ada form yang belum tersimpan.
 *
 * Sengaja TIDAK menyediakan tombol "lanjutkan saja". Kedua aksi itu menutup semua
 * tab, jadi melanjutkan berarti membuang isian tanpa cara membatalkan. Jalan
 * keluarnya harus lewat form itu sendiri: simpan, atau tutup tabnya.
 */
export function UnsavedFormsDialog({
  action,
  forms,
  onClose,
  onGoToForm,
}: UnsavedFormsDialogProps) {
  const isOpen = action !== null && forms.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <FileWarning className="h-5 w-5 shrink-0 text-amber-500" />
            Masih ada isian yang belum disimpan
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#64748b]">
            {action ? ACTION_LABEL[action] : ''} akan menutup semua tab. Simpan atau tutup
            {forms.length > 1 ? ` ${forms.length} form` : ' form'} berikut lebih dulu.
          </DialogDescription>
        </DialogHeader>

        <ul className="my-1 divide-y divide-[#f1f5f9] rounded-lg border border-[#d9e2e5]">
          {forms.map((form) => (
            <li key={form.path} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#24323a]">
                {form.label}
              </span>
              <Button
                variant="outline"
                className="h-7 shrink-0 px-2 text-[12px]"
                onClick={() => onGoToForm(form.path)}
              >
                Buka
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="h-8 bg-[#5c9ead] text-[13px] text-white hover:bg-[#4a8a9a]"
          >
            Mengerti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
