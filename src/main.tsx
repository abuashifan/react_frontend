import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { router } from '@/router'
import { useAuthStore } from '@/stores/useAuthStore'
import { installCompanyScopeReset } from '@/lib/companyScope'
import './index.css'

/**
 * Vite melempar event ini saat dynamic import() gagal (chunk 404) -- biasanya
 * karena index.html yang sudah dimuat browser masih menunjuk ke nama file
 * hash lama, padahal server sudah di-build ulang dengan hash baru dan chunk
 * lama sudah tidak ada. Tanpa penanganan ini, navigasi ke halaman mana pun
 * yang lazy-loaded (semua modul, lihat masing-masing `routes.tsx`) berakhir
 * di layar "Unexpected Application Error!" default React Router.
 *
 * Reload sekali mengambil index.html terbaru yang menunjuk ke hash yang
 * benar. Guard sessionStorage mencegah reload berulang tanpa henti kalau
 * penyebabnya bukan cache basi (mis. server memang sedang down) -- percobaan
 * kedua yang tetap gagal akan menampilkan error seperti biasa, bukan loop.
 */
window.addEventListener('vite:preloadError', () => {
  const key = 'vite-preload-reload-attempted'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  window.location.reload()
})

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
