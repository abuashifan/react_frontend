import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const selectClass =
  'h-9 text-[13px] w-full rounded-md border border-[#d9e2e5] bg-white px-3 text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]/40'

/**
 * Pilihan sheet untuk berkas .xlsx berisi lebih dari satu sheet. Tidak
 * digambar sama sekali untuk CSV atau berkas satu sheet — tidak ada yang
 * bisa dipilih.
 */
export function SheetPicker({
  sheets,
  value,
  disabled,
  onChange,
  className,
}: {
  sheets: string[]
  value: string | null
  disabled: boolean
  onChange: (name: string) => void
  className?: string
}) {
  if (sheets.length < 2) return null

  const current = value ?? sheets[0]

  return (
    <div className={cn('mb-4 flex flex-col gap-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3', className)}>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sheet yang diimpor</Label>
      <select
        className={selectClass}
        value={current}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value !== current) onChange(e.target.value)
        }}
      >
        {sheets.map((name, index) => (
          <option key={name} value={name}>
            {name}
            {index === 0 ? ' (sheet pertama)' : ''}
          </option>
        ))}
      </select>
      <p className="text-[11px] text-[#64748b]">
        Berkas ini punya {sheets.length} sheet. Mengganti sheet mengulang pemetaan kolom dan pratinjau.
      </p>
    </div>
  )
}
