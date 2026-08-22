import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { setupApi } from '../../services/onboardingApi'
import { useToast } from '@/hooks/useToast'
import { COA_TEMPLATES } from '../../constants'
import { CoaTemplateModal } from '../CoaTemplateModal'
import type { CoaTemplateAccountInput } from '../../types/setup.types'
import { getApiErrorMessage } from '@/lib/apiError'

interface Props {
  currentTemplate: string | null
  mappingCompleted: boolean
  onComplete: (templateId: string, templateLabel: string, accountCount: number) => void
  onBack: () => void
}

export function Step2TemplateCOA({ currentTemplate, mappingCompleted, onComplete, onBack }: Props) {
  const { toast } = useToast()
  const [selected, setSelected] = useState<string | null>(currentTemplate)
  const [customAccounts, setCustomAccounts] = useState<CoaTemplateAccountInput[] | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingChange, setPendingChange] = useState<string | null>(null)

  const templatesQuery = useQuery({
    queryKey: ['setup-coa-templates'],
    queryFn: async () => (await setupApi.listCoaTemplates()).data,
  })

  const templates = templatesQuery.data ?? []
  const selectedTemplateDef = templates.find((t) => t.id === selected)

  const handleSelect = (id: string) => {
    if (id === selected) {
      setPreviewModalOpen(true)
      return
    }
    // Warn if mapping was already done -- ganti template mengganti ulang akun yang sudah dibuat.
    if (mappingCompleted && currentTemplate && id !== currentTemplate) {
      setPendingChange(id)
      return
    }
    setSelected(id)
    setCustomAccounts(null)
    setPreviewModalOpen(true)
  }

  const handleConfirmChange = () => {
    if (pendingChange) {
      setSelected(pendingChange)
      setCustomAccounts(null)
      setPreviewModalOpen(true)
      setPendingChange(null)
    }
  }

  const handleContinue = async () => {
    if (!selected || !selectedTemplateDef) return
    setIsSubmitting(true)
    try {
      await setupApi.applyCoaTemplate({
        template_id: selected,
        accounts: customAccounts ?? selectedTemplateDef.accounts,
      })
      try { await setupApi.validateStep('chart_of_accounts') } catch { /* progres non-blocking */ }
      onComplete(selected, selectedTemplateDef.label, (customAccounts ?? selectedTemplateDef.accounts).length)
    } catch (continueError) {
      toast.error(getApiErrorMessage(continueError, 'Gagal menerapkan template COA. Coba lagi.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (templatesQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-[13px] text-[#64748b]">
        Memuat template COA...
      </div>
    )
  }

  if (templatesQuery.isError) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          Gagal memuat template COA.
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
          <Button type="button" onClick={() => void templatesQuery.refetch()} className="bg-[#5c9ead] hover:bg-[#4a8a9b]">
            Muat Ulang
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Template card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COA_TEMPLATES.map((tpl) => {
          const isSelected = selected === tpl.id
          const accountCount = templates.find((t) => t.id === tpl.id)?.account_count ?? 0
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelect(tpl.id)}
              className={cn(
                'flex flex-col items-start text-left p-4 rounded-lg border-2 transition-all',
                isSelected
                  ? 'border-[#5c9ead] bg-[#f0f9fb]'
                  : 'border-[#d9e2e5] bg-white hover:border-[#5c9ead] hover:bg-[#f8fcfd]',
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <tpl.Icon className={cn('w-5 h-5', isSelected ? 'text-[#5c9ead]' : 'text-[#64748b]')} />
                {isSelected && <Check className="w-4 h-4 text-[#5c9ead]" />}
              </div>
              <p className={cn('text-[13px] font-semibold mb-1', isSelected ? 'text-[#5c9ead]' : 'text-[#24323a]')}>
                {tpl.label}
              </p>
              <p className="text-[11px] text-[#64748b] leading-snug mb-2">{tpl.description}</p>
              {accountCount > 0 && (
                <span className="text-[10px] bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded-full">
                  {accountCount} akun
                </span>
              )}
              {isSelected && customAccounts && (
                <span className="mt-1 text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-0.5 rounded-full">
                  Kustom
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selected && (
        <p className="text-[12px] text-[#64748b]">
          Klik card di atas kapan saja untuk membuka pratinjau akun lengkap dan mengeditnya.
        </p>
      )}

      <CoaTemplateModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        template={selectedTemplateDef}
        customAccounts={customAccounts}
        onSave={setCustomAccounts}
      />

      {/* Navigation */}
      <div className="sticky bottom-0 -mx-6 mt-2 flex items-center justify-between border-t border-[#d9e2e5] bg-white px-6 py-3 lg:-mx-8 lg:px-8">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Kembali
        </Button>
        <Button
          type="button"
          disabled={!selected || isSubmitting}
          onClick={() => void handleContinue()}
          className="bg-[#e39774] hover:bg-[#d4845e] px-6"
        >
          {isSubmitting ? 'Menerapkan...' : 'Lanjutkan →'}
        </Button>
      </div>

      {/* COA change warning */}
      <AlertDialog open={!!pendingChange} onOpenChange={() => setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ganti Template COA?</AlertDialogTitle>
            <AlertDialogDescription>
              Mengganti template COA akan mengganti ulang akun yang sudah dibuat dari template
              sebelumnya dan mereset Account Mapping yang sudah Anda konfigurasi di Step
              berikutnya. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>Ya, Ganti Template</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
