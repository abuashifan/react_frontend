import { FormField } from '@/components/shared/form/FormField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBudgetPeriods } from '../hooks/useBudgetPeriods'
import type { BudgetPeriod } from '../types/budget.types'

interface Props {
  /** `null` = belum dipilih. Disimpan sebagai number, bukan string id. */
  value: number | null
  onChange: (periodId: number | null) => void
  label?: string
  required?: boolean
  /** Batasi ke pagu yang masih `open` — mis. form yang menulis ke periode itu. */
  openOnly?: boolean
  id?: string
  className?: string
  /** Ditampilkan saat daftar kosong, mis. mengarahkan user membuat pagu dulu. */
  emptyHint?: string
  /** Pesan validasi dari react-hook-form/backend. */
  error?: string
}

/**
 * Pemilih pagu/periode anggaran.
 *
 * Blok `Label` + `Select` + `periods.map` yang sama disalin di enam halaman
 * (Analisis, Perbandingan, Dashboard, Cash Budget, Ringkasan Proyek, Buat
 * Budget) — masing-masing dengan lebar, id, dan penanda wajib yang sedikit
 * berbeda. Dikumpulkan di sini supaya konsisten dan `value`-nya bertipe number,
 * bukan string yang harus di-`Number()` ulang di tiap pemanggil.
 */
export function BudgetPeriodSelect({
  value,
  onChange,
  label = 'Periode Anggaran',
  required = false,
  openOnly = false,
  id,
  className = 'w-52',
  emptyHint,
  error,
}: Props) {
  const { periods, isLoading } = useBudgetPeriods()
  const options: BudgetPeriod[] = openOnly ? periods.filter((p) => p.status === 'open') : periods

  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      className={className}
      error={error}
      hint={!isLoading && options.length === 0 ? emptyHint : undefined}
    >
      <Select
        value={value !== null ? String(value) : ''}
        onValueChange={(v) => onChange(v === '' ? null : Number(v))}
        disabled={isLoading || options.length === 0}
      >
        <SelectTrigger id={id} className="h-8 text-[12px]">
          <SelectValue placeholder={isLoading ? 'Memuat...' : 'Pilih periode...'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((period) => (
            <SelectItem key={period.id} value={String(period.id)}>{period.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
