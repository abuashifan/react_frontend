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
  closeCompany: () => void
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
          // `activeCompanyId` sengaja direset di sini juga (bukan cuma di
          // logout()/closeCompany()): field ini tersimpan permanen di
          // localStorage lewat persist, jadi tanpa ini, login baru — akun
          // lain di browser yang sama, atau sesi lama yang belum sempat
          // logout — bisa mewarisi id perusahaan dari sesi sebelumnya.
          // ProtectedRoute lalu menganggap sudah ada perusahaan aktif dan
          // tidak pernah mengarahkan ke /select-company, padahal akun yang
          // baru login ini belum tentu punya akses ke perusahaan itu sama
          // sekali.
          activeCompanyId: null,
          rememberMe,
        })
        if (!rememberMe) {
          sessionStorage.setItem('auth-session', '1')
        }
      },

      setCompanies: (companies) => set({ companies }),

      setPermissions: (permissions) => set({ permissions, permissionsLoaded: true }),

      setActiveCompany: (companyId) => set({ activeCompanyId: companyId }),

      /**
       * Tutup database perusahaan aktif tanpa mengakhiri sesi login.
       *
       * `token`, `user`, dan daftar `companies` dipertahankan supaya user langsung
       * mendarat di halaman pemilih perusahaan tanpa login ulang. `permissions`
       * DIBUANG karena hak akses diberikan per perusahaan (lihat
       * `authApi.permissions()` yang dipanggil setiap kali perusahaan dipilih) —
       * kalau ditinggalkan, hak akses perusahaan lama masih menempel di layar.
       *
       * Jangan panggil langsung dari komponen; pakai `closeDatabase()` di
       * `lib/companySession.ts` supaya store perusahaan dan registry form ikut
       * dibersihkan.
       */
      closeCompany: () =>
        set({
          activeCompanyId: null,
          permissions: [],
          permissionsLoaded: false,
        }),

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
