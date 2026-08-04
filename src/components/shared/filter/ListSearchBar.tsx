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
}

/**
 * Search bar universal untuk halaman list — selalu tampil di bagian atas
 * content area (bukan sidebar), sesuai spec-13 §Filter Universal.
 */
export function ListSearchBar({
  value,
  onChange,
  placeholder = 'Cari di semua kolom...',
  className,
  debounceMs = 400,
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
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
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
  )
}
