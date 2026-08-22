import type { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTabStore } from '@/stores/useTabStore'

/**
 * Membuang seluruh cache TanStack Query setiap `activeCompanyId` berubah.
 *
 * ## Masalah yang diperbaiki
 *
 * Cache Query bersifat global dan query key-nya TIDAK memuat id perusahaan —
 * mis. `['master-data-coa', params]` sama persis untuk semua tenant. Padahal
 * tiap perusahaan punya database sendiri. Akibatnya, setelah ganti perusahaan,
 * daftar apa pun yang pernah dibuka akan menyajikan data perusahaan sebelumnya:
 * `staleTime: 30_000` membuatnya dianggap masih segar sehingga TIDAK ada
 * request sama sekali (terbukti: 0 request COA setelah dua kali ganti
 * perusahaan, isi tabel tetap milik perusahaan pertama).
 *
 * ## Mengapa di sini, bukan di halaman pemilih perusahaan
 *
 * Meletakkannya di `CompanyPickerPage` hanya menutup satu jalur; jalur lain yang
 * mengubah perusahaan di masa depan akan menghidupkan bug ini lagi tanpa suara.
 * Berlangganan langsung ke store membuat resetnya tidak bisa dilewati — apa pun
 * yang memanggil `setActiveCompany()` atau `logout()` ikut tercakup.
 *
 * ## Mengapa `clear()`, bukan menambahkan id perusahaan ke setiap query key
 *
 * Menyisipkan id ke key adalah alternatif yang benar juga, tapi berarti menyentuh
 * ~60 hook dan setiap hook baru harus ingat melakukannya. `clear()` berlaku untuk
 * semua hook yang ada maupun yang belum ditulis. Cache yang hilang memang biaya
 * yang dituju: data perusahaan lama tidak boleh dipakai lagi.
 */
export function installCompanyScopeReset(queryClient: QueryClient): void {
  // Dibaca SETELAH zustand-persist merehidrasi (storage-nya localStorage, jadi
  // rehidrasi sudah selesai saat modul ini dijalankan). Kalau dibaca sebelum
  // rehidrasi, muat-ulang halaman akan terlihat sebagai pergantian perusahaan
  // dan menutup semua tab user.
  let previousCompanyId = useAuthStore.getState().activeCompanyId

  useAuthStore.subscribe((state) => {
    const nextCompanyId = state.activeCompanyId
    if (nextCompanyId === previousCompanyId) return

    const leftACompany = previousCompanyId !== null
    previousCompanyId = nextCompanyId

    // Termasuk saat logout (id menjadi null): cache milik user sebelumnya tidak
    // boleh terbaca oleh user berikutnya di browser yang sama.
    queryClient.clear()

    // Hanya saat MENINGGALKAN sebuah perusahaan (ganti perusahaan atau logout).
    // Transisi null -> id pada login/muat-ulang bukan pergantian, dan tab yang
    // tersimpan di sessionStorage harus tetap utuh di sana.
    if (leftACompany) {
      useTabStore.getState().resetForCompanyChange()
    }
  })
}
