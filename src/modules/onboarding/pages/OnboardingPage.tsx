import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCompanySession } from '@/hooks/useCompanySession'
import { useAuthStore } from '@/stores/useAuthStore'
import { WizardSidebar, type WizardStep, type StepStatus } from '../components/WizardSidebar'
import { Step1CompanyInfo } from '../components/steps/Step1CompanyInfo'
import { StepModuleSelection } from '../components/steps/StepModuleSelection'
import { Step2TemplateCOA } from '../components/steps/Step2TemplateCOA'
import { Step3AccountMapping } from '../components/steps/Step3AccountMapping'
import { Step4MasterData } from '../components/steps/Step4MasterData'
import { Step5OpeningBalance } from '../components/steps/Step5OpeningBalance'
import { Step6Complete } from '../components/steps/Step6Complete'
import type { CompanyInfoValues } from '../schemas/companyInfoSchema'
import type { QuickAddItem } from '../components/MasterDataQuickAdd'
import { WIZARD_STATE_KEY } from '../constants'

interface WizardState {
  /**
   * Pemilik state ini. Sejak wizard bisa ditinggalkan lewat tombol Batalkan,
   * satu kunci sessionStorage dipakai bergantian oleh beberapa perusahaan —
   * tanpa penanda ini, membuka perusahaan lain yang juga belum selesai setup
   * akan memuat langkah dan ringkasan milik perusahaan sebelumnya.
   */
  companyId: number | null
  currentStep: number
  visitedSteps: number[]
  completedSteps: number[]
  // Step data for summary and template change warning
  companyInfo: CompanyInfoValues | null
  selectedTemplate: string | null
  templateLabel: string | null
  templateAccountCount: number
  mappingCompleted: boolean
  masterData: {
    warehouses: QuickAddItem[]
    units: QuickAddItem[]
    paymentTerms: QuickAddItem[]
  }
  openingBalanceSkipped: boolean
}

/*
 * Urutan mengikuti step canonical backend (SetupWizardService::$steps).
 * Nomor langkah hidup di sini, bukan di nama file komponen.
 */
const STEP_TITLES = [
  { number: 1, title: 'Informasi Perusahaan' },
  { number: 2, title: 'Modul Aktif' },
  { number: 3, title: 'Template COA' },
  { number: 4, title: 'Account Mapping' },
  { number: 5, title: 'Master Data Dasar' },
  { number: 6, title: 'Opening Balance', subtitle: 'Opsional' },
  { number: 7, title: 'Selesai' },
]

const INITIAL_STATE: WizardState = {
  companyId: null,
  currentStep: 1,
  visitedSteps: [1],
  completedSteps: [],
  companyInfo: null,
  selectedTemplate: null,
  templateLabel: null,
  templateAccountCount: 0,
  mappingCompleted: false,
  masterData: { warehouses: [], units: [], paymentTerms: [] },
  openingBalanceSkipped: false,
}

/*
 * Posisi wizard disimpan di sessionStorage. Langkah Opening Balance
 * memindahkan user ke halaman Saldo Awal, dan tanpa ini wizard akan mengulang
 * dari langkah 1 saat ia kembali. Backend tetap pemegang status resmi setup —
 * ini murni kenyamanan navigasi, sesuai batasan di setup-wizard plan.
 */
function readPersistedState(activeCompanyId: number | null): WizardState {
  const fresh = { ...INITIAL_STATE, companyId: activeCompanyId }

  try {
    const raw = sessionStorage.getItem(WIZARD_STATE_KEY)
    if (!raw) return fresh

    const saved = JSON.parse(raw) as Partial<WizardState>

    // State milik perusahaan lain diabaikan, bukan dipakai ulang.
    if (saved.companyId !== activeCompanyId) return fresh

    return { ...INITIAL_STATE, ...saved, companyId: activeCompanyId }
  } catch {
    return fresh
  }
}

export function OnboardingPage() {
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const { isBusy, requestCloseDatabase } = useCompanySession()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [state, setStateRaw] = useState<WizardState>(() => readPersistedState(activeCompanyId))

  const setState: typeof setStateRaw = (update) => {
    setStateRaw((prev) => {
      const next = typeof update === 'function' ? update(prev) : update
      try {
        sessionStorage.setItem(WIZARD_STATE_KEY, JSON.stringify(next))
      } catch { /* sessionStorage penuh/diblokir — wizard tetap jalan */ }
      return next
    })
  }

  const markCompleted = (step: number, next: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: next,
      visitedSteps: prev.visitedSteps.includes(next) ? prev.visitedSteps : [...prev.visitedSteps, next],
      completedSteps: prev.completedSteps.includes(step) ? prev.completedSteps : [...prev.completedSteps, step],
    }))
  }

  const goBack = () => {
    setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }))
  }

  const canNavigateTo = (step: number) =>
    state.visitedSteps.includes(step) || step === state.currentStep

  const navigateTo = (step: number) => {
    if (!canNavigateTo(step)) return
    setState((prev) => ({ ...prev, currentStep: step }))
  }

  const getStepStatus = (step: number): StepStatus => {
    if (state.completedSteps.includes(step)) return 'completed'
    if (state.currentStep === step) return 'active'
    if (state.visitedSteps.includes(step)) return 'incomplete'
    return 'pending'
  }

  const wizardSteps: WizardStep[] = STEP_TITLES.map((s) => ({
    ...s,
    status: getStepStatus(s.number),
  }))

  return (
    <div className="h-dvh bg-[#EFEFED] flex flex-col">
      {/* Wizard header */}
      <header className="h-[52px] bg-[#326273] flex items-center justify-between gap-4 px-6 shrink-0">
        <span className="text-white font-semibold text-[15px] truncate">
          🌊 Seaside Escape ERP — Setup Perusahaan Baru
        </span>
        {/*
          Satu-satunya jalan keluar dari wizard selain menyelesaikannya. Tanpa
          ini user yang terlanjur masuk ke perusahaan yang salah terkunci di
          sini — tidak ada Topbar, jadi tidak ada menu "Tutup Database".
        */}
        <Button
          variant="outline"
          onClick={() => setCancelOpen(true)}
          disabled={isBusy}
          className="gap-2 h-8 shrink-0 text-[12px] bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
          Batalkan
        </Button>
      </header>

      {/* Wizard body */}
      <div className="flex flex-1 overflow-hidden">
        <WizardSidebar
          steps={wizardSteps}
          onNavigate={navigateTo}
          canNavigateTo={canNavigateTo}
        />

        {/* Content panel */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-white">
          <div className="flex-1 p-6 lg:p-8 max-w-[860px]">
            {/* Step header */}
            <div className="mb-6 pb-4 border-b border-[#d9e2e5]">
              <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide mb-1">
                Langkah {state.currentStep} dari {STEP_TITLES.length}
              </p>
              <h1 className="text-xl font-semibold text-[#24323a]">
                {STEP_TITLES[state.currentStep - 1]?.title}
              </h1>
            </div>

            {/* Step content */}
            {state.currentStep === 1 && (
              <Step1CompanyInfo
                defaultValues={state.companyInfo ?? undefined}
                onComplete={(values) => {
                  setState((prev) => ({ ...prev, companyInfo: values }))
                  markCompleted(1, 2)
                }}
              />
            )}

            {state.currentStep === 2 && (
              <StepModuleSelection
                onComplete={() => markCompleted(2, 3)}
                onBack={goBack}
              />
            )}

            {state.currentStep === 3 && (
              <Step2TemplateCOA
                currentTemplate={state.selectedTemplate}
                mappingCompleted={state.mappingCompleted}
                onComplete={(templateId, templateLabel, accountCount) => {
                  setState((prev) => ({
                    ...prev,
                    selectedTemplate: templateId,
                    templateLabel,
                    templateAccountCount: accountCount,
                    // Reset mapping if template changes
                    mappingCompleted: templateId === prev.selectedTemplate ? prev.mappingCompleted : false,
                  }))
                  markCompleted(3, 4)
                }}
                onBack={goBack}
              />
            )}

            {state.currentStep === 4 && (
              <Step3AccountMapping
                onComplete={() => {
                  setState((prev) => ({ ...prev, mappingCompleted: true }))
                  markCompleted(4, 5)
                }}
                onBack={goBack}
              />
            )}

            {state.currentStep === 5 && (
              <Step4MasterData
                onComplete={(masterData) => {
                  setState((prev) => ({ ...prev, masterData }))
                  markCompleted(5, 6)
                }}
                onBack={goBack}
              />
            )}

            {state.currentStep === 6 && (
              <Step5OpeningBalance
                onComplete={(skipped) => {
                  setState((prev) => ({ ...prev, openingBalanceSkipped: skipped }))
                  markCompleted(6, 7)
                }}
                onBack={goBack}
              />
            )}

            {state.currentStep === 7 && (
              <Step6Complete
                summary={{
                  templateLabel: state.templateLabel,
                  accountCount: state.templateAccountCount,
                  warehouseCount: state.masterData.warehouses.length,
                  unitCount: state.masterData.units.length,
                  paymentTermCount: state.masterData.paymentTerms.length,
                  openingBalanceSkipped: state.openingBalanceSkipped,
                }}
                onBack={goBack}
              />
            )}
          </div>
        </main>
      </div>

      <AlertDialog open={cancelOpen}>
        <AlertDialogContent className="max-h-[calc(100dvh-48px)] max-w-[420px] overflow-y-auto rounded-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-semibold text-[#24323a]">
              Batalkan setup dan pilih perusahaan lain?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-1 text-left">
              <span className="block text-[14px] text-[#64748b]">
                Langkah yang sudah Anda simpan tetap tersimpan — setup bisa dilanjutkan lagi
                kapan saja dari langkah terakhir.
              </span>
              <span className="mt-1 block text-[13px] text-[#94a3b8]">
                Isian pada langkah ini yang belum disimpan akan hilang.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-1 gap-2 sm:space-x-0">
            <AlertDialogCancel
              disabled={isBusy}
              onClick={() => setCancelOpen(false)}
              className="h-8 border-[#d9e2e5] text-[13px] text-[#64748b] hover:bg-[#f8fbfc]"
            >
              Lanjutkan Setup
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={requestCloseDatabase}
              disabled={isBusy}
              className="h-8 bg-[#326273] px-4 text-[13px] text-white hover:bg-[#264d5b]"
            >
              Ya, Pilih Perusahaan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
