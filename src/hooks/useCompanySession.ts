import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  closeDatabase,
  focusFormTab,
  getUnsavedForms,
  logoutFromApp,
  type UnsavedFormRef,
} from '@/lib/companySession'

export type SessionAction = 'close-database' | 'logout'

interface BlockedState {
  action: SessionAction
  forms: UnsavedFormRef[]
}

/**
 * Menjalankan Tutup Database / Keluar dengan penjaga form yang belum tersimpan.
 *
 * Penjaganya MEMBLOKIR, bukan meminta konfirmasi: kedua aksi menutup semua tab,
 * jadi form yang sedang diisi hilang dari layar. User harus menyimpan atau
 * menutup formnya sendiri lebih dulu — tidak ada tombol "lanjutkan saja", karena
 * pilihan itu berarti membuang pekerjaan tanpa cara membatalkannya.
 *
 * Pengecualian yang disengaja: logout otomatis karena sesi habis
 * (`useSessionTimeout`) tidak lewat sini. Sesi yang sudah kedaluwarsa tidak bisa
 * ditahan oleh state klien; isian yang belum tersimpan masih tersimpan sebagai
 * draft di localStorage dan muncul lagi setelah login berikutnya.
 */
export function useCompanySession() {
  const navigate = useNavigate()
  const [blocked, setBlocked] = useState<BlockedState | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  async function run(action: SessionAction) {
    const forms = getUnsavedForms()
    if (forms.length > 0) {
      setBlocked({ action, forms })
      return
    }

    setIsBusy(true)
    try {
      if (action === 'logout') {
        await logoutFromApp()
        navigate('/login', { replace: true })
      } else {
        closeDatabase()
        navigate('/select-company', { replace: true })
      }
    } finally {
      setIsBusy(false)
    }
  }

  return {
    isBusy,
    blocked,
    requestCloseDatabase: () => run('close-database'),
    requestLogout: () => run('logout'),
    dismissBlocked: () => setBlocked(null),
    /** Tutup dialog lalu bawa user ke form yang menahan aksi tadi. */
    goToForm: (path: string) => {
      setBlocked(null)
      focusFormTab(path)
    },
  }
}
