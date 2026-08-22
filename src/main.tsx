import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { router } from '@/router'
import { useAuthStore } from '@/stores/useAuthStore'
import { installCompanyScopeReset } from '@/lib/companyScope'
import './index.css'

// If user didn't check "remember me", clear auth when browser session ends
const { rememberMe, logout } = useAuthStore.getState()
if (!rememberMe && !sessionStorage.getItem('auth-session')) {
  logout()
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Cache Query tidak ber-scope perusahaan; tanpa ini, ganti perusahaan tetap
// menampilkan data perusahaan sebelumnya. Dipasang setelah `logout()` di atas
// supaya muat-ulang halaman tidak dianggap sebagai pergantian perusahaan.
installCompanyScopeReset(queryClient)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
