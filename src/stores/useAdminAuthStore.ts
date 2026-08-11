import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AdminUser } from '@/types/admin.types'

interface AdminAuthState {
  token: string | null
  admin: AdminUser | null

  setAuth: (token: string, admin: AdminUser) => void
  logout: () => void
}

/**
 * Sesi admin aplikasi, sengaja terpisah dari `useAuthStore`.
 *
 * Kunci penyimpanannya berbeda supaya sesi admin dan sesi client tidak saling
 * menimpa, dan supaya token admin tidak pernah ikut terkirim oleh `http` yang
 * dipakai seluruh aplikasi client — token itu memang ditolak `company.access`
 * di backend, tapi lebih baik tidak pernah dikirim sama sekali.
 */
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,

      setAuth: (token, admin) => set({ token, admin }),

      logout: () => set({ token: null, admin: null }),
    }),
    {
      name: 'seaside-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, admin: state.admin }),
    },
  ),
)
