import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ModuleKey =
  | 'dashboard'
  | 'master-data'
  | 'accounting'
  | 'cash-bank'
  | 'sales'
  | 'purchase'
  | 'inventory'
  | 'fixed-assets'
  | 'reports'
  | 'settings'

export interface PrimaryTab {
  id: string
  menuKey: string
  label: string
  module: ModuleKey
  path: string
}

export interface SecondaryTab {
  id: string
  label: string
  type: 'list' | 'form'
  path: string
  pinned: boolean
  formState?: Record<string, unknown>
}

interface TabState {
  activeModule: ModuleKey | null
  isRibbonOpen: boolean
  isSidebarCollapsed: boolean
  primaryTabs: PrimaryTab[]
  activePrimaryTabId: string | null
  secondaryTabs: Record<string, SecondaryTab[]>
  activeSecondaryTabId: Record<string, string>
}

interface TabActions {
  setActiveModule: (module: ModuleKey | null) => void
  openRibbon: () => void
  closeRibbon: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  openPrimaryTab: (tab: PrimaryTab) => boolean
  closePrimaryTab: (tabId: string) => void
  setActivePrimaryTab: (tabId: string) => void
  openSecondaryTab: (primaryTabId: string, tab: SecondaryTab) => void
  closeSecondaryTab: (primaryTabId: string, secondaryTabId: string) => void
  setActiveSecondaryTab: (primaryTabId: string, secondaryTabId: string) => void
  updateFormState: (
    primaryTabId: string,
    secondaryTabId: string,
    formState: Record<string, unknown>,
  ) => void
  clearFormState: (primaryTabId: string, secondaryTabId: string) => void
  getActivePrimaryTab: () => PrimaryTab | undefined
  getActiveSecondaryTab: (primaryTabId?: string) => SecondaryTab | undefined
  getActiveContentPath: () => string
}

const MAX_PRIMARY_TABS = 10
export const DASHBOARD_TAB: PrimaryTab = {
  id: 'dashboard',
  menuKey: 'dashboard',
  label: 'Dashboard',
  module: 'dashboard',
  path: '/',
}

function getActiveModuleForTab(tab: PrimaryTab | null): ModuleKey | null {
  if (!tab || tab.id === DASHBOARD_TAB.id) return null
  return tab.module
}

function createListTab(tab: PrimaryTab): SecondaryTab {
  return {
    id: 'list',
    label: 'Daftar',
    type: 'list',
    path: tab.path,
    pinned: true,
  }
}

export const useTabStore = create<TabState & TabActions>()(
  persist(
    (set, get) => ({
      activeModule: null,
      isRibbonOpen: false,
      isSidebarCollapsed: false,
      primaryTabs: [DASHBOARD_TAB],
      activePrimaryTabId: DASHBOARD_TAB.id,
      secondaryTabs: {},
      activeSecondaryTabId: {},

      setActiveModule: (module) => set({ activeModule: module }),

      openRibbon: () => set({ isRibbonOpen: true }),

      closeRibbon: () => set({ isRibbonOpen: false }),

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      openPrimaryTab: (tab) => {
        const { primaryTabs } = get()
        const existing = primaryTabs.find((primaryTab) => primaryTab.id === tab.id)

        if (existing) {
          set({
            activeModule: getActiveModuleForTab(existing),
            isRibbonOpen: false,
            activePrimaryTabId: existing.id,
          })
          return true
        }

        if (primaryTabs.length >= MAX_PRIMARY_TABS) return false

        const listTab = createListTab(tab)

        set((state) => ({
          activeModule: getActiveModuleForTab(tab),
          primaryTabs: [...state.primaryTabs, tab],
          activePrimaryTabId: tab.id,
          secondaryTabs: {
            ...state.secondaryTabs,
            [tab.id]: [listTab],
          },
          activeSecondaryTabId: {
            ...state.activeSecondaryTabId,
            [tab.id]: listTab.id,
          },
        }))
        return true
      },

      closePrimaryTab: (tabId) => {
        if (tabId === DASHBOARD_TAB.id) return

        set((state) => {
          const closingIndex = state.primaryTabs.findIndex((tab) => tab.id === tabId)
          const nextTabs = state.primaryTabs.some((tab) => tab.id === DASHBOARD_TAB.id)
            ? state.primaryTabs.filter((tab) => tab.id !== tabId)
            : [DASHBOARD_TAB, ...state.primaryTabs.filter((tab) => tab.id !== tabId)]
          const nextSecondaryTabs = { ...state.secondaryTabs }
          const nextActiveSecondary = { ...state.activeSecondaryTabId }
          delete nextSecondaryTabs[tabId]
          delete nextActiveSecondary[tabId]

          const fallbackTab =
            state.activePrimaryTabId === tabId
              ? (nextTabs[Math.max(closingIndex - 1, 0)] ?? nextTabs[0] ?? null)
              : (nextTabs.find((tab) => tab.id === state.activePrimaryTabId) ?? null)

          return {
            activeModule: getActiveModuleForTab(fallbackTab),
            isRibbonOpen: false,
            primaryTabs: nextTabs,
            activePrimaryTabId: fallbackTab?.id ?? DASHBOARD_TAB.id,
            secondaryTabs: nextSecondaryTabs,
            activeSecondaryTabId: nextActiveSecondary,
          }
        })
      },

      setActivePrimaryTab: (tabId) => {
        const tab = get().primaryTabs.find((primaryTab) => primaryTab.id === tabId)
        if (!tab) return
        set({
          activeModule: getActiveModuleForTab(tab),
          isRibbonOpen: false,
          activePrimaryTabId: tabId,
        })
      },

      openSecondaryTab: (primaryTabId, tab) => {
        const tabs = get().secondaryTabs[primaryTabId] ?? []
        const existing = tabs.find((secondaryTab) => secondaryTab.id === tab.id)

        if (existing) {
          set((state) => ({
            activeSecondaryTabId: {
              ...state.activeSecondaryTabId,
              [primaryTabId]: existing.id,
            },
          }))
          return
        }

        set((state) => ({
          secondaryTabs: {
            ...state.secondaryTabs,
            [primaryTabId]: [...(state.secondaryTabs[primaryTabId] ?? []), tab],
          },
          activeSecondaryTabId: {
            ...state.activeSecondaryTabId,
            [primaryTabId]: tab.id,
          },
        }))
      },

      closeSecondaryTab: (primaryTabId, secondaryTabId) => {
        set((state) => {
          const tabs = state.secondaryTabs[primaryTabId] ?? []
          const closingTab = tabs.find((tab) => tab.id === secondaryTabId)
          if (closingTab?.pinned) return state

          const closingIndex = tabs.findIndex((tab) => tab.id === secondaryTabId)
          const nextTabs = tabs.filter((tab) => tab.id !== secondaryTabId)
          const fallbackId =
            nextTabs[Math.max(closingIndex - 1, 0)]?.id ??
            nextTabs.find((tab) => tab.pinned)?.id ??
            'list'

          return {
            secondaryTabs: { ...state.secondaryTabs, [primaryTabId]: nextTabs },
            activeSecondaryTabId: {
              ...state.activeSecondaryTabId,
              [primaryTabId]:
                state.activeSecondaryTabId[primaryTabId] === secondaryTabId
                  ? fallbackId
                  : state.activeSecondaryTabId[primaryTabId],
            },
          }
        })
      },

      setActiveSecondaryTab: (primaryTabId, secondaryTabId) =>
        set((state) => ({
          activeSecondaryTabId: {
            ...state.activeSecondaryTabId,
            [primaryTabId]: secondaryTabId,
          },
        })),

      updateFormState: (primaryTabId, secondaryTabId, formState) =>
        set((state) => ({
          secondaryTabs: {
            ...state.secondaryTabs,
            [primaryTabId]: (state.secondaryTabs[primaryTabId] ?? []).map((tab) =>
              tab.id === secondaryTabId ? { ...tab, formState } : tab,
            ),
          },
        })),

      clearFormState: (primaryTabId, secondaryTabId) =>
        set((state) => ({
          secondaryTabs: {
            ...state.secondaryTabs,
            [primaryTabId]: (state.secondaryTabs[primaryTabId] ?? []).map((tab) =>
              tab.id === secondaryTabId ? { ...tab, formState: undefined } : tab,
            ),
          },
        })),

      getActivePrimaryTab: () => {
        const { primaryTabs, activePrimaryTabId } = get()
        return primaryTabs.find((tab) => tab.id === activePrimaryTabId)
      },

      getActiveSecondaryTab: (primaryTabId) => {
        const { activePrimaryTabId, secondaryTabs, activeSecondaryTabId } = get()
        const resolvedPrimaryId = primaryTabId ?? activePrimaryTabId
        if (!resolvedPrimaryId) return undefined
        const tabs = secondaryTabs[resolvedPrimaryId] ?? []
        const activeId = activeSecondaryTabId[resolvedPrimaryId]
        return tabs.find((tab) => tab.id === activeId)
      },

      getActiveContentPath: () => {
        const { activePrimaryTabId, primaryTabs, secondaryTabs, activeSecondaryTabId } = get()
        if (!activePrimaryTabId || activePrimaryTabId === 'dashboard') return '/'
        const activeSecId = activeSecondaryTabId[activePrimaryTabId]
        const activeSec = (secondaryTabs[activePrimaryTabId] ?? []).find((t) => t.id === activeSecId)
        const activePrimary = primaryTabs.find((t) => t.id === activePrimaryTabId)
        return activeSec?.path ?? activePrimary?.path ?? '/'
      },
    }),
    {
      name: 'seaside-erp-tabs',
      version: 3,
      storage: createJSONStorage(() => sessionStorage),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return {
            activeModule: null,
            isRibbonOpen: false,
            isSidebarCollapsed: false,
            primaryTabs: [DASHBOARD_TAB],
            activePrimaryTabId: DASHBOARD_TAB.id,
            secondaryTabs: {},
            activeSecondaryTabId: {},
          }
        }

        const state = persistedState as Partial<TabState>
        const tabs = state.primaryTabs ?? []
        const primaryTabs = tabs.some((tab) => tab.id === DASHBOARD_TAB.id)
          ? tabs
          : [DASHBOARD_TAB, ...tabs]
        const activePrimaryTabId = state.activePrimaryTabId ?? DASHBOARD_TAB.id
        const activeTab = primaryTabs.find((tab) => tab.id === activePrimaryTabId) ?? DASHBOARD_TAB

        return {
          ...state,
          activeModule: getActiveModuleForTab(activeTab),
          isRibbonOpen: false,
          primaryTabs,
          activePrimaryTabId: activeTab.id,
          secondaryTabs: state.secondaryTabs ?? {},
          activeSecondaryTabId: state.activeSecondaryTabId ?? {},
        }
      },
    },
  ),
)
