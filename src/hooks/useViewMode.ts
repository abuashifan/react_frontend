import { useTabStore } from '@/stores/useTabStore'

/** Derives current shell view mode from active primary and secondary tabs. */
export function useViewMode() {
  const { primaryTabs, activePrimaryTabId, secondaryTabs, activeSecondaryTabId } = useTabStore()

  const activePrimaryTab = primaryTabs.find((tab) => tab.id === activePrimaryTabId)
  const activeSecondaryId = activePrimaryTabId ? activeSecondaryTabId[activePrimaryTabId] : null
  const activeSecondaryTab = activePrimaryTabId
    ? secondaryTabs[activePrimaryTabId]?.find((tab) => tab.id === activeSecondaryId)
    : undefined

  const isDashboard = activePrimaryTabId === 'dashboard'
  const isFormView = !isDashboard && activeSecondaryTab?.type === 'form'
  const isListView = !isDashboard && (activeSecondaryTab?.type === 'list' || !activeSecondaryTab)

  return {
    activePrimaryTab,
    activeSecondaryTab,
    isDashboard,
    isFormView,
    isListView,
  }
}
