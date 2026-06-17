import { Checkbox } from '@/components/ui/checkbox'
import { FilterSection } from '@/components/shared/layout/FilterSidebar'

export interface MultiCheckboxFilterOption<T extends string> {
  value: T
  label: string
}

interface MultiCheckboxFilterProps<T extends string> {
  title: string
  options: MultiCheckboxFilterOption<T>[]
  value: T[]
  onChange: (value: T[]) => void
  note?: string
}

export function MultiCheckboxFilter<T extends string>({
  title,
  options,
  value,
  onChange,
  note,
}: MultiCheckboxFilterProps<T>) {
  const toggleValue = (nextValue: T) => {
    if (value.includes(nextValue)) {
      onChange(value.filter((current) => current !== nextValue))
      return
    }

    onChange([...value, nextValue])
  }

  return (
    <FilterSection title={title}>
      <div className="flex flex-col gap-1">
        {options.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-[#f8fbfc]">
            <Checkbox checked={value.includes(option.value)} onCheckedChange={() => toggleValue(option.value)} />
            <span className="text-[12px] capitalize text-[#334155]">{option.label}</span>
          </label>
        ))}
      </div>
      {note && <p className="pt-1 text-[11px] leading-4 text-[#94a3b8]">{note}</p>}
    </FilterSection>
  )
}
