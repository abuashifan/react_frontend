import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AmountInputProps {
  /** Boleh string desimal dari API (mis. `"1000.00"`) — dinormalisasi di sini. */
  value: number | string | null | undefined
  onChange: (value: number) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  /** Jumlah desimal yang boleh diketik. Nominal rupiah default 0. */
  decimals?: number
  /** Nilai 0 ditampilkan sebagai input kosong (pola baris jurnal). Default true. */
  blankOnZero?: boolean
  id?: string
  ariaLabel?: string
  onFocus?: () => void
  onBlur?: () => void
}

const GROUP_SEPARATOR = '.'
const DECIMAL_SEPARATOR = ','

/**
 * Format angka ke notasi id-ID (`1.250.000` / `1.250.000,75`) tanpa memakai
 * `Intl` per ketikan — pemformatan berjalan pada setiap keystroke, jadi
 * dibuat murah dan bebas efek pembulatan `Intl` pada input setengah jadi.
 */
function formatAmount(raw: string, decimals: number): string {
  if (raw === '') return ''

  const [intPart, decPart] = raw.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR)

  if (decimals > 0 && decPart !== undefined) {
    return `${grouped}${DECIMAL_SEPARATOR}${decPart.slice(0, decimals)}`
  }

  return grouped
}

/**
 * Ambil bentuk numerik "mentah" (titik = pemisah desimal) dari apa pun yang
 * diketik user: pemisah ribuan dibuang, koma diperlakukan sebagai desimal.
 */
function parseTyped(input: string, decimals: number): string {
  const cleaned = input.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(/,/g, '.')
  if (cleaned === '') return ''

  const [intPart, ...rest] = cleaned.split('.')
  const normalizedInt = intPart.replace(/^0+(?=\d)/, '')

  if (decimals === 0 || rest.length === 0) return normalizedInt
  return `${normalizedInt}.${rest.join('').slice(0, decimals)}`
}

/**
 * Input nominal uang dengan pemisah ribuan yang tampil langsung saat diketik.
 *
 * Menggantikan `<Input type="number">` untuk semua field uang: `type="number"`
 * merender `1250000` tanpa pemisah apa pun sehingga nominal besar praktis
 * tidak terbaca di layar tablet, dan spinner-nya mudah tersenggol.
 * Komponen ini memakai `inputMode="decimal"` — keypad angka tetap muncul di
 * tablet, tapi tampilannya tetap terformat.
 *
 * Nilai yang dikirim ke `onChange` selalu `number` (bukan string terformat),
 * jadi bisa langsung dipakai untuk kalkulasi dan payload API.
 */
export function AmountInput({
  value,
  onChange,
  disabled,
  placeholder = '0',
  className,
  decimals = 0,
  blankOnZero = true,
  id,
  ariaLabel,
  onFocus,
  onBlur,
}: AmountInputProps) {
  // Normalisasi dulu: nilai `"0.00"` dari API harus diperlakukan sama dengan
  // `0`, kalau tidak sel yang kosong tampil sebagai "0,00".
  const numeric = value === null || value === undefined || value === '' ? null : Number(value)
  const externalRaw =
    numeric === null || !Number.isFinite(numeric) || (blankOnZero && numeric === 0) ? '' : String(numeric)

  // Simpan teks yang sedang diketik supaya keadaan setengah jadi (mis. "1.250,"
  // atau "0") tidak dipaksa balik oleh nilai numerik hasil parse.
  const [draft, setDraft] = useState(externalRaw)
  const [prevExternal, setPrevExternal] = useState(externalRaw)

  if (externalRaw !== prevExternal) {
    setPrevExternal(externalRaw)
    if (parseTyped(draft, decimals) !== externalRaw) setDraft(externalRaw)
  }

  const handleChange = (input: string) => {
    const raw = parseTyped(input, decimals)
    setDraft(raw)
    setPrevExternal(raw)
    onChange(raw === '' ? 0 : Number(raw))
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={ariaLabel}
      value={formatAmount(draft, decimals)}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        'h-8 w-full rounded-md border border-[#d9e2e5] bg-white px-2 text-right text-[12px] tabular-nums text-[#24323a]',
        'focus:border-[#5c9ead] focus:outline-none focus:shadow-[0_0_0_2px_rgba(92,158,173,0.15)]',
        'disabled:cursor-not-allowed disabled:bg-[#f8fbfc] disabled:text-[#94a3b8]',
        className,
      )}
    />
  )
}
