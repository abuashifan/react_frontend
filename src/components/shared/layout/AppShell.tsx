import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/useUIStore'
import { useTabStore } from '@/stores/useTabStore'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionWarningDialog } from '@/components/shared/feedback/SessionWarningDialog'
import { Topbar } from './Topbar'
import { RibbonPanel } from './RibbonPanel'
import { PrimaryTabs } from './PrimaryTabs'
import { SecondaryTabs } from './SecondaryTabs'
import { detectModuleFromPath, MODULE_MAP } from '@/router/moduleConfig'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const { activeModule, isRibbonCollapsed, isFormView, setActiveModule } = useUIStore()
  const { primaryTabs, activePrimaryTabId } = useTabStore()
  const { isWarningOpen, secondsRemaining, handleContinue, doLogout } = useSessionTimeout()

  useEffect(() => {
    const detected = detectModuleFromPath(location.pathname)
    setActiveModule(detected)
  }, [location.pathname, setActiveModule])

  // Ribbon is shown: not in form view, module has ribbon items, not collapsed
  const hasModuleRibbon =
    !!activeModule &&
    activeModule !== 'dashboard' &&
    (MODULE_MAP[activeModule]?.ribbonItems?.length ?? 0) > 0

  const ribbonH = !isFormView && hasModuleRibbon && !isRibbonCollapsed ? 64 : 0
  const showPrimaryTabs = primaryTabs.length > 0
  const showSecondaryTabs = !!activePrimaryTabId && showPrimaryTabs
  const primaryTabsH = showPrimaryTabs ? 36 : 0
  const secondaryTabsH = showSecondaryTabs ? 32 : 0

  // Dynamic top positions for each fixed zone
  const primaryTabsTop = 52 + ribbonH
  const secondaryTabsTop = primaryTabsTop + primaryTabsH

  // Content padding accounts for all fixed zones + 16px breathing room
  const contentPaddingTop = secondaryTabsTop + secondaryTabsH + 16

  return (
    <div className="h-dvh overflow-hidden bg-canvas">
      <Topbar />
      <RibbonPanel />
      {showPrimaryTabs && <PrimaryTabs top={primaryTabsTop} />}
      {showSecondaryTabs && <SecondaryTabs top={secondaryTabsTop} />}

      {/* Content scroll region — owns all vertical scroll */}
      <div
        className="h-full overflow-y-auto overflow-x-hidden"
        style={{ paddingTop: contentPaddingTop }}
      >
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
