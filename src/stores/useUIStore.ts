import { create } from 'zustand'

interface UIState {
  activeModule: string | null
  activeRibbonItem: string | null
  isRibbonCollapsed: boolean
  isSidebarCollapsed: boolean
  isFormView: boolean

  setActiveModule: (module: string | null) => void
  setActiveRibbonItem: (item: string | null) => void
  toggleRibbon: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setFormView: (value: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  activeModule: null,
  activeRibbonItem: null,
  isRibbonCollapsed: false,
  isSidebarCollapsed: false,
  isFormView: false,

  setActiveModule: (module) => set({ activeModule: module }),
  setActiveRibbonItem: (item) => set({ activeRibbonItem: item }),
  toggleRibbon: () => set((s) => ({ isRibbonCollapsed: !s.isRibbonCollapsed })),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setFormView: (value) => set({ isFormView: value }),
}))
