import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/useUIStore'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionWarningDialog } from '@/components/shared/feedback/SessionWarningDialog'
import { Topbar } from './Topbar'
import { RibbonPanel } from './RibbonPanel'
import { detectModuleFromPath } from '@/router/moduleConfig'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const { activeModule, isRibbonCollapsed, isFormView, setActiveModule } = useUIStore()
  const { isWarningOpen, secondsRemaining, handleContinue, doLogout } = useSessionTimeout()

  // Sync active module from URL on navigation
  useEffect(() => {
    const detected = detectModuleFromPath(location.pathname)
    setActiveModule(detected)
  }, [location.pathname, setActiveModule])

  const hasRibbon =
    !isFormView &&
    !!activeModule &&
    activeModule !== 'dashboard' &&
    !isRibbonCollapsed

  const topOffset = hasRibbon ? 'pt-[116px]' : 'pt-[52px]'

  return (
    <div className="min-h-screen bg-canvas">
      <Topbar />
      <RibbonPanel />

      <div className={cn('min-h-screen', topOffset)}>
        {children}
      </div>

      <SessionWarningDialog
        open={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onContinue={handleContinue}
        onLogout={doLogout}
      />
    </div>
  )
}
