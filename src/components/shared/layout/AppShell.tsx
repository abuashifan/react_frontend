import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTabStore } from '@/stores/useTabStore'
import { MODULE_MAP } from '@/router/moduleConfig'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionWarningDialog } from '@/components/shared/feedback/SessionWarningDialog'
import { Topbar } from './Topbar'
import { RibbonPanel } from './RibbonPanel'
import { PrimaryTabs } from './PrimaryTabs'
import { SecondaryTabs } from './SecondaryTabs'
import { MobileNav } from './MobileNav'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useViewMode } from '@/hooks/useViewMode'

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
  const isMobile = useIsMobile()
  const { isFormView } = useViewMode()
  const { secondaryTabs } = useTabStore()

  // Router mengikuti tab state — Zustand adalah satu-satunya sumber kebenaran
  useEffect(() => {
    navigate(getActiveContentPath(), { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePrimaryTabId, activeSecondaryTabId])

  const isDashboard = activePrimaryTabId === 'dashboard'
  // HP: deretan tab primer diganti sheet "Tab" di navigasi bawah; tab sekunder hanya tampil
  // saat ada lebih dari satu (daftar + formulir) supaya jalan kembali ke daftar tetap ada.
  const mobileSecondaryCount = activePrimaryTabId ? (secondaryTabs[activePrimaryTabId]?.length ?? 0) : 0
  const showPrimaryTabs = !isMobile && primaryTabs.length > 0
  const showSecondaryTabs = !!activePrimaryTabId && !isDashboard && primaryTabs.length > 0 && (!isMobile || mobileSecondaryCount > 1)
  const showMobileNav = isMobile && !isFormView

  // Ribbon is an overlay, so tabs and content always use the same top offsets.
  const primaryTabsTop = 52
  const secondaryTabsTop = isMobile ? 52 : 52 + 36

  // Content region starts after fixed chrome and owns the remaining viewport height.
  const secondaryTabsH = showSecondaryTabs ? 32 : 0
  const contentChromeTop = isMobile ? 52 + secondaryTabsH : 52 + 36 + (isDashboard ? 0 : 32)

  // Modul ber-`flushContent` (mis. Laporan) memasang toolbar sendiri tepat di bawah
  // baris tab, jadi jarak kanvas dihilangkan supaya toolbar menyatu dengan tab.
  const activeTab = primaryTabs.find((tab) => tab.id === activePrimaryTabId)
  const flushContent = !!(activeTab && MODULE_MAP[activeTab.module]?.flushContent)
  const contentTop = flushContent || isMobile
    ? `${contentChromeTop}px`
    : `calc(${contentChromeTop}px + var(--shell-content-gap-current))`

  return (
    <div className="h-dvh overflow-hidden bg-canvas">
      <Topbar />
      {!isMobile && isRibbonOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 top-[52px] z-[59] cursor-default bg-transparent"
          onClick={closeRibbon}
        />
      )}
      {!isMobile && <RibbonPanel />}
      {showPrimaryTabs && <PrimaryTabs top={primaryTabsTop} />}
      {showSecondaryTabs && <SecondaryTabs top={secondaryTabsTop} />}

      {/* Content viewport — page layouts define their own internal scroll regions. */}
      <main
        className="fixed left-0 right-0 min-h-0 overflow-hidden"
        style={{ top: contentTop, bottom: showMobileNav ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : 0 }}
      >
        {children}
      </main>

      {showMobileNav && <MobileNav />}

      <SessionWarningDialog
        open={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onContinue={handleContinue}
        onLogout={doLogout}
      />
    </div>
  )
}
