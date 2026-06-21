import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/shared/PermissionGuard'

export type SaveIntent = 'close' | 'stay' | 'new'

interface MasterDataFormActionsProps {
  permission: string
  isSubmitting: boolean
  onCancel: () => void
  onSave: (intent: SaveIntent) => void
}

export function MasterDataFormActions({
  permission,
  isSubmitting,
  onCancel,
  onSave,
}: MasterDataFormActionsProps) {
  return (
    <>
      <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={onCancel}>
        Batal
      </Button>
      <PermissionGuard permission={permission}>
        <Button
          type="button"
          variant="outline"
          className="h-8 text-[13px]"
          onClick={() => onSave('new')}
          disabled={isSubmitting}
        >
          Simpan & Baru
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 text-[13px]"
          onClick={() => onSave('stay')}
          disabled={isSubmitting}
        >
          Simpan
        </Button>
        <Button
          type="button"
          className="h-8 bg-[#e39774] text-[13px] hover:bg-[#d4845e]"
          onClick={() => onSave('close')}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan & Tutup'}
        </Button>
      </PermissionGuard>
    </>
  )
}
