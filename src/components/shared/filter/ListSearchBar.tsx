import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListSearchBarProps {
  /** Nilai search yang sudah di-debounce (state di halaman pemanggil). */
  value: string
  /** Setter state di halaman pemanggil — idealnya setState langsung agar stabil antar render. */
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
  /**
   * Keterangan kecil di bawah kotak pencarian yang menyebutkan kolom apa saja
   * yang benar-benar dicari server. Placeholder saja tidak cukup: teksnya
   * terpotong pada input sempit dan hilang begitu user mulai mengetik,
   * sehingga cakupan pencarian mudah disalahpahami.
   */
  hint?: string
}

/**
 * Search bar universal untuk halaman list — ditempatkan di bagian atas
 * `FilterSidebar`, di atas `FilterSection` pertama.
 *
 * Sebelumnya spec-13 §Filter Universal menaruhnya di content area. Diubah
 * atas permintaan pemilik produk: kotak pencarian di atas tabel memakan
 * tinggi yang lebih berharga untuk baris data, sedangkan sidebar filter
 * punya ruang menganggur di bagian atasnya. Jurnal Umum dipindah lebih dulu
 * sebagai contoh, lalu 21 halaman daftar lain menyusul.
 *
 * Pakai `className="w-full max-w-none"` di sidebar — `max-w-sm` bawaan
 * komponen ini dirancang untuk content area yang lebar.
 *
 * Catatan: tiga halaman Persediaan (Mutasi/Penyesuaian/Opname Stok) memakai
 * `<Input>` biasa di dalam `<FilterSection title="Cari">`, bukan komponen ini.
 * Hasil visualnya mirip tapi tanpa debounce dan tombol bersihkan.
 */
export function ListSearchBar({
  value,
  onChange,
  placeholder = 'Cari di semua kolom...',
  className,
  debounceMs = 400,
  hint,
}: ListSearchBarProps) {
  const [inputValue, setInputValue] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  // Sinkronkan saat value direset dari luar (mis. tombol "Reset Filter"). Pola
  // "adjust state on prop change" saat render agar tidak memicu cascading render dari effect.
  if (value !== prevValue) {
    setPrevValue(value)
    setInputValue(value)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onChange(inputValue.trim())
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [inputValue, debounceMs, onChange])

  return (
    <div className={cn('w-full max-w-sm', className)}>
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-describedby={hint ? 'list-search-hint' : undefined}
          className="h-9 w-full rounded-md border border-[#d9e2e5] bg-white pl-9 pr-8 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5c9ead] lg:text-sm"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue('')}
            aria-label="Bersihkan pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {hint && (
        <p id="list-search-hint" className="mt-1 text-[11px] leading-4 text-[#94a3b8]">
          {hint}
        </p>
      )}
    </div>
  )
}
