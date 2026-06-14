import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Company } from '@/types/auth.types'

interface AuthState {
  token: string | null
  user: User | null
  permissions: string[]
  permissionsLoaded: boolean
  companies: Company[]
  activeCompanyId: number | null
  rememberMe: boolean

  setAuth: (
    token: string,
    user: User,
    companies?: Company[],
    permissions?: string[],
    rememberMe?: boolean,
  ) => void
  setCompanies: (companies: Company[]) => void
  setPermissions: (permissions: string[]) => void
  setActiveCompany: (companyId: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      permissions: [],
      permissionsLoaded: false,
      companies: [],
      activeCompanyId: null,
      rememberMe: false,

      setAuth: (token, user, companies = [], permissions = [], rememberMe = false) => {
        set({
          token,
          user,
          permissions: permissions.length > 0 ? permissions : user.permissions ?? [],
          permissionsLoaded: permissions.length > 0 || Array.isArray(user.permissions),
          companies,
          rememberMe,
        })
        if (!rememberMe) {
          sessionStorage.setItem('auth-session', '1')
        }
      },

      setCompanies: (companies) => set({ companies }),

      setPermissions: (permissions) => set({ permissions, permissionsLoaded: true }),

      setActiveCompany: (companyId) => set({ activeCompanyId: companyId }),

      logout: () => {
        sessionStorage.removeItem('auth-session')
        set({
          token: null,
          user: null,
          permissions: [],
          permissionsLoaded: false,
          companies: [],
          activeCompanyId: null,
          rememberMe: false,
        })
      },
    }),
    {
      name: 'seaside-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
        permissionsLoaded: state.permissionsLoaded,
        companies: state.companies,
        activeCompanyId: state.activeCompanyId,
        rememberMe: state.rememberMe,
      }),
    },
  ),
)
