import { cn } from '@/lib/utils'

export type StepStatus = 'completed' | 'active' | 'pending' | 'incomplete'

const STEP_ICONS: Record<StepStatus, string> = {
  completed: '✅',
  active: '▶',
  pending: '○',
  incomplete: '⚠️',
}

const STEP_STYLES: Record<StepStatus, string> = {
  completed: 'text-[#065F46] font-medium',
  active: 'text-[#5c9ead] font-semibold',
  pending: 'text-[#64748b]',
  incomplete: 'text-amber-600 font-medium',
}

export interface WizardStep {
  number: number
  title: string
  subtitle?: string
  status: StepStatus
}

interface WizardSidebarProps {
  steps: WizardStep[]
  onNavigate: (step: number) => void
  canNavigateTo: (step: number) => boolean
}

export function WizardSidebar({ steps, onNavigate, canNavigateTo }: WizardSidebarProps) {
  return (
    <aside className="w-[220px] shrink-0 border-r border-[#d9e2e5] bg-[#f8fafc] flex flex-col">
      <div className="p-5 border-b border-[#d9e2e5]">
        <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide">Setup Perusahaan</p>
      </div>

      <nav className="flex-1 py-2">
        {steps.map((step) => {
          const canClick = canNavigateTo(step.number)
          return (
            <button
              key={step.number}
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onNavigate(step.number)}
              className={cn(
                'flex items-start gap-3 w-full px-5 py-3.5 text-left transition-colors',
                step.status === 'active' && 'bg-[#e8f4f6]',
                canClick && step.status !== 'active' && 'hover:bg-[#f1f5f9]',
                !canClick && 'cursor-not-allowed opacity-60',
              )}
            >
              <span className="text-base leading-none mt-0.5">{STEP_ICONS[step.status]}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[12px] leading-snug', STEP_STYLES[step.status])}>
                  {step.number}. {step.title}
                </p>
                {step.subtitle && (
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{step.subtitle}</p>
                )}
              </div>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
