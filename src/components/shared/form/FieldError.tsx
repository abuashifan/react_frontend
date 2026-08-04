/**
 * Catatan error kecil di bawah input.
 *
 * Backend menjawab error validasi dengan pesan generik ("Periksa kembali isian
 * yang ditandai"), jadi field yang bermasalah wajib benar-benar ditandai —
 * border merah pada input (lihat `fieldErrorClass` di `@/lib/utils`) dan
 * keterangan singkat ini tepat di bawahnya.
 *
 * `SearchableSelect` sudah punya prop `error` sendiri — untuk komponen itu
 * cukup teruskan pesannya, jangan tambahkan `FieldError` lagi.
 */
interface FieldErrorProps {
  /** Pesan dari `formState.errors.<field>?.message`. Tidak render apa pun bila kosong. */
  message?: string
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return <p className="text-[11px] text-red-500">{message}</p>
}
