import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
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
import { onboardingApi } from '../../services/onboardingApi'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/hooks/useToast'
import { COA_TEMPLATES } from '../../constants'

// Static preview per template (would come from API in production)
const TEMPLATE_PREVIEW: Record<string, string[]> = {
  gas_agent: ['1-0000 Kas & Bank', '1-1000 Piutang Usaha', '1-2000 Persediaan Gas', '2-0000 Hutang Usaha', '3-0000 Modal', '4-0000 Pendapatan Penjualan', '5-0000 Harga Pokok Penjualan'],
  trading: ['1-0000 Kas & Bank', '1-1000 Piutang Usaha', '1-2000 Persediaan Barang', '2-0000 Hutang Usaha', '3-0000 Modal', '4-0000 Pendapatan Penjualan', '5-0000 HPP', '6-0000 Beban Operasional'],
  service: ['1-0000 Kas & Bank', '1-1000 Piutang Usaha', '2-0000 Hutang Usaha', '3-0000 Modal', '4-0000 Pendapatan Jasa', '5-0000 Beban Gaji', '6-0000 Beban Operasional'],
  manufacture: ['1-0000 Kas & Bank', '1-1000 Piutang Usaha', '1-2000 Bahan Baku', '1-3000 WIP', '1-4000 Barang Jadi', '2-0000 Hutang Usaha', '3-0000 Modal', '4-0000 Pendapatan', '5-0000 HPP'],
  blank: [],
}

interface Props {
  currentTemplate: string | null
  mappingCompleted: boolean
  onComplete: (templateId: string, templateLabel: string) => void
  onBack: () => void
}

export function Step2TemplateCOA({ currentTemplate, mappingCompleted, onComplete, onBack }: Props) {
  const { activeCompanyId } = useAuthStore()
  const { toast } = useToast()
  const [selected, setSelected] = useState<string | null>(currentTemplate)
  const [previewOpen, setPreviewOpen] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingChange, setPendingChange] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    if (id === selected) {
      setPreviewOpen((prev) => (prev === id ? null : id))
      return
    }
    // Warn if mapping was already done
    if (mappingCompleted && currentTemplate && id !== currentTemplate) {
      setPendingChange(id)
      return
    }
    setSelected(id)
    setPreviewOpen(id)
  }

  const handleConfirmChange = () => {
    if (pendingChange) {
      setSelected(pendingChange)
      setPreviewOpen(pendingChange)
      setPendingChange(null)
    }
  }

  const handleContinue = async () => {
    if (!selected || !activeCompanyId) return
    setIsSubmitting(true)
    try {
      await onboardingApi.applyCoaTemplate(activeCompanyId, selected)
      const tpl = COA_TEMPLATES.find((t) => t.id === selected)!
      onComplete(selected, tpl.label)
    } catch {
      toast.error('Gagal menerapkan template COA. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Template card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COA_TEMPLATES.map((tpl) => {
          const isSelected = selected === tpl.id
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
              {tpl.accountCount > 0 && (
                <span className="text-[10px] bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded-full">
                  {tpl.accountCount} akun
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Preview panel */}
      {selected && TEMPLATE_PREVIEW[selected].length > 0 && (
        <div className="border border-[#d9e2e5] rounded-lg">
          <button
            type="button"
            className="flex items-center justify-between w-full px-4 py-3 text-[13px] font-semibold text-[#24323a]"
            onClick={() => setPreviewOpen(previewOpen ? null : selected)}
          >
            Preview Akun — {COA_TEMPLATES.find((t) => t.id === selected)?.label}
            <ChevronDown className={cn('w-4 h-4 transition-transform', previewOpen && 'rotate-180')} />
          </button>
          {previewOpen && (
            <ul className="border-t border-[#f1f5f9] divide-y divide-[#f8fafc]">
              {TEMPLATE_PREVIEW[selected].map((line) => (
                <li key={line} className="px-4 py-2 text-[12px] text-[#64748b] font-mono">
                  {line}
                </li>
              ))}
              <li className="px-4 py-2 text-[11px] text-[#94a3b8] italic">
                + {(COA_TEMPLATES.find((t) => t.id === selected)?.accountCount ?? 0) - TEMPLATE_PREVIEW[selected].length} akun lainnya…
              </li>
            </ul>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Kembali
        </Button>
        <Button
          type="button"
          disabled={!selected || isSubmitting}
          onClick={handleContinue}
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
              Mengganti template COA akan mereset Account Mapping yang sudah Anda konfigurasi di
              Step 3. Lanjutkan?
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
