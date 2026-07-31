import { Checkbox } from '@/components/ui/checkbox'
import { FilterSection } from '@/components/shared/layout/FilterSidebar'

export interface SingleCheckboxFilterOption<T> {
  value: T
  label: string
}

interface SingleCheckboxFilterProps<T> {
  title: string
  options: SingleCheckboxFilterOption<T>[]
  value: T
  onChange: (value: T) => void
  note?: string
}

/** Filter mutually-exclusive lewat sederet checkbox (bukan multi-select) —
 * pilih satu opsi otomatis melepas opsi lainnya. Untuk multi-select gunakan MultiCheckboxFilter. */
export function SingleCheckboxFilter<T>({ title, options, value, onChange, note }: SingleCheckboxFilterProps<T>) {
  return (
    <FilterSection title={title}>
      {options.map((option) => (
        <label key={String(option.value)} className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={value === option.value}
            onCheckedChange={(checked) => checked && onChange(option.value)}
          />
          <span className="text-[12px] text-[#334155]">{option.label}</span>
        </label>
      ))}
      {note && <p className="pt-1 text-[11px] leading-4 text-[#94a3b8]">{note}</p>}
    </FilterSection>
  )
}
