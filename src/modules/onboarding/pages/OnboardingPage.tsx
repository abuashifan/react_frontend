import { useState } from 'react'
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
function readPersistedState(): WizardState {
  try {
    const raw = sessionStorage.getItem(WIZARD_STATE_KEY)
    if (!raw) return INITIAL_STATE
    return { ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<WizardState>) }
  } catch {
    return INITIAL_STATE
  }
}

export function OnboardingPage() {
  const [state, setStateRaw] = useState<WizardState>(readPersistedState)

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
      <header className="h-[52px] bg-[#326273] flex items-center px-6 shrink-0">
        <span className="text-white font-semibold text-[15px]">🌊 Seaside Escape ERP — Setup Perusahaan Baru</span>
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
    </div>
  )
}
