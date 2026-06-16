import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTabStore } from '@/stores/useTabStore'
import type { ModuleKey } from '@/stores/useTabStore'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionWarningDialog } from '@/components/shared/feedback/SessionWarningDialog'
import { Topbar } from './Topbar'
import { RibbonPanel } from './RibbonPanel'
import { PrimaryTabs } from './PrimaryTabs'
import { SecondaryTabs } from './SecondaryTabs'
import { detectModuleFromPath } from '@/router/moduleConfig'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const {
    activeModule,
    isRibbonOpen,
    primaryTabs,
    activePrimaryTabId,
    setActiveModule,
    setActivePrimaryTab,
    closeRibbon,
  } = useTabStore()
  const { isWarningOpen, secondsRemaining, handleContinue, doLogout } = useSessionTimeout()

  useEffect(() => {
    if (location.pathname === '/') {
      setActivePrimaryTab('dashboard')
    }
  }, [location.pathname, setActivePrimaryTab])

  useEffect(() => {
    if (location.pathname === '/') return
    const detected = detectModuleFromPath(location.pathname)
    if (!activeModule && detected) setActiveModule(detected as ModuleKey)
  }, [activeModule, location.pathname, setActiveModule])

  const showPrimaryTabs = primaryTabs.length > 0
  const isDashboard = activePrimaryTabId === 'dashboard'
  const showSecondaryTabs = !!activePrimaryTabId && !isDashboard && showPrimaryTabs

  // Ribbon is an overlay, so tabs and content always use the same top offsets.
  const primaryTabsTop = 52
  const secondaryTabsTop = 52 + 36

  // Content region starts after fixed chrome and owns the remaining viewport height.
  const secondaryTabsH = isDashboard ? 0 : 32
  const contentChromeTop = 52 + 36 + secondaryTabsH
  const contentTop = `calc(${contentChromeTop}px + var(--shell-content-gap-current))`

  return (
    <div className="h-dvh overflow-hidden bg-canvas">
      <Topbar />
      {isRibbonOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 top-[52px] z-[59] cursor-default bg-transparent"
          onClick={closeRibbon}
        />
      )}
      <RibbonPanel />
      {showPrimaryTabs && <PrimaryTabs top={primaryTabsTop} />}
      {showSecondaryTabs && <SecondaryTabs top={secondaryTabsTop} />}

      {/* Content viewport — page layouts define their own internal scroll regions. */}
      <main
        className="fixed left-0 right-0 bottom-0 min-h-0 overflow-hidden"
        style={{ top: contentTop }}
      >
        {children}
      </main>

      <SessionWarningDialog
        open={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onContinue={handleContinue}
        onLogout={doLogout}
      />
    </div>
  )
}
