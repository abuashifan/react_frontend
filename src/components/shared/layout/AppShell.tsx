import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTabStore } from '@/stores/useTabStore'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionWarningDialog } from '@/components/shared/feedback/SessionWarningDialog'
import { Topbar } from './Topbar'
import { RibbonPanel } from './RibbonPanel'
import { PrimaryTabs } from './PrimaryTabs'
import { SecondaryTabs } from './SecondaryTabs'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const {
    isRibbonOpen,
    primaryTabs,
    activePrimaryTabId,
    activeSecondaryTabId,
    closeRibbon,
    getActiveContentPath,
  } = useTabStore()
  const { isWarningOpen, secondsRemaining, handleContinue, doLogout } = useSessionTimeout()

  // Router mengikuti tab state — Zustand adalah satu-satunya sumber kebenaran
  useEffect(() => {
    navigate(getActiveContentPath(), { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePrimaryTabId, activeSecondaryTabId])

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
