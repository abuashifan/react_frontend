import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PrimaryTab {
  id: string
  menuKey: string
  label: string
  module: string
}

export interface SecondaryTab {
  id: string
  label: string
  type: 'list' | 'form'
  pinned?: boolean
  formState?: Record<string, unknown>
}

interface TabState {
  primaryTabs: PrimaryTab[]
  activePrimaryTabId: string | null
  secondaryTabs: Record<string, SecondaryTab[]>
  activeSecondaryTabId: Record<string, string>
}

interface TabActions {
  // Returns new tab id on success, null if at max capacity
  openPrimaryTab: (tab: Omit<PrimaryTab, 'id'>) => string | null
  closePrimaryTab: (tabId: string) => void
  activatePrimaryTab: (tabId: string) => void
  openSecondaryTab: (primaryTabId: string, tab: Omit<SecondaryTab, 'id'>) => void
  closeSecondaryTab: (primaryTabId: string, tabId: string) => void
  activateSecondaryTab: (primaryTabId: string, tabId: string) => void
  updateFormState: (primaryTabId: string, tabId: string, state: Record<string, unknown>) => void
  getActiveSecondaryTab: (primaryTabId: string) => SecondaryTab | undefined
}

const MAX_PRIMARY_TABS = 10

function genId() {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useTabStore = create<TabState & TabActions>()(
  persist(
    (set, get) => ({
      primaryTabs: [],
      activePrimaryTabId: null,
      secondaryTabs: {},
      activeSecondaryTabId: {},

      openPrimaryTab: (tabData) => {
        const { primaryTabs } = get()

        // Reuse existing tab for the same menu
        const existing = primaryTabs.find((t) => t.menuKey === tabData.menuKey)
        if (existing) {
          set({ activePrimaryTabId: existing.id })
          return existing.id
        }

        if (primaryTabs.length >= MAX_PRIMARY_TABS) return null

        const id = genId()
        const listTab: SecondaryTab = {
          id: genId(),
          label: 'Daftar',
          type: 'list',
          pinned: true,
        }

        set((s) => ({
          primaryTabs: [...s.primaryTabs, { ...tabData, id }],
          activePrimaryTabId: id,
          secondaryTabs: { ...s.secondaryTabs, [id]: [listTab] },
          activeSecondaryTabId: { ...s.activeSecondaryTabId, [id]: listTab.id },
        }))
        return id
      },

      closePrimaryTab: (tabId) => {
        set((s) => {
          const filtered = s.primaryTabs.filter((t) => t.id !== tabId)
          const newSecondaryTabs = { ...s.secondaryTabs }
          delete newSecondaryTabs[tabId]
          const newActiveSecondary = { ...s.activeSecondaryTabId }
          delete newActiveSecondary[tabId]

          const newActivePrimary =
            s.activePrimaryTabId === tabId
              ? (filtered[filtered.length - 1]?.id ?? null)
              : s.activePrimaryTabId

          return {
            primaryTabs: filtered,
            activePrimaryTabId: newActivePrimary,
            secondaryTabs: newSecondaryTabs,
            activeSecondaryTabId: newActiveSecondary,
          }
        })
      },

      activatePrimaryTab: (tabId) => set({ activePrimaryTabId: tabId }),

      openSecondaryTab: (primaryTabId, tabData) => {
        const { secondaryTabs } = get()
        const tabs = secondaryTabs[primaryTabId] ?? []

        // Reuse existing tab by label+type
        const existing = tabs.find((t) => t.label === tabData.label && t.type === tabData.type)
        if (existing) {
          set((s) => ({
            activeSecondaryTabId: { ...s.activeSecondaryTabId, [primaryTabId]: existing.id },
          }))
          return
        }

        const id = genId()
        set((s) => ({
          secondaryTabs: {
            ...s.secondaryTabs,
            [primaryTabId]: [...(s.secondaryTabs[primaryTabId] ?? []), { ...tabData, id }],
          },
          activeSecondaryTabId: { ...s.activeSecondaryTabId, [primaryTabId]: id },
        }))
      },

      closeSecondaryTab: (primaryTabId, tabId) => {
        set((s) => {
          const tabs = s.secondaryTabs[primaryTabId] ?? []
          const filtered = tabs.filter((t) => t.id !== tabId)
          const listTab = filtered.find((t) => t.pinned)
          const wasActive = s.activeSecondaryTabId[primaryTabId] === tabId

          return {
            secondaryTabs: { ...s.secondaryTabs, [primaryTabId]: filtered },
            activeSecondaryTabId: {
              ...s.activeSecondaryTabId,
              [primaryTabId]: wasActive
                ? (listTab?.id ?? filtered[0]?.id ?? '')
                : s.activeSecondaryTabId[primaryTabId],
            },
          }
        })
      },

      activateSecondaryTab: (primaryTabId, tabId) =>
        set((s) => ({
          activeSecondaryTabId: { ...s.activeSecondaryTabId, [primaryTabId]: tabId },
        })),

      updateFormState: (primaryTabId, tabId, formState) =>
        set((s) => ({
          secondaryTabs: {
            ...s.secondaryTabs,
            [primaryTabId]: (s.secondaryTabs[primaryTabId] ?? []).map((t) =>
              t.id === tabId ? { ...t, formState } : t,
            ),
          },
        })),

      getActiveSecondaryTab: (primaryTabId) => {
        const { secondaryTabs, activeSecondaryTabId } = get()
        const tabs = secondaryTabs[primaryTabId] ?? []
        const activeId = activeSecondaryTabId[primaryTabId]
        return tabs.find((t) => t.id === activeId)
      },
    }),
    {
      name: 'seaside-erp-tabs',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
