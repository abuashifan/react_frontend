import { useState } from 'react'
import { WizardSidebar, type WizardStep, type StepStatus } from '../components/WizardSidebar'
import { Step1CompanyInfo } from '../components/steps/Step1CompanyInfo'
import { Step2TemplateCOA } from '../components/steps/Step2TemplateCOA'
import { Step3AccountMapping } from '../components/steps/Step3AccountMapping'
import { Step4MasterData } from '../components/steps/Step4MasterData'
import { Step5OpeningBalance } from '../components/steps/Step5OpeningBalance'
import { Step6Complete } from '../components/steps/Step6Complete'
import type { CompanyInfoValues } from '../schemas/companyInfoSchema'
import type { QuickAddItem } from '../components/MasterDataQuickAdd'
import { COA_TEMPLATES } from '../constants'

interface WizardState {
  currentStep: number
  visitedSteps: number[]
  completedSteps: number[]
  // Step data for summary and template change warning
  companyInfo: CompanyInfoValues | null
  selectedTemplate: string | null
  templateLabel: string | null
  mappingCompleted: boolean
  masterData: {
    warehouses: QuickAddItem[]
    units: QuickAddItem[]
    paymentTerms: QuickAddItem[]
  }
  openingBalanceSkipped: boolean
}

const STEP_TITLES = [
  { number: 1, title: 'Informasi Perusahaan' },
  { number: 2, title: 'Template COA' },
  { number: 3, title: 'Account Mapping' },
  { number: 4, title: 'Master Data Dasar' },
  { number: 5, title: 'Opening Balance', subtitle: 'Opsional' },
  { number: 6, title: 'Selesai' },
]

export function OnboardingPage() {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    visitedSteps: [1],
    completedSteps: [],
    companyInfo: null,
    selectedTemplate: null,
    templateLabel: null,
    mappingCompleted: false,
    masterData: { warehouses: [], units: [], paymentTerms: [] },
    openingBalanceSkipped: false,
  })

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

  const selectedTemplateDef = COA_TEMPLATES.find((t) => t.id === state.selectedTemplate)

  return (
    <div className="min-h-dvh bg-[#EFEFED] flex flex-col">
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
              <Step2TemplateCOA
                currentTemplate={state.selectedTemplate}
                mappingCompleted={state.mappingCompleted}
                onComplete={(templateId, templateLabel) => {
                  setState((prev) => ({
                    ...prev,
                    selectedTemplate: templateId,
                    templateLabel,
                    // Reset mapping if template changes
                    mappingCompleted: templateId === prev.selectedTemplate ? prev.mappingCompleted : false,
                  }))
                  markCompleted(2, 3)
                }}
                onBack={goBack}
              />
            )}

            {state.currentStep === 3 && (
              <Step3AccountMapping
                onComplete={() => {
                  setState((prev) => ({ ...prev, mappingCompleted: true }))
                  markCompleted(3, 4)
                }}
                onBack={goBack}
              />
            )}

            {state.currentStep === 4 && (
              <Step4MasterData
                onComplete={(masterData) => {
                  setState((prev) => ({ ...prev, masterData }))
                  markCompleted(4, 5)
                }}
                onBack={goBack}
              />
            )}

            {state.currentStep === 5 && (
              <Step5OpeningBalance
                onComplete={(skipped) => {
                  setState((prev) => ({ ...prev, openingBalanceSkipped: skipped }))
                  markCompleted(5, 6)
                }}
                onBack={goBack}
              />
            )}

            {state.currentStep === 6 && (
              <Step6Complete
                summary={{
                  templateLabel: state.templateLabel,
                  accountCount: selectedTemplateDef?.accountCount ?? 0,
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
