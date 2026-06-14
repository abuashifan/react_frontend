import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTabStore } from '@/stores/useTabStore'
import type { ModuleKey } from '@/stores/useTabStore'
import { useViewMode } from '@/hooks/useViewMode'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionWarningDialog } from '@/components/shared/feedback/SessionWarningDialog'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { FixedBottomBar } from './FixedBottomBar'
import { WorkspaceLayout } from './WorkspaceLayout'
import { FormLayout } from './FormLayout'
import { Topbar } from './Topbar'
import { RibbonPanel } from './RibbonPanel'
import { PrimaryTabs } from './PrimaryTabs'
import { SecondaryTabs } from './SecondaryTabs'
import { detectModuleFromPath } from '@/router/moduleConfig'

interface AppShellProps {
  children: React.ReactNode
}

function ShellTabContent({ fallback }: { fallback: React.ReactNode }) {
  const {
    activePrimaryTabId,
    openSecondaryTab,
  } = useTabStore()
  const { activePrimaryTab, activeSecondaryTab, isDashboard, isFormView } = useViewMode()

  if (!activePrimaryTab) return <>{fallback}</>
  if (isDashboard) return <>{fallback}</>

  if (isFormView && activeSecondaryTab) {
    return (
      <FormLayout
        title={activePrimaryTab.label}
        documentNumber={activeSecondaryTab.label}
        status="draft"
        bottomBar={
          <FixedBottomBar left={<span className="font-semibold text-[#24323a]">{activeSecondaryTab.label}</span>}>
            <Button type="button" size="sm" className="h-8 bg-[#e39774] text-white hover:bg-[#d4845e]">
              Simpan
            </Button>
          </FixedBottomBar>
        }
      >
        <EmptyState
          title={`${activeSecondaryTab.label}`}
          description="Belum ada data untuk ditampilkan."
        />
      </FormLayout>
    )
  }

  return (
    <WorkspaceLayout
      title={activePrimaryTab.label}
      action={
        <Button
          type="button"
          size="sm"
          onClick={() => {
            if (!activePrimaryTabId) return
            openSecondaryTab(activePrimaryTabId, {
              id: `new-${activePrimaryTab.id}`,
              label: 'Baru',
              type: 'form',
              path: `${activePrimaryTab.path}/create`,
              pinned: false,
            })
          }}
          className="h-8 bg-[#e39774] text-white hover:bg-[#d4845e]"
        >
          Baru
        </Button>
      }
    >
      <EmptyState
        title={activePrimaryTab.label}
        description="Belum ada data untuk ditampilkan."
      />
    </WorkspaceLayout>
  )
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
        <ShellTabContent fallback={children} />
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
