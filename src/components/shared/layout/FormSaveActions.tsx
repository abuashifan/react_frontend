import { Button } from '@/components/ui/button'

interface FormSaveActionsProps {
  onCancel: () => void
  onSave: () => void
  isSaving?: boolean
  saveLabel?: string
  savingLabel?: string
  cancelLabel?: string
  saveDisabled?: boolean
  hideSave?: boolean
  /** Extra buttons (e.g. Aktifkan/Nonaktifkan) rendered before Batal/Simpan. */
  children?: React.ReactNode
}

/** Reusable Batal/Simpan pair for simple create/edit form headers. Use via FormLayout's `headerActions`. */
export function FormSaveActions({
  onCancel,
  onSave,
  isSaving,
  saveLabel = 'Simpan',
  savingLabel = 'Menyimpan...',
  cancelLabel = 'Batal',
  saveDisabled,
  hideSave,
  children,
}: FormSaveActionsProps) {
  return (
    <>
      {children}
      <Button variant="outline" className="h-8 text-[13px]" onClick={onCancel}>
        {cancelLabel}
      </Button>
      {!hideSave && (
        <Button
          className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]"
          onClick={onSave}
          disabled={saveDisabled ?? isSaving}
        >
          {isSaving ? savingLabel : saveLabel}
        </Button>
      )}
    </>
  )
}
