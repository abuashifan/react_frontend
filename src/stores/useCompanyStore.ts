import { create } from 'zustand'
import type { Company, CompanySettings } from '@/types/auth.types'

interface CompanyState {
  activeCompany: Company | null
  settings: CompanySettings | null

  setActiveCompany: (company: Company) => void
  setSettings: (settings: CompanySettings) => void
  clearCompany: () => void
}

export const useCompanyStore = create<CompanyState>()((set) => ({
  activeCompany: null,
  settings: null,

  setActiveCompany: (company) =>
    set({ activeCompany: company, settings: company.settings }),

  setSettings: (settings) => set({ settings }),

  clearCompany: () => set({ activeCompany: null, settings: null }),
}))
