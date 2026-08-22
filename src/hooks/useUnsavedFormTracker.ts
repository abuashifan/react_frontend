import { useEffect } from 'react'
import { useFormState, type Control, type FieldValues } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { useUnsavedFormsStore } from '@/stores/useUnsavedFormsStore'

interface UseUnsavedFormTrackerOptions<TFormValues extends FieldValues> {
  control: Control<TFormValues>
  /** Matikan pelacakan, mis. saat form dalam mode baca-saja. */
  enabled?: boolean
}

/**
 * Mendaftarkan form ini sebagai "belum tersimpan" selama ada field yang diubah
 * user, dan mencabut pendaftaran saat form disimpan, di-reset, atau ditutup.
 *
 * ## Kenapa `dirtyFields`, bukan `isDirty`
 *
 * `isDirty` membandingkan seluruh nilai form dengan `defaultValues` lewat deep
 * equal. Hampir semua form di sini menyetel `defaultValues` sebagian saja (mis.
 * `CoaFormPage` hanya `account_type` dan `parent_account_id`), sehingga field
 * lain berubah dari `undefined` menjadi `''` begitu didaftarkan — `isDirty`
 * langsung `true` pada form yang belum disentuh sama sekali. Sudah diuji di
 * browser: form "Akun Baru" yang dibuka lalu didiamkan memblokir Tutup Database.
 *
 * `dirtyFields` hanya terisi lewat event perubahan, jadi mendaftarkan field tidak
 * membuatnya kotor. Ini juga alasan keberadaan draft di localStorage tidak dipakai
 * sebagai sinyal: draft ditulis untuk form yang baru dibuka juga.
 *
 * `reset(data)` mengosongkan `dirtyFields`, jadi form edit yang baru selesai
 * memuat data server dan form yang baru disimpan sama-sama terhitung bersih.
 *
 * ## Kenapa TIDAK dicabut saat unmount
 *
 * Form di-unmount juga ketika user cuma berpindah tab — tabnya masih terbuka.
 * Kalau dicabut di situ, form berisi isian yang ditinggalkan di tab lain akan
 * lolos dari penjaga (sudah diuji: isi form COA, pindah ke tab Kontak, lalu
 * Keluar — tidak tertahan). Dan saat form itu di-mount lagi, `dirtyFields`-nya
 * kosong karena draft dipulihkan lewat `reset()`, jadi statusnya tidak pernah
 * kembali.
 *
 * Yang mencabut pendaftaran adalah penutupan tabnya di `useTabStore`
 * (`closeSecondaryTab` / `closePrimaryTab`) — menutup tab form memang berarti
 * user membuang isiannya. Entri yang tabnya sudah tidak ada juga diabaikan oleh
 * `getUnsavedForms()`, jadi entri basi tidak bisa memblokir apa pun.
 */
export function useUnsavedFormTracker<TFormValues extends FieldValues>({
  control,
  enabled = true,
}: UseUnsavedFormTrackerOptions<TFormValues>): void {
  const { pathname } = useLocation()
  const { dirtyFields } = useFormState({ control })
  const markUnsaved = useUnsavedFormsStore((state) => state.markUnsaved)
  const markSaved = useUnsavedFormsStore((state) => state.markSaved)
  const hasDirtyField = Object.keys(dirtyFields).length > 0

  useEffect(() => {
    if (enabled && hasDirtyField) {
      markUnsaved(pathname)
    } else {
      // Form bersih lagi (disimpan atau di-reset). Tidak ada cleanup unmount di
      // sini — lihat catatan di atas.
      markSaved(pathname)
    }
  }, [enabled, hasDirtyField, markSaved, markUnsaved, pathname])
}
