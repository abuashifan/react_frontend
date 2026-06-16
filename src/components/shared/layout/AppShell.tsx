import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTabStore } from '@/stores/useTabStore'
import type { ModuleKey } from '@/stores/useTabStore'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionWarningDialog } from '@/components/shared/feedback/SessionWarningDialog'
import { Topbar } from './Topbar'
import { RibbonPanel } from './RibbonPanel'
import { PrimaryTabs } from './PrimaryTabs'
import { SecondaryTabs } from './SecondaryTabs'
import { detectModuleFromPath, findRibbonItemByPath } from '@/router/moduleConfig'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    activeModule,
    isRibbonOpen,
    primaryTabs,
    activePrimaryTabId,
    secondaryTabs,
    activeSecondaryTabId,
    setActiveModule,
    setActivePrimaryTab,
    closeRibbon,
    openPrimaryTab,
    openSecondaryTab,
    setActiveSecondaryTab,
  } = useTabStore()
  const { isWarningOpen, secondsRemaining, handleContinue, doLogout } = useSessionTimeout()

  useEffect(() => {
    if (location.pathname !== '/') return

    if (!activePrimaryTabId || activePrimaryTabId === 'dashboard') {
      setActivePrimaryTab('dashboard')
      return
    }

    const activePrimaryTab = primaryTabs.find((tab) => tab.id === activePrimaryTabId)
    const activeSecondaryId = activeSecondaryTabId[activePrimaryTabId]
    const activeSecondaryTab = (secondaryTabs[activePrimaryTabId] ?? []).find(
      (tab) => tab.id === activeSecondaryId,
    )
    const activePath = activeSecondaryTab?.path ?? activePrimaryTab?.path

    if (activePath && activePath !== '/') {
      navigate(activePath, { replace: true })
    }
  }, [
    activePrimaryTabId,
    activeSecondaryTabId,
    location.pathname,
    navigate,
    primaryTabs,
    secondaryTabs,
    setActivePrimaryTab,
  ])

  useEffect(() => {
    if (location.pathname === '/') return
    const detected = detectModuleFromPath(location.pathname)
    if (!activeModule && detected) setActiveModule(detected as ModuleKey)
  }, [activeModule, location.pathname, setActiveModule])

  useEffect(() => {
    if (location.pathname === '/') return

    const match = findRibbonItemByPath(location.pathname)
    if (!match) return

    const moduleId = match.module.id as ModuleKey
    const primaryTabId = `${moduleId}-${match.item.id}`
    const primaryDidOpen = openPrimaryTab({
      id: primaryTabId,
      menuKey: match.item.id,
      label: match.item.label,
      module: moduleId,
      path: match.item.path,
    })

    if (!primaryDidOpen) return

    const pathWithSearch = `${location.pathname}${location.search}`
    const isListPath = location.pathname === match.item.path

    if (isListPath) {
      openSecondaryTab(primaryTabId, {
        id: 'list',
        label: 'Daftar',
        type: 'list',
        path: match.item.path,
        pinned: true,
      })
      setActiveSecondaryTab(primaryTabId, 'list')
      return
    }

    const lastSegment = location.pathname.split('/').filter(Boolean).at(-1)
    const isCreatePath = lastSegment === 'create'
    const secondaryId = isCreatePath ? 'new' : `form:${location.pathname}`

    openSecondaryTab(primaryTabId, {
      id: secondaryId,
      label: isCreatePath ? 'Baru' : (lastSegment ?? 'Detail'),
      type: 'form',
      path: pathWithSearch,
      pinned: false,
    })
  }, [
    location.pathname,
    location.search,
    openPrimaryTab,
    openSecondaryTab,
    setActiveSecondaryTab,
  ])

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
